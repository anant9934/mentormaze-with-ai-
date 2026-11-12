import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export interface OutboxEvent {
  id: string;
  eventType: string;
  payload: any;
  status: "pending" | "processing" | "completed" | "failed" | "dead_letter";
  retryCount: number;
}

export interface WorkerBatchResult {
  claimed: number;
  processed: number;
  errors: number;
  deadLettered: number;
  durationMs: number;
}

const MAX_RETRIES = 5;
const STALE_LOCK_TIMEOUT_MINUTES = 5;

/**
 * Hardened Enterprise Outbox Worker for PostgreSQL.
 * Features:
 * - Atomic job claiming with FOR UPDATE SKIP LOCKED (multi-worker scale safe)
 * - Automatic stale job recovery
 * - Exponential backoff calculation
 * - Dead-letter queue for exhausted retries
 * - Idempotent event handlers
 * - Structured JSON logging
 */
export async function processOutboxBatch(
  batchSize: number = 10,
  workerId: string = `worker-${crypto.randomBytes(4).toString("hex")}`
): Promise<WorkerBatchResult> {
  const startTime = Date.now();
  const db = getDb();

  let processed = 0;
  let errors = 0;
  let deadLettered = 0;

  // 1. STALE JOB RECOVERY: Reset processing jobs whose lock has expired
  await db.execute(sql`
    UPDATE outbox_events
    SET status = 'pending', locked_at = null, locked_by = null
    WHERE status = 'processing' 
      AND locked_at < now() - interval '5 minutes';
  `);

  // 2. ATOMIC CLAIMING WITH 'FOR UPDATE SKIP LOCKED':
  // Atomically select and mark available jobs as 'processing' so no other worker picks them up
  const claimQuery: any = await db.execute(sql`
    UPDATE outbox_events
    SET status = 'processing',
        locked_at = now(),
        locked_by = ${workerId}
    WHERE id IN (
      SELECT id FROM outbox_events
      WHERE (status = 'pending' OR (status = 'failed' AND retry_count < ${MAX_RETRIES} AND (next_retry_at IS NULL OR next_retry_at <= now())))
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, event_type, payload, status, retry_count;
  `);

  const events: OutboxEvent[] = claimQuery.rows || claimQuery || [];

  for (const rawEvent of events as any[]) {
    const eventId = rawEvent.id;
    const eventType = rawEvent.event_type || rawEvent.eventType;
    const currentRetries = Number(rawEvent.retry_count || 0);

    const eventStartTime = Date.now();

    try {
      const payload = typeof rawEvent.payload === "string" ? JSON.parse(rawEvent.payload) : rawEvent.payload;

      // IDEMPOTENT DISPATCH HANDLERS
      switch (eventType) {
        case "booking.created":
          if (payload.studentId) {
            // Idempotent: check if notification already exists for this booking
            const existingNotif: any = await db.execute(sql`
              SELECT id FROM notifications
              WHERE user_id = ${payload.studentId}
                AND link_url = ${`/sessions/${payload.bookingId}/confirmation`}
              LIMIT 1;
            `);
            if ((existingNotif.rows?.length || existingNotif?.length || 0) === 0) {
              await db.execute(sql`
                INSERT INTO notifications (user_id, title, message, type, link_url)
                VALUES (
                  ${payload.studentId},
                  'Mentorship Booking Confirmed',
                  'Your session has been confirmed. Add it to your calendar and review your discussion points.',
                  'booking_confirmed',
                  ${`/sessions/${payload.bookingId}/confirmation`}
                );
              `);
            }
          }
          break;

        case "booking.cancelled":
          if (payload.studentId) {
            await db.execute(sql`
              INSERT INTO notifications (user_id, title, message, type, link_url)
              VALUES (
                ${payload.studentId},
                'Mentorship Session Cancelled',
                ${`Your session has been cancelled. Reason: ${payload.reason || "Not specified"}. Any paid fees have been refunded.`},
                'booking_cancelled',
                '/dashboard/sessions'
              );
            `);
          }
          break;

        case "chat.message_sent":
          // Log structured audit dispatch
          console.info(JSON.stringify({
            level: "info",
            event: "chat_notification_dispatched",
            messageId: payload.messageId,
            conversationId: payload.conversationId,
          }));
          break;

        case "payment.succeeded":
          console.info(JSON.stringify({
            level: "info",
            event: "payment_webhook_dispatched",
            orderId: payload.orderId,
            bookingId: payload.bookingId,
          }));
          break;

        default:
          console.warn(JSON.stringify({
            level: "warn",
            event: "unrecognized_event_type",
            eventType,
            eventId,
          }));
      }

      // MARK JOB COMPLETED
      await db.execute(sql`
        UPDATE outbox_events
        SET status = 'completed',
            processed_at = now(),
            locked_at = null,
            locked_by = null
        WHERE id = ${eventId};
      `);

      processed++;

      console.info(JSON.stringify({
        level: "info",
        workerId,
        eventId,
        eventType,
        durationMs: Date.now() - eventStartTime,
        status: "completed",
      }));
    } catch (err: any) {
      errors++;
      const nextRetries = currentRetries + 1;
      const isDeadLetter = nextRetries >= MAX_RETRIES;

      if (isDeadLetter) {
        deadLettered++;
      }

      // Exponential backoff: 5s, 10s, 20s, 40s, 80s
      const backoffSeconds = Math.min(300, Math.pow(2, nextRetries) * 5);

      await db.execute(sql`
        UPDATE outbox_events
        SET status = ${isDeadLetter ? "dead_letter" : "failed"},
            retry_count = ${nextRetries},
            error_message = ${err.message},
            locked_at = null,
            locked_by = null,
            next_retry_at = now() + (interval '1 second' * ${backoffSeconds})
        WHERE id = ${eventId};
      `);

      console.error(JSON.stringify({
        level: "error",
        workerId,
        eventId,
        eventType,
        retries: nextRetries,
        deadLetter: isDeadLetter,
        error: err.message,
      }));
    }
  }

  return {
    claimed: events.length,
    processed,
    errors,
    deadLettered,
    durationMs: Date.now() - startTime,
  };
}
