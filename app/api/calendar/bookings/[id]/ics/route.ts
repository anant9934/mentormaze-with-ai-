import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateIcsCalendar } from "@/lib/calendar/ics-generator";
import { store } from "@/lib/data/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const db = getDb();

    // 1. Query booking from database
    let booking: any = null;
    let student: any = null;
    let mentor: any = null;

    try {
      const dbBookings = await db
        .select({
          id: schema.bookings.id,
          serviceType: schema.bookings.serviceType,
          startTimeUtc: schema.bookings.startTimeUtc,
          endTimeUtc: schema.bookings.endTimeUtc,
          status: schema.bookings.status,
          meetingRoomId: schema.bookings.meetingRoomId,
          studentName: schema.users.displayName,
          studentEmail: schema.users.email,
          mentorHeadline: schema.mentorProfiles.headline,
          mentorOrg: schema.mentorProfiles.organization,
        })
        .from(schema.bookings)
        .innerJoin(schema.users, eq(schema.bookings.studentUserId, schema.users.id))
        .innerJoin(schema.mentorProfiles, eq(schema.bookings.mentorProfileId, schema.mentorProfiles.id))
        .where(eq(schema.bookings.id, bookingId))
        .limit(1);

      if (dbBookings && dbBookings.length > 0) {
        const row = dbBookings[0];
        booking = {
          id: row.id,
          serviceType: row.serviceType,
          startTimeUtc: new Date(row.startTimeUtc),
          endTimeUtc: new Date(row.endTimeUtc),
          status: row.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
          meetingRoomId: row.meetingRoomId,
        };
        student = { name: row.studentName, email: row.studentEmail };
        mentor = { name: row.mentorHeadline || "Mentor", email: "mentorship@mentormaze.aitathastu.com" };
      }
    } catch {
      // In case of query fallback
    }

    // Fallback to store if not found in db
    if (!booking) {
      const storeBooking = store.getBookingById(bookingId);
      if (storeBooking) {
        booking = {
          id: storeBooking.id,
          serviceType: storeBooking.serviceType,
          startTimeUtc: new Date(storeBooking.startTimeUtc),
          endTimeUtc: new Date(storeBooking.endTimeUtc),
          status: storeBooking.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
          meetingRoomId: storeBooking.meetingRoomId,
        };
        const studentUser = store.getUser(storeBooking.studentUserId);
        const mentorProfile = store.getMentorById(storeBooking.mentorProfileId);
        student = {
          name: studentUser?.displayName || "Student",
          email: studentUser?.email || "student@example.com",
        };
        mentor = {
          name: mentorProfile?.headline || "Mentor",
          email: "mentorship@mentormaze.aitathastu.com",
        };
      }
    }

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking session not found" }, { status: 404 });
    }

    const meetingUrl = `https://mentormaze.aitathastu.com/sessions/${booking.id}/live`;

    const icsContent = generateIcsCalendar({
      uid: booking.id,
      sequence: 0,
      status: booking.status as any,
      title: `MentorMaze Session: ${booking.serviceType === "mock_interview" ? "Mock Interview" : "1:1 Mentorship"}`,
      description: `MentorMaze Mentorship Session by AI Tathastu.\n\nJoin Live Room: ${meetingUrl}\nRoom ID: ${booking.meetingRoomId || booking.id}\nOfficial Site: https://mentormaze.aitathastu.com`,
      location: meetingUrl,
      meetingUrl,
      startTimeUtc: booking.startTimeUtc,
      endTimeUtc: booking.endTimeUtc,
      organizer: {
        name: "MentorMaze by AI Tathastu",
        email: "hellomentormaze@gmail.com",
      },
      attendee: {
        name: student?.name || "Student",
        email: student?.email || "student@example.com",
      },
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="mentormaze-session-${booking.id}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[API calendar/bookings/[id]/ics] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate .ics file" },
      { status: 500 }
    );
  }
}
