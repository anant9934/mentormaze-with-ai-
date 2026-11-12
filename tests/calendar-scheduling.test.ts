import { describe, it, expect, beforeAll } from "vitest";
import { getDb, initializeDatabaseSchema } from "../lib/db/index";
import { seedDatabase } from "../lib/db/seed";
import { sql } from "drizzle-orm";
import { encryptToken, decryptToken } from "../lib/calendar/crypto";
import { generateIcsCalendar } from "../lib/calendar/ics-generator";
import { SlotGenerator } from "../lib/calendar/slot-generator";
import { BookingHoldManager } from "../lib/calendar/hold-manager";
import { AvailabilityService } from "../lib/calendar/availability-service";
import { resolveMentorProfileId } from "../lib/calendar/types";

describe("MentorMaze Calendar & Scheduling Engine Test Suite", () => {
  const MENTOR_ID = "30000000-0000-0000-0000-000000000001"; // Priya Sharma
  const STUDENT_ID = "00000000-0000-0000-0000-000000000001"; // Anant Kumar

  beforeAll(async () => {
    await initializeDatabaseSchema();
    await seedDatabase();

    // Ensure mentor has default weekly rules configured in DB
    const db = getDb();
    await db.execute(sql`DELETE FROM availability_rules WHERE mentor_profile_id = ${MENTOR_ID};`);
    await db.execute(sql`DELETE FROM availability_exceptions WHERE mentor_profile_id = ${MENTOR_ID};`);
    await db.execute(sql`DELETE FROM booking_holds WHERE mentor_profile_id = ${MENTOR_ID};`);

    // Insert Mon-Fri 10:00-13:00 and 14:00-18:00
    for (let day = 1; day <= 5; day++) {
      await db.execute(sql`
        INSERT INTO availability_rules (mentor_profile_id, day_of_week, start_time, end_time, is_active)
        VALUES (${MENTOR_ID}, ${day}, '10:00', '13:00', true);
      `);
      await db.execute(sql`
        INSERT INTO availability_rules (mentor_profile_id, day_of_week, start_time, end_time, is_active)
        VALUES (${MENTOR_ID}, ${day}, '14:00', '18:00', true);
      `);
    }

    // Insert Mentor Scheduling Settings
    await db.execute(sql`
      INSERT INTO mentor_availability_settings (
        mentor_profile_id, buffer_time_minutes, min_notice_hours, max_advance_days, daily_session_limit, timezone
      ) VALUES (
        ${MENTOR_ID}, 15, 2, 30, 4, 'Asia/Kolkata'
      ) ON CONFLICT (mentor_profile_id) DO UPDATE SET
        buffer_time_minutes = 15, min_notice_hours = 2, max_advance_days = 30, daily_session_limit = 4, timezone = 'Asia/Kolkata';
    `);

    // Ensure Christmas confirmed booking exists for conflict detection test
    await db.execute(sql`
      INSERT INTO bookings (
        student_user_id, mentor_profile_id, service_type, session_duration_minutes,
        start_time_utc, end_time_utc, status, price_inr, amount_paise, payment_status
      ) VALUES (
        ${STUDENT_ID}, ${MENTOR_ID}, '1on1_mentorship', 30,
        '2026-12-25T10:00:00.000Z', '2026-12-25T10:30:00.000Z',
        'confirmed', 1500, 150000, 'paid'
      );
    `);
  });

  describe("1. Cryptographic Token Protection (AES-256-GCM)", () => {
    it("successfully encrypts and decrypts OAuth refresh tokens with authentication tag", () => {
      const sensitiveToken = "1//04sFq87example-refresh-token-xyz-secret-key-123456789";
      const encrypted = encryptToken(sensitiveToken);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(sensitiveToken);
      expect(encrypted.split(":")).toHaveLength(3); // iv:ciphertext:tag

      const decrypted = decryptToken(encrypted);
      expect(decrypted).toEqual(sensitiveToken);
    });

    it("fails or returns empty when decrypting tampered ciphertext", () => {
      const sensitiveToken = "secret-oauth-token";
      const encrypted = encryptToken(sensitiveToken);
      const parts = encrypted.split(":");
      // Tamper ciphertext
      parts[1] = "badciphertext123456";
      const tampered = parts.join(":");

      expect(decryptToken(tampered)).toBe("");
    });
  });

  describe("2. RFC 5545 iCalendar (.ICS) Standards Compliance", () => {
    it("generates a valid, standards-compliant .ics file with VEVENT and VALARM", () => {
      const start = new Date("2026-11-20T10:00:00Z");
      const end = new Date("2026-11-20T10:30:00Z");

      const ics = generateIcsCalendar({
        uid: "test-booking-uuid-1234",
        title: "1:1 Systems Architecture Mentorship",
        description: "Review of distributed cache architecture with Priya Sharma.\nPlatform: MentorMaze by AI Tathastu",
        location: "https://mentormaze.aitathastu.com/sessions/test-1234/live",
        meetingUrl: "https://mentormaze.aitathastu.com/sessions/test-1234/live",
        startTimeUtc: start,
        endTimeUtc: end,
        organizer: {
          name: "MentorMaze by AI Tathastu",
          email: "hellomentormaze@gmail.com",
        },
        attendee: {
          name: "Anant Kumar",
          email: "anant@example.com",
        },
      });

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//MentorMaze by AI Tathastu//Scheduling Engine//EN");
      expect(ics).toContain("METHOD:REQUEST");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("UID:test-booking-uuid-1234@mentormaze.aitathastu.com");
      expect(ics).toContain("DTSTART:20261120T100000Z");
      expect(ics).toContain("DTEND:20261120T103000Z");
      expect(ics).toContain("SUMMARY:1:1 Systems Architecture Mentorship");
      expect(ics).toContain("ORGANIZER;CN=\"MentorMaze by AI Tathastu\":mailto:hellomentormaze@gmail.com");
      expect(ics).toContain("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=\"Anant Kumar\":mailto:anant@example.com");
      expect(ics).toContain("BEGIN:VALARM");
      expect(ics).toContain("TRIGGER:-PT15M");
      expect(ics).toContain("END:VALARM");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
      // Check CRLF line endings
      expect(ics.endsWith("\r\n")).toBe(true);
    });

    it("properly escapes semicolons, commas, backslashes and newlines", () => {
      const ics = generateIcsCalendar({
        uid: "escape-test",
        title: "Special, Characters; and \\ Backslashes",
        description: "Line 1\nLine 2, with comma and; semicolon",
        startTimeUtc: new Date("2026-11-20T14:00:00Z"),
        endTimeUtc: new Date("2026-11-20T14:30:00Z"),
        organizer: { name: "Organizer, Admin", email: "admin@mentormaze.com" },
        attendee: { name: "Attendee; Student", email: "student@example.com" },
      });

      expect(ics).toContain("SUMMARY:Special\\, Characters\\; and \\\\ Backslashes");
      expect(ics).toContain("Line 1\\nLine 2\\, with comma and\\; semicolon");
    });
  });

  describe("3. Dynamic Bookable Slot Generator", () => {
    it("generates slots within mentor's weekly windows and converts to viewer timezone", async () => {
      // Pick a future Wednesday: 2026-11-18
      const slots = await SlotGenerator.generateSlots({
        mentorProfileId: MENTOR_ID,
        startDate: "2026-11-18",
        endDate: "2026-11-18",
        durationMinutes: 30,
        viewerTimezone: "Asia/Kolkata",
      });

      expect(slots.length).toBeGreaterThan(0);
      const availableSlots = slots.filter((s) => s.available);
      expect(availableSlots.length).toBeGreaterThan(0);

      // Verify slots adhere to 30 min duration
      const firstSlot = availableSlots[0];
      const startMs = new Date(firstSlot.startTimeUtc).getTime();
      const endMs = new Date(firstSlot.endTimeUtc).getTime();
      expect(endMs - startMs).toBe(30 * 60 * 1000);
      expect(firstSlot.durationMinutes).toBe(30);
    });

    it("accurately shifts slot display times when queried in US Eastern timezone (EST)", async () => {
      const slotsIst = await SlotGenerator.generateSlots({
        mentorProfileId: MENTOR_ID,
        startDate: "2026-11-18",
        endDate: "2026-11-18",
        durationMinutes: 30,
        viewerTimezone: "Asia/Kolkata",
      });

      const slotsEst = await SlotGenerator.generateSlots({
        mentorProfileId: MENTOR_ID,
        startDate: "2026-11-18",
        endDate: "2026-11-18",
        durationMinutes: 30,
        viewerTimezone: "America/New_York",
      });

      expect(slotsIst.length).toEqual(slotsEst.length);
      // The absolute UTC start timestamps must be IDENTICAL
      expect(slotsIst[0].startTimeUtc).toEqual(slotsEst[0].startTimeUtc);
      // But the formatted local times must reflect the timezone difference
      expect(slotsIst[0].startTimeLocal).not.toEqual(slotsEst[0].startTimeLocal);
    });

    it("respects date exceptions: removes all slots on blocked vacation date", async () => {
      const db = getDb();
      const holidayDate = "2026-11-19";

      // Insert full-day block exception
      await db.execute(sql`
        INSERT INTO availability_exceptions (mentor_profile_id, exception_date, is_blocked, reason)
        VALUES (${MENTOR_ID}, ${holidayDate}, true, 'Diwali Festival Holiday');
      `);

      const slots = await SlotGenerator.generateSlots({
        mentorProfileId: MENTOR_ID,
        startDate: holidayDate,
        endDate: holidayDate,
        durationMinutes: 30,
        viewerTimezone: "Asia/Kolkata",
      });

      // All slots must be empty or unavailable
      const available = slots.filter((s) => s.available);
      expect(available.length).toBe(0);

      // Clean up exception
      await db.execute(sql`
        DELETE FROM availability_exceptions
        WHERE mentor_profile_id = ${MENTOR_ID} AND exception_date = ${holidayDate};
      `);
    });

    it("excludes slots that collide with external calendar busy periods", async () => {
      const db = getDb();
      const testDate = "2026-11-20";

      // 10:00 IST is 04:30 UTC
      const busyStartUtc = new Date(`${testDate}T04:30:00Z`);
      const busyEndUtc = new Date(`${testDate}T05:30:00Z`);

      const connId = "70000000-0000-0000-0000-000000000001";
      await db.execute(sql`
        INSERT INTO calendar_connections (id, user_id, mentor_profile_id, provider, status)
        VALUES (${connId}, '00000000-0000-0000-0000-000000000002', ${MENTOR_ID}, 'google_calendar', 'connected')
        ON CONFLICT (id) DO NOTHING;
      `);

      // Insert an external calendar busy event
      await db.execute(sql`
        INSERT INTO external_calendar_events (
          connection_id, mentor_profile_id, external_event_id, start_time_utc, end_time_utc, is_busy
        ) VALUES (
          ${connId}, ${MENTOR_ID}, 'google-busy-test-1', ${busyStartUtc}, ${busyEndUtc}, true
        );
      `);

      const slots = await SlotGenerator.generateSlots({
        mentorProfileId: MENTOR_ID,
        startDate: testDate,
        endDate: testDate,
        durationMinutes: 30,
        viewerTimezone: "Asia/Kolkata",
      });

      // Find slot at 04:30 UTC
      const collidingSlot = slots.find((s) => s.startTimeUtc === busyStartUtc.toISOString());
      if (collidingSlot) {
        expect(collidingSlot.available).toBe(false);
        expect(collidingSlot.reason).toBe("external_busy");
      }

      // Cleanup
      await db.execute(sql`
        DELETE FROM external_calendar_events WHERE mentor_profile_id = ${MENTOR_ID};
      `);
    });
  });

  describe("4. Concurrency Protection & Atomic 10-Minute Holds", () => {
    it("successfully creates a 10-minute hold for an available slot", async () => {
      const startTimeUtc = "2026-11-25T05:00:00.000Z";
      const endTimeUtc = "2026-11-25T05:30:00.000Z";
      const idempKey = `hold-test-${Date.now()}`;

      const res = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: idempKey,
        holdDurationMinutes: 10,
      });

      expect(res.success).toBe(true);
      expect(res.hold).toBeDefined();
      expect(res.hold.status).toBe("active");

      // Verify expires_at is roughly 10 minutes in future
      const expiresAt = new Date(res.hold.expires_at || res.hold.expiresAt).getTime();
      const diffMinutes = (expiresAt - Date.now()) / (60 * 1000);
      expect(diffMinutes).toBeGreaterThan(9);
      expect(diffMinutes).toBeLessThanOrEqual(10.1);
    });

    it("prevents race condition: concurrent conflicting hold request is rejected with collision", async () => {
      const startTimeUtc = "2026-11-25T05:00:00.000Z"; // Same slot as previous test!
      const endTimeUtc = "2026-11-25T05:30:00.000Z";
      const diffStudentId = "00000000-0000-0000-0000-000000000006";

      const res = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: diffStudentId,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: `hold-different-student-${Date.now()}`,
        holdDurationMinutes: 10,
      });

      expect(res.success).toBe(false);
      expect(res.collision).toBe(true);
      expect(res.error).toContain("held by another user");
    });

    it("returns active hold on idempotent replay with the identical idempotency key", async () => {
      const startTimeUtc = "2026-11-25T07:00:00.000Z";
      const endTimeUtc = "2026-11-25T07:30:00.000Z";
      const idempKey = `idemp-replay-${Date.now()}`;

      const first = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: idempKey,
      });
      expect(first.success).toBe(true);

      // Replay identical call
      const second = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: idempKey,
      });

      expect(second.success).toBe(true);
      expect(second.hold.id).toBe(first.hold.id);
    });

    it("releases hold and allows re-booking of the slot", async () => {
      const startTimeUtc = "2026-11-25T08:00:00.000Z";
      const endTimeUtc = "2026-11-25T08:30:00.000Z";
      const idempKey = `release-test-${Date.now()}`;

      const holdRes = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: STUDENT_ID,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: idempKey,
      });

      expect(holdRes.success).toBe(true);
      const holdId = holdRes.hold.id;

      // Release hold
      const releaseRes = await BookingHoldManager.releaseHold(holdId);
      expect(releaseRes.success).toBe(true);

      // Now another student can acquire this slot without collision!
      const newHoldRes = await BookingHoldManager.createHold({
        mentorProfileId: MENTOR_ID,
        studentUserId: "00000000-0000-0000-0000-000000000006",
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 30,
        startTimeUtc,
        endTimeUtc,
        idempotencyKey: `new-user-${Date.now()}`,
      });

      expect(newHoldRes.success).toBe(true);
    });
  });

  describe("5. Availability Service & Conflict Warnings", () => {
    it("fetches mentor schedule with weekly rules and settings", async () => {
      const schedule = await AvailabilityService.getMentorSchedule(MENTOR_ID);

      expect(schedule).toBeDefined();
      expect(schedule.settings).toBeDefined();
      expect(schedule.settings.bufferTimeMinutes).toBe(15);
      expect(schedule.rules).toHaveLength(7);
    });

    it("detects conflicts when blocking a date with confirmed sessions, and adds exception on clear date", async () => {
      // 1. Conflicted date: 2026-12-25 has a confirmed booking
      const conflictRes = await AvailabilityService.addException(MENTOR_ID, {
        exceptionDate: "2026-12-25",
        isBlocked: true,
        reason: "Christmas Holiday",
      });

      expect(conflictRes.success).toBe(false);
      expect(conflictRes.conflict).toBe(true);
      expect(conflictRes.conflictingBookings?.length).toBeGreaterThan(0);
      expect(conflictRes.error).toContain("confirmed session(s)");

      // 2. Unbooked clear date: 2026-12-30
      const clearRes = await AvailabilityService.addException(MENTOR_ID, {
        exceptionDate: "2026-12-30",
        isBlocked: true,
        reason: "Year-end Holiday",
      });

      expect(clearRes.success).toBe(true);
      expect(clearRes.exception).toBeDefined();

      // Clean up exception
      const removeRes = await AvailabilityService.removeException(MENTOR_ID, clearRes.exception!.id);
      expect(removeRes.success).toBe(true);
    });
  });
});
