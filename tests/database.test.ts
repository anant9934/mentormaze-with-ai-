import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "../lib/db/index";
import { seedDatabase } from "../lib/db/seed";
import { sql } from "drizzle-orm";

describe("PostgreSQL Database Integration & Schema Verification", () => {
  beforeAll(async () => {
    await initializeDatabaseSchema();
    await seedDatabase();
  });

  it("successfully creates tables and executes raw SQL queries", async () => {
    const db = getDb();
    const result: any = await db.execute(sql`SELECT 1 + 1 as sum;`);
    const sum = result.rows?.[0]?.sum || result?.[0]?.sum;
    expect(Number(sum)).toBe(2);
  });

  it("verifies persistent user records in PostgreSQL", async () => {
    const db = getDb();
    const result: any = await db.execute(sql`SELECT count(*) as total FROM users;`);
    const total = parseInt(result.rows?.[0]?.total || result?.[0]?.total || "0");
    expect(total).toBeGreaterThanOrEqual(6);
  });

  it("verifies mentor profiles and verification status in PostgreSQL", async () => {
    const db = getDb();
    const result: any = await db.execute(
      sql`SELECT headline, verification_status FROM mentor_profiles WHERE headline LIKE '%Microsoft%';`
    );
    const row = result.rows?.[0] || result?.[0];
    expect(row).toBeDefined();
    expect(row.verification_status).toBe("approved");
  });

  it("enforces unique constraint on user email at database level", async () => {
    const db = getDb();
    let errorCaught = false;
    try {
      await db.execute(sql`
        INSERT INTO users (email, display_name, role)
        VALUES ('anant@example.com', 'Duplicate User', 'student');
      `);
    } catch (err: any) {
      errorCaught = true;
      expect(err.message.toLowerCase()).toContain("unique");
    }
    expect(errorCaught).toBe(true);
  });

  it("executes booking transaction with double-booking prevention in SQL", async () => {
    const db = getDb();

    // Clean up any test booking
    await db.execute(sql`DELETE FROM bookings WHERE student_discussion_points = 'Test Concurrency Booking';`);

    const startUtc = new Date("2026-12-01T14:00:00Z");
    const endUtc = new Date("2026-12-01T14:30:00Z");
    const mentorId = "30000000-0000-0000-0000-000000000001";
    const studentId = "00000000-0000-0000-0000-000000000001";

    // First Booking Insert
    await db.execute(sql`
      INSERT INTO bookings (student_user_id, mentor_profile_id, service_type, start_time_utc, end_time_utc, price_inr, student_discussion_points, status)
      VALUES (${studentId}, ${mentorId}, '1on1_mentorship', ${startUtc.toISOString()}, ${endUtc.toISOString()}, 249, 'Test Concurrency Booking', 'confirmed');
    `);

    // Check overlap detection in SQL
    const conflictQuery: any = await db.execute(sql`
      SELECT count(*) as conflicts FROM bookings
      WHERE mentor_profile_id = ${mentorId}
        AND status != 'cancelled'
        AND start_time_utc < ${endUtc.toISOString()}
        AND end_time_utc > ${startUtc.toISOString()};
    `);

    const conflicts = parseInt(conflictQuery.rows?.[0]?.conflicts || conflictQuery?.[0]?.conflicts || "0");
    expect(conflicts).toBe(1);
  });

  it("verifies transactional booking service prevents double-booking and handles cancellation", async () => {
    const { createBookingInDb, cancelBookingInDb } = await import("../lib/db/booking-service");

    const mentorId = "30000000-0000-0000-0000-000000000001";
    const studentId = "00000000-0000-0000-0000-000000000001";
    const startTimeUtc = "2026-12-10T10:00:00.000Z";
    const endTimeUtc = "2026-12-10T10:30:00.000Z";

    const db = getDb();
    await db.execute(sql`DELETE FROM bookings WHERE mentor_profile_id = ${mentorId} AND start_time_utc = ${startTimeUtc};`);

    // First booking attempt -> should succeed
    const firstResult = await createBookingInDb({
      studentUserId: studentId,
      mentorProfileId: mentorId,
      serviceType: "1on1_mentorship",
      sessionDurationMinutes: 30,
      startTimeUtc,
      endTimeUtc,
      userTimezone: "Asia/Kolkata",
      priceInr: 249,
      studentDiscussionPoints: "System design deep dive",
    });

    expect(firstResult.success).toBe(true);
    expect(firstResult.booking?.id).toBeDefined();

    // Concurrent conflicting attempt for same mentor and overlapping slot -> must fail
    const conflictResult = await createBookingInDb({
      studentUserId: studentId,
      mentorProfileId: mentorId,
      serviceType: "1on1_mentorship",
      sessionDurationMinutes: 30,
      startTimeUtc: "2026-12-10T10:15:00.000Z", // 15 mins into the existing slot!
      endTimeUtc: "2026-12-10T10:45:00.000Z",
      userTimezone: "Asia/Kolkata",
      priceInr: 249,
    });

    expect(conflictResult.success).toBe(false);
    expect(conflictResult.error).toContain("Slot reservation collision");

    // Cancel booking -> updates status to cancelled
    const cancelResult = await cancelBookingInDb(firstResult.booking!.id, "Schedule conflict");
    expect(cancelResult.success).toBe(true);
  });

  it("verifies reliable outbox worker processes queued events and creates notifications", async () => {
    const { processOutboxBatch } = await import("../lib/workers/outbox-worker");
    const { processOutboxBatch: runWorker } = await import("../lib/workers/outbox-worker");

    const db = getDb();
    const studentId = "00000000-0000-0000-0000-000000000001";

    // Insert test outbox event
    await db.execute(sql`
      INSERT INTO outbox_events (event_type, payload, status)
      VALUES (
        'booking.created',
        ${JSON.stringify({ studentId, bookingId: "test-booking-outbox" })},
        'pending'
      );
    `);

    const result = await runWorker(10);
    expect(result.processed).toBeGreaterThanOrEqual(1);

    // Verify notification was created in PostgreSQL
    const notifQuery: any = await db.execute(sql`
      SELECT title, type FROM notifications WHERE user_id = ${studentId} ORDER BY created_at DESC LIMIT 1;
    `);

    const notif = notifQuery.rows?.[0] || notifQuery?.[0];
    expect(notif).toBeDefined();
    expect(notif.type).toBe("booking_confirmed");
  });

  it("enforces strict concurrency: exactly 1 of 20 simultaneous overlapping requests succeeds", async () => {
    const { createBookingInDb } = await import("../lib/db/booking-service");

    const mentorId = "30000000-0000-0000-0000-000000000001";
    const studentId = "00000000-0000-0000-0000-000000000001";
    const startTimeUtc = "2026-12-25T14:00:00.000Z";
    const endTimeUtc = "2026-12-25T14:30:00.000Z";

    // Clean up any existing bookings for this test slot
    const db = getDb();
    await db.execute(sql`
      DELETE FROM bookings 
      WHERE mentor_profile_id = ${mentorId} 
        AND start_time_utc = ${startTimeUtc};
    `);

    // Submit 20 simultaneous booking requests for the exact same mentor and overlapping slot
    const concurrentRequests = Array.from({ length: 20 }, (_, i) =>
      createBookingInDb({
        studentUserId: studentId,
        mentorProfileId: mentorId,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        userTimezone: "Asia/Kolkata",
        priceInr: 249,
        studentDiscussionPoints: `Concurrent Request #${i + 1}`,
      })
    );

    const results = await Promise.all(concurrentRequests);

    const successes = results.filter((r: any) => r.success);
    const failures = results.filter((r: any) => !r.success);

    // EXACTLY 1 must succeed
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(19);

    // All 19 failures must report slot reservation collision
    failures.forEach((f: any) => {
      expect(f.error).toContain("Slot reservation collision");
    });
  });
});
