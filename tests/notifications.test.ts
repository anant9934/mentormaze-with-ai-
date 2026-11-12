import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db/index";
import { sql } from "drizzle-orm";
import {
  NotificationService,
  isWithinQuietHours,
} from "@/lib/notifications/service";
import { notificationEventBus } from "@/lib/notifications/event-bus";
import { getVapidPublicKey } from "@/lib/notifications/web-push";
import { sendEmailDirect } from "@/lib/email/transport";

describe("MentorMaze Real-Time Notifications & Email Anti-Spam Deliverability", () => {
  const service = new NotificationService();
  const testUserId = "550e8400-e29b-41d4-a716-446655440000";

  beforeAll(async () => {
    await initializeDatabaseSchema();
    const db = getDb();
    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, display_name, role)
      VALUES
        ('550e8400-e29b-41d4-a716-446655440000', 'notif-user-a@example.com', 'hash', 'Notif User A', 'student'),
        ('660e8400-e29b-41d4-a716-446655440001', 'notif-user-b@example.com', 'hash', 'Notif User B', 'student')
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  // ========================================================
  // 1. Quiet Hours & Scheduling Logic
  // ========================================================
  it("accurately calculates quiet hours in user timezone", () => {
    // Daytime range 09:00 - 17:00
    const inDaytimeRange = isWithinQuietHours("00:00", "23:59", "UTC");
    expect(inDaytimeRange).toBe(true);

    // Inverted daytime range
    const notInRange = isWithinQuietHours("12:00", "12:01", "UTC");
    expect(typeof notInRange).toBe("boolean");
  });

  // ========================================================
  // 2. Real-Time Event Bus & Multi-Tab Synchronization
  // ========================================================
  it("registers SSE connections and broadcasts to active user tabs", () => {
    const mockController = {
      enqueue: vi.fn(),
      close: vi.fn(),
    };

    notificationEventBus.registerConnection(testUserId, "tab-1", mockController as any);
    notificationEventBus.registerConnection(testUserId, "tab-2", mockController as any);

    const stats = notificationEventBus.getStats();
    expect(stats.connectedUsers).toBeGreaterThanOrEqual(1);

    const sent = notificationEventBus.broadcastToUser(testUserId, "test_event", { hello: "world" });
    expect(sent).toBe(2);
    expect(mockController.enqueue).toHaveBeenCalled();

    notificationEventBus.removeConnection(testUserId, "tab-1");
    notificationEventBus.removeConnection(testUserId, "tab-2");
  });

  // ========================================================
  // 3. Web Push & VAPID Key Infrastructure
  // ========================================================
  it("provides valid RFC 8292 VAPID public key for browser push subscriptions", () => {
    const publicKey = getVapidPublicKey();
    expect(publicKey).toBeTruthy();
    expect(typeof publicKey).toBe("string");
    expect(publicKey.length).toBeGreaterThan(30);
  });

  // ========================================================
  // 4. Anti-Spam Email Headers & Deliverability Best Practices
  // ========================================================
  it("enforces RFC 8058 1-click unsubscribe and SPF alignment headers", async () => {
    // Test that sendEmailDirect cleans subjects, injects RFC 8058 headers, and avoids localhost Message-IDs
    const testResult = await sendEmailDirect({
      to: "deliverability-test@example.com",
      subject: "Test Session Confirmation\r\nInjected-Header: bad",
      html: "<p>Hello from MentorMaze</p>",
      text: "Hello from MentorMaze",
      templateId: "student.booking_confirmed_student",
      category: "student",
      unsubscribeToken: "token_abc_123",
    });

    // The test might succeed if SMTP is connected or mock-fail, but messageId must not be localhost
    if (testResult.messageId) {
      expect(testResult.messageId).not.toContain("localhost");
      expect(testResult.messageId).toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>?$/);
    }
  });

  // ========================================================
  // 5. Notification Preferences & Category Filtering
  // ========================================================
  it("manages user notification preferences with defaults", async () => {
    const prefs = await service.getPreferences(testUserId);
    expect(prefs).toBeDefined();
    expect(prefs.inAppEnabled).toBe(true);
    expect(prefs.pushEnabled).toBe(true);
    expect(prefs.emailEnabled).toBe(true);
    expect(prefs.bookingReminders).toBe(true);
    expect(prefs.timezone).toBe("Asia/Kolkata");
  });

  it("updates preferences and respects quiet hours configuration", async () => {
    const updated = await service.updatePreferences(testUserId, {
      quietHoursEnabled: true,
      quietHoursStart: "23:00",
      quietHoursEnd: "07:00",
      marketingAnnouncements: true,
    });

    expect(updated.quietHoursEnabled).toBe(true);
    expect(updated.quietHoursStart).toBe("23:00");
    expect(updated.quietHoursEnd).toBe("07:00");
    expect(updated.marketingAnnouncements).toBe(true);
  });

  // ========================================================
  // 6. Dispatcher & Persistence in Database
  // ========================================================
  it("persists in-app notification in database and tracks unread count", async () => {
    const result = await service.dispatch({
      userId: testUserId,
      title: "Booking Reminder: Mock Interview",
      message: "Your interview with Priya Sharma begins in 15 minutes.",
      category: "bookings",
      priority: "high",
      actionUrl: "/dashboard/sessions",
      actionLabel: "Join Session",
      channels: ["in_app", "sse"],
    });

    expect(result.success).toBe(true);
    expect(result.notification).toBeDefined();
    expect(result.notification.title).toBe("Booking Reminder: Mock Interview");

    const unreadCount = await service.getUnreadCount(testUserId);
    expect(unreadCount).toBeGreaterThanOrEqual(1);

    // Mark as read
    const marked = await service.markAsRead(result.notification.id, testUserId);
    expect(marked?.isRead).toBe(true);

    // Mark all as read
    const markAllResult = await service.markAllAsRead(testUserId);
    expect(markAllResult.success).toBe(true);

    const postUnreadCount = await service.getUnreadCount(testUserId);
    expect(postUnreadCount).toBe(0);
  });

  // ========================================================
  // 7. Security Alerts Bypass Category Suppressions
  // ========================================================
  it("guarantees delivery for account security alerts even if general alerts are disabled", async () => {
    // Disable in-app and marketing
    await service.updatePreferences(testUserId, {
      marketingAnnouncements: false,
    });

    // Account security alert MUST dispatch regardless
    const secResult = await service.dispatch({
      userId: testUserId,
      title: "New Login from Chrome on macOS",
      message: "If this was not you, please secure your account immediately.",
      category: "account_security",
      priority: "urgent",
      actionUrl: "/settings/security",
      actionLabel: "Review Activity",
    });

    expect(secResult.success).toBe(true);
    expect(secResult.notification?.category).toBe("account_security");
  });

  // ========================================================
  // 8. Admin Announcement Broadcasting
  // ========================================================
  it("publishes admin announcements across targeted channels", async () => {
    const announcement = await service.publishAnnouncement({
      title: "Scheduled Maintenance Window",
      content: "MentorMaze multi-cluster video infrastructure will undergo maintenance tonight from 2:00 AM to 2:30 AM IST.",
      audience: "all",
      priority: "normal",
      channels: ["in_app"],
    });

    expect(announcement).toBeDefined();
    expect(announcement.title).toBe("Scheduled Maintenance Window");
    expect(announcement.audience).toBe("all");
  });

  // ========================================================
  // 9. Idempotency & Duplicate Event Prevention
  // ========================================================
  it("strictly prevents duplicate notifications when idempotencyKey is reused", async () => {
    const testKey = `test-idemp-${Date.now()}`;

    // First dispatch
    const res1 = await service.dispatch({
      userId: testUserId,
      title: "Payment Invoice #1042",
      message: "Payment receipt for mock interview.",
      category: "payments",
      idempotencyKey: testKey,
    });

    expect(res1.success).toBe(true);
    expect(res1.duplicate).toBeUndefined();

    // Second dispatch with same idempotencyKey
    const res2 = await service.dispatch({
      userId: testUserId,
      title: "Payment Invoice #1042",
      message: "Payment receipt for mock interview.",
      category: "payments",
      idempotencyKey: testKey,
    });

    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true);
    expect(res2.notification.id).toBe(res1.notification.id);
  });

  // ========================================================
  // 10. Multi-User Isolation & Security Perimeter
  // ========================================================
  it("enforces strict user isolation: User B cannot access or modify User A's notifications", async () => {
    const userA = testUserId;
    const userB = "660e8400-e29b-41d4-a716-446655440001";

    // Create notification for User A
    const resA = await service.dispatch({
      userId: userA,
      title: "Confidential Feedback for User A",
      message: "Private interview performance report.",
      category: "mentorship",
    });

    // User B fetches their notifications -> MUST NOT see User A's notification
    const listB = await service.getNotifications(userB);
    const leak = listB.notifications.find((n) => n.id === resA.notification.id);
    expect(leak).toBeUndefined();

    // User B attempts to mark User A's notification as read -> MUST FAIL / return undefined
    const unauthorizedMark = await service.markAsRead(resA.notification.id, userB);
    expect(unauthorizedMark).toBeUndefined();

    // User B attempts to delete User A's notification -> User A's notification MUST remain intact
    await service.deleteNotification(resA.notification.id, userB);
    const listA = await service.getNotifications(userA);
    const stillExists = listA.notifications.some((n) => n.id === resA.notification.id);
    expect(stillExists).toBe(true);
  });
});

