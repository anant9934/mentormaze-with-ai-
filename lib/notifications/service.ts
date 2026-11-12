/**
 * MentorMaze Real-Time Notification & Alert Management Service
 * Unifies In-App, Real-Time SSE, Browser Web Push, and Email
 * https://mentormaze.aitathastu.com
 */

import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { notificationEventBus } from "./event-bus";
import { sendWebPushNotification } from "./web-push";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import {
  NotificationCategory,
  NotificationPriority,
  NotificationDispatchInput,
  NotificationPreferencesInput,
  CreateAnnouncementInput,
  PushSubscriptionPayload,
  NotificationRecord,
} from "./types";

/**
 * Checks if current time is within user's configured quiet hours
 */
export function isWithinQuietHours(
  startStr: string = "22:00",
  endStr: string = "08:00",
  timezone: string = "Asia/Kolkata"
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.format(new Date()).split(":");
    const currentMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch {
    return false;
  }
}

export class NotificationService {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      try {
        await initializeDatabaseSchema();
        this.initialized = true;
      } catch (err) {
        console.error("Failed to initialize notification database schema:", err);
      }
    }
  }

  /**
   * Retrieves or creates default notification preferences for a user
   */
  public async getPreferences(userId: string) {
    await this.ensureInitialized();
    const db = getDb();

    const existing = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId))
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Create default preferences
    const [created] = await db
      .insert(schema.notificationPreferences)
      .values({
        userId,
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        bookingReminders: true,
        chatMessages: true,
        mentorshipUpdates: true,
        mockInterviewAlerts: true,
        paymentReceipts: true,
        marketingAnnouncements: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "Asia/Kolkata",
      })
      .returning();

    return created;
  }

  /**
   * Updates notification preferences for a user
   */
  public async updatePreferences(userId: string, input: NotificationPreferencesInput) {
    await this.ensureInitialized();
    const db = getDb();

    // Ensure preference row exists
    await this.getPreferences(userId);

    const [updated] = await db
      .update(schema.notificationPreferences)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schema.notificationPreferences.userId, userId))
      .returning();

    return updated;
  }

  /**
   * Dispatches a notification across configured channels (In-App, SSE, Push, Email)
   */
  public async dispatch(input: NotificationDispatchInput) {
    await this.ensureInitialized();
    const db = getDb();

    const category = input.category || "general";
    const priority = input.priority || "normal";
    const channels = input.channels || ["in_app", "sse", "push"];

    // 0. Idempotency Deduplication (prevent duplicate event processing)
    if (input.idempotencyKey) {
      const existing = await db
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.idempotencyKey, input.idempotencyKey))
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          success: true,
          notification: existing[0],
          duplicate: true,
          delivery: {
            inApp: true,
            sse: false,
            pushCount: 0,
            quietHoursApplied: false,
          },
        };
      }
    }

    // 1. Fetch user preferences
    const preferences = await this.getPreferences(input.userId);

    // 2. Evaluate Category Preferences
    if (!input.skipPreferencesCheck && category !== "account_security") {
      if (category === "bookings" && !preferences.bookingReminders) {
        return { success: false, reason: "Suppressed by user booking reminder preferences" };
      }
      if (category === "messages" && !preferences.chatMessages) {
        return { success: false, reason: "Suppressed by user chat message preferences" };
      }
      if (category === "mentorship" && !preferences.mentorshipUpdates) {
        return { success: false, reason: "Suppressed by user mentorship preferences" };
      }
      if (category === "mock_interviews" && !preferences.mockInterviewAlerts) {
        return { success: false, reason: "Suppressed by user mock interview preferences" };
      }
      if (category === "payments" && !preferences.paymentReceipts) {
        return { success: false, reason: "Suppressed by user payment preferences" };
      }
      if (category === "announcements" && !preferences.marketingAnnouncements) {
        return { success: false, reason: "Suppressed by user announcement preferences" };
      }
    }

    // 3. Evaluate Quiet Hours (Account security and urgent priority always bypass quiet hours)
    const inQuietHours =
      preferences.quietHoursEnabled &&
      priority !== "urgent" &&
      category !== "account_security" &&
      isWithinQuietHours(
        preferences.quietHoursStart,
        preferences.quietHoursEnd,
        preferences.timezone
      );

    // 4. Persist in PostgreSQL (Single source of truth)
    const [notification] = await db
      .insert(schema.notifications)
      .values({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || category,
        category,
        priority,
        linkUrl: input.linkUrl || input.actionUrl,
        actionUrl: input.actionUrl || input.linkUrl,
        actionLabel: input.actionLabel,
        idempotencyKey: input.idempotencyKey || null,
        isRead: false,
        metadata: input.metadata || {},
      })
      .returning();

    // Log In-App delivery
    await db.insert(schema.notificationDeliveries).values({
      notificationId: notification.id,
      channel: "in_app",
      status: preferences.inAppEnabled ? "delivered" : "suppressed",
      errorMessage: preferences.inAppEnabled ? null : "User disabled in-app notifications",
    });

    // 5. Broadcast via Real-Time SSE to all open tabs of the user
    let sseDelivered = false;
    if (channels.includes("sse") && preferences.inAppEnabled) {
      const unreadCount = await this.getUnreadCount(input.userId);
      const tabsReached = notificationEventBus.broadcastToUser(input.userId, "notification", {
        notification,
        unreadCount,
      });
      sseDelivered = tabsReached > 0;

      await db.insert(schema.notificationDeliveries).values({
        notificationId: notification.id,
        channel: "sse",
        status: sseDelivered ? "delivered" : "queued",
        errorMessage: sseDelivered ? null : "No active browser tabs connected",
      });
    }

    // 6. Deliver Browser Web Push (If enabled and not muted by quiet hours)
    let pushDelivered = 0;
    if (
      channels.includes("push") &&
      preferences.pushEnabled &&
      !inQuietHours
    ) {
      const subscriptions = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.userId, input.userId));

      for (const sub of subscriptions) {
        const pushResult = await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          {
            title: input.title,
            body: input.message,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            data: {
              url: input.actionUrl || input.linkUrl || "/notifications",
              notificationId: notification.id,
              category,
            },
          }
        );

        if (pushResult.success) {
          pushDelivered++;
          await db.insert(schema.notificationDeliveries).values({
            notificationId: notification.id,
            channel: "push",
            status: "delivered",
          });
        } else if (pushResult.isExpired) {
          // Auto-prune dead/revoked subscription
          await db
            .delete(schema.pushSubscriptions)
            .where(eq(schema.pushSubscriptions.endpoint, sub.endpoint));

          await db.insert(schema.notificationDeliveries).values({
            notificationId: notification.id,
            channel: "push",
            status: "failed",
            errorMessage: "Subscription expired/revoked; removed from database",
          });
        } else {
          await db.insert(schema.notificationDeliveries).values({
            notificationId: notification.id,
            channel: "push",
            status: "failed",
            errorMessage: pushResult.error || "Web push delivery failed",
          });
        }
      }
    } else if (inQuietHours && preferences.pushEnabled) {
      await db.insert(schema.notificationDeliveries).values({
        notificationId: notification.id,
        channel: "push",
        status: "suppressed",
        errorMessage: "Muted during user quiet hours",
      });
    }

    // 7. Deliver Email Notification (if requested and enabled)
    if (channels.includes("email") && preferences.emailEnabled && !inQuietHours) {
      try {
        const [user] = await db
          .select({ email: schema.users.email, displayName: schema.users.displayName })
          .from(schema.users)
          .where(eq(schema.users.id, input.userId));

        if (user) {
          await dispatchEmailEvent({
            eventType: `notification.${category}`,
            recipient: {
              email: user.email,
              name: user.displayName || undefined,
              userId: input.userId,
            },
            variables: {
              title: input.title,
              message: input.message,
              actionUrl: input.actionUrl || "https://mentormaze.aitathastu.com/notifications",
            },
          });

          await db.insert(schema.notificationDeliveries).values({
            notificationId: notification.id,
            channel: "email",
            status: "delivered",
          });
        }
      } catch (err: any) {
        await db.insert(schema.notificationDeliveries).values({
          notificationId: notification.id,
          channel: "email",
          status: "failed",
          errorMessage: err.message,
        });
      }
    }

    return {
      success: true,
      notification,
      delivery: {
        inApp: preferences.inAppEnabled,
        sse: sseDelivered,
        pushCount: pushDelivered,
        quietHoursApplied: inQuietHours,
      },
    };
  }

  /**
   * Retrieves notifications with filters and pagination
   */
  public async getNotifications(
    userId: string,
    options: {
      category?: string;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    await this.ensureInitialized();
    const db = getDb();
    const limit = Math.min(options.limit || 20, 50);
    const offset = options.offset || 0;

    let conditions: any[] = [eq(schema.notifications.userId, userId)];

    if (options.unreadOnly) {
      conditions.push(eq(schema.notifications.isRead, false));
    }

    if (options.category && options.category !== "all" && options.category !== "unread") {
      conditions.push(eq(schema.notifications.category, options.category));
    }

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: rows,
      unreadCount,
      limit,
      offset,
      hasMore: rows.length === limit,
    };
  }

  /**
   * Count unread notifications for a user
   */
  public async getUnreadCount(userId: string): Promise<number> {
    await this.ensureInitialized();
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      );

    return Number(result[0]?.count || 0);
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string) {
    await this.ensureInitialized();
    const db = getDb();

    const [updated] = await db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId)
        )
      )
      .returning();

    if (updated) {
      const unreadCount = await this.getUnreadCount(userId);
      // Sync across all tabs
      notificationEventBus.broadcastToUser(userId, "read_status", {
        notificationId,
        unreadCount,
      });
    }

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string) {
    await this.ensureInitialized();
    const db = getDb();

    await db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      );

    // Sync across all open tabs
    notificationEventBus.broadcastToUser(userId, "read_all", {
      unreadCount: 0,
      timestamp: new Date().toISOString(),
    });

    return { success: true, unreadCount: 0 };
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string, userId: string) {
    await this.ensureInitialized();
    const db = getDb();

    await db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId)
        )
      );

    const unreadCount = await this.getUnreadCount(userId);
    notificationEventBus.broadcastToUser(userId, "notification_deleted", {
      notificationId,
      unreadCount,
    });

    return { success: true, unreadCount };
  }

  /**
   * Register a Web Push subscription
   */
  public async registerPushSubscription(
    userId: string,
    payload: PushSubscriptionPayload
  ) {
    await this.ensureInitialized();
    const db = getDb();

    // Upsert subscription
    await db
      .insert(schema.pushSubscriptions)
      .values({
        userId,
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        userAgent: payload.userAgent || null,
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
          userAgent: payload.userAgent || null,
        },
      });

    return { success: true };
  }

  /**
   * Remove a Web Push subscription
   */
  public async unregisterPushSubscription(endpoint: string) {
    await this.ensureInitialized();
    const db = getDb();

    await db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint));

    return { success: true };
  }

  /**
   * Admin: Publish platform announcement to targeted audience
   */
  public async publishAnnouncement(input: CreateAnnouncementInput) {
    await this.ensureInitialized();
    const db = getDb();

    // 1. Resolve recipients based on audience
    let targetUsers: { id: string }[] = [];
    if (input.audience === "students") {
      targetUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "student"));
    } else if (input.audience === "mentors") {
      targetUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "mentor"));
    } else if (input.audience === "admins") {
      targetUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "admin"));
    } else {
      // "all"
      targetUsers = await db.select({ id: schema.users.id }).from(schema.users);
    }

    // 2. Insert Announcement Record
    const [announcement] = await db
      .insert(schema.notificationAnnouncements)
      .values({
        title: input.title,
        content: input.content,
        audience: input.audience,
        priority: input.priority || "normal",
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        channels: input.channels || ["in_app", "push"],
        publishedByUserId: input.publishedByUserId,
        recipientCount: targetUsers.length,
      })
      .returning();

    // 3. Dispatch to all recipient users
    const channelsToDispatch = input.channels || ["in_app", "push"];
    for (const recipient of targetUsers) {
      await this.dispatch({
        userId: recipient.id,
        title: input.title,
        message: input.content,
        type: "system",
        category: "announcements",
        priority: input.priority || "normal",
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        channels: channelsToDispatch as any,
      });
    }

    return announcement;
  }

  /**
   * Schedule session reminders for bookings (24h, 1h, 15m)
   */
  public async scheduleBookingReminders(booking: {
    id: string;
    studentUserId: string;
    mentorUserId: string;
    startTime: Date;
    title: string;
  }) {
    await this.ensureInitialized();
    const db = getDb();
    const now = new Date();
    const sessionTime = new Date(booking.startTime).getTime();

    const reminders = [
      { type: "reminder_24h", offsetMs: 24 * 60 * 60 * 1000 },
      { type: "reminder_1h", offsetMs: 60 * 60 * 1000 },
      { type: "reminder_15m", offsetMs: 15 * 60 * 1000 },
    ];

    for (const r of reminders) {
      const scheduledFor = new Date(sessionTime - r.offsetMs);
      if (scheduledFor > now) {
        // Schedule for student
        await db.insert(schema.scheduledNotifications).values({
          bookingId: booking.id,
          userId: booking.studentUserId,
          reminderType: r.type,
          scheduledFor,
          status: "pending",
        });

        // Schedule for mentor
        await db.insert(schema.scheduledNotifications).values({
          bookingId: booking.id,
          userId: booking.mentorUserId,
          reminderType: r.type,
          scheduledFor,
          status: "pending",
        });
      }
    }
  }

  /**
   * Cancel reminders when a booking is rescheduled or cancelled
   */
  public async cancelBookingReminders(bookingId: string) {
    await this.ensureInitialized();
    const db = getDb();

    await db
      .update(schema.scheduledNotifications)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(schema.scheduledNotifications.bookingId, bookingId),
          eq(schema.scheduledNotifications.status, "pending")
        )
      );
  }

  /**
   * Process pending scheduled reminders
   */
  public async processScheduledReminders() {
    await this.ensureInitialized();
    const db = getDb();
    const now = new Date();

    const pending = await db
      .select()
      .from(schema.scheduledNotifications)
      .where(
        and(
          eq(schema.scheduledNotifications.status, "pending"),
          sql`${schema.scheduledNotifications.scheduledFor} <= ${now}`
        )
      )
      .limit(50);

    let processed = 0;

    for (const item of pending) {
      let timeText = "soon";
      if (item.reminderType === "reminder_24h") timeText = "in 24 hours";
      if (item.reminderType === "reminder_1h") timeText = "in 1 hour";
      if (item.reminderType === "reminder_15m") timeText = "in 15 minutes";

      await this.dispatch({
        userId: item.userId,
        title: `Upcoming Session Reminder`,
        message: `Your scheduled mentorship session starts ${timeText}. Prepare your notes and test your audio/video setup.`,
        category: "bookings",
        priority: item.reminderType === "reminder_15m" ? "high" : "normal",
        actionUrl: `/dashboard/sessions`,
        actionLabel: "View Session",
      });

      await db
        .update(schema.scheduledNotifications)
        .set({ status: "sent" })
        .where(eq(schema.scheduledNotifications.id, item.id));

      processed++;
    }

    return { processed };
  }

  /**
   * Admin statistics
   */
  public async getAdminStats() {
    await this.ensureInitialized();
    const db = getDb();

    const [totalNotifications] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications);

    const [totalDeliveries] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notificationDeliveries);

    const [pushSubsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pushSubscriptions);

    const [announcementsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notificationAnnouncements);

    const eventBusStats = notificationEventBus.getStats();

    return {
      totalDispatched: Number(totalNotifications?.count || 0),
      totalDeliveries: Number(totalDeliveries?.count || 0),
      activePushSubscriptions: Number(pushSubsCount?.count || 0),
      announcementsCount: Number(announcementsCount?.count || 0),
      connectedUsers: eventBusStats.connectedUsers,
      connectedTabs: eventBusStats.connectedTabs,
    };
  }

  /**
   * Admin delivery logs
   */
  public async getDeliveryLogs(limit = 50, offset = 0) {
    await this.ensureInitialized();
    const db = getDb();

    const logs = await db
      .select({
        id: schema.notificationDeliveries.id,
        notificationId: schema.notificationDeliveries.notificationId,
        channel: schema.notificationDeliveries.channel,
        status: schema.notificationDeliveries.status,
        errorMessage: schema.notificationDeliveries.errorMessage,
        deliveredAt: schema.notificationDeliveries.deliveredAt,
        title: schema.notifications.title,
        category: schema.notifications.category,
        priority: schema.notifications.priority,
        userId: schema.notifications.userId,
      })
      .from(schema.notificationDeliveries)
      .leftJoin(
        schema.notifications,
        eq(schema.notificationDeliveries.notificationId, schema.notifications.id)
      )
      .orderBy(desc(schema.notificationDeliveries.deliveredAt))
      .limit(limit)
      .offset(offset);

    return logs;
  }
}

export const notificationService = new NotificationService();

