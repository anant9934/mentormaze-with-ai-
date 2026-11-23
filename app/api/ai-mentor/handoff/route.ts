import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { StudentConsentService } from "@/lib/ai-mentor/student-consent-service";
import { HumanEscalationService } from "@/lib/ai-mentor/human-escalation-service";
import { store } from "@/lib/data/store";
import {
  HandoffLifecycleState,
  HandoffAuditRecord,
  handoffBriefings,
  handoffAuditTrail,
} from "@/lib/ai-mentor/handoff-store";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUser(
  req: NextRequest
): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(req);
  if (session?.id) return { id: session.id, role: session.role };

  if (
    process.env.NODE_ENV !== "production" &&
    req.headers.get("x-mentormaze-test") === "true"
  ) {
    const testUser =
      req.headers.get("x-mentormaze-auth-user") || req.headers.get("x-user-id");
    if (testUser) {
      const role = testUser.startsWith("admin")
        ? "admin"
        : testUser.startsWith("mentor-") || testUser.includes("mentor")
        ? "mentor"
        : "student";
      return { id: testUser, role };
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to access handoff briefings.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || authUser.id;

    // Check if caller is student or mentor
    const isStudent = authUser.id === studentId;
    const isMentor = authUser.role === "mentor" || authUser.id.includes("mentor");
    const isAdmin = authUser.role === "admin";

    if (!isStudent && !isMentor && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You do not have permission to view this handoff profile.",
        },
        { status: 403 }
      );
    }

    // Verify whether active consent for mentor_sharing exists AND handoff is authorized
    let briefingData = handoffBriefings.get(studentId);
    const isAuthorizedByStudent = !!briefingData && (briefingData.state === "inquiry_created" || briefingData.state === "student_authorized");

    const hasConsent = (await StudentConsentService.hasConsent(
      studentId,
      "mentor_sharing",
      authUser.id
    )) && isAuthorizedByStudent;

    // Audit the access attempt
    handoffAuditTrail.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentUserId: studentId,
      action: "ACCESS_ATTEMPT",
      actorUserId: authUser.id,
      actorRole: authUser.role,
      state: hasConsent ? "student_authorized" : "student_authorization_pending",
      notes: hasConsent
        ? `Authorized briefing accessed by ${authUser.role} (${authUser.id})`
        : `Access evaluated: handoff authorization pending or consent revoked.`,
      timestamp: new Date().toISOString(),
    });

    // If caller is mentor and student revoked consent or hasn't authorized, reject immediately
    if (isMentor && !hasConsent) {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: Student has revoked or not granted consent to share mentorship briefing.",
        },
        { status: 403 }
      );
    }

    // Fetch or generate sanitized briefing
    if (!briefingData) {
      const sanitizedBrief = HumanEscalationService.generateConsentBrief(
        "Anant (Student)",
        "Advanced System Design & Distributed Invariants",
        ["Handling distributed transactions and idempotency under network partitions"],
        [
          "Review existing event-driven architecture design doc",
          "Conduct 30-min targeted mock architectural interview",
          "Calibrate 90-day senior engineering career roadmap",
        ]
      );

      briefingData = {
        studentUserId: studentId,
        studentName: "Anant (Student)",
        targetDomain: "System Design & Distributed Invariants",
        sanitizedBriefing: sanitizedBrief,
        state: "student_authorization_pending",
        authorizedAt: new Date().toISOString(),
      };
      handoffBriefings.set(studentId, briefingData);
    }

    // Approved mentors available on MentorMaze
    const approvedMentors = store.getMentors(true).map((m) => ({
      id: m.id,
      headline: m.headline,
      skills: m.skills,
      price60MinInr: m.price60MinInr,
      isAcceptingBookings: m.isAcceptingBookings,
    }));

    return NextResponse.json({
      success: true,
      hasConsent,
      state: hasConsent ? briefingData.state : "student_authorization_pending",
      briefing: briefingData.sanitizedBriefing,
      targetDomain: briefingData.targetDomain,
      inquiryBookingId: briefingData.inquiryBookingId,
      // Honest status: inquiry created is pending review, NOT a confirmed booking
      isConfirmedBooking: false,
      inquiryStatus: briefingData.inquiryBookingId ? "pending_mentor_review" : "not_created",
      recommendedMentors: approvedMentors.slice(0, 3),
      dataMinimizationNotice:
        "Sanitized briefing strictly excludes private reflection logs, personal emotions, and raw AI chat messages.",
    });
  } catch (err: any) {
    const status = err.message?.includes("403_FORBIDDEN") ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to authorize mentor handoff.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { studentId: reqStudentId, mentorId, authorized, topic, unresolvedQuestions, suggestedAgenda } = body;
    const studentId = reqStudentId || authUser.id;

    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot authorize handoff for another student.",
        },
        { status: 403 }
      );
    }

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Explicit authorization checkbox is required before sharing context.",
        },
        { status: 400 }
      );
    }

    // 1. Grant explicit consent for 'mentor_sharing'
    await StudentConsentService.grantConsent(
      studentId,
      "mentor_sharing",
      "Explicitly authorized via ASTRION handoff card",
      authUser.id
    );

    // 2. Generate strictly sanitized briefing (context minimization)
    const sanitizedBrief = HumanEscalationService.generateConsentBrief(
      "Student",
      topic || "System Design & Distributed Invariants",
      unresolvedQuestions || ["Algorithmic optimization and edge case validation"],
      suggestedAgenda || [
        "Review code implementation and time complexity",
        "Perform live 30-minute mock technical interview",
      ]
    );

    // 3. Verify mentor exists and is approved in store
    const mentors = store.getMentors(true);
    const selectedMentor = mentorId ? store.getMentorById(mentorId) : mentors[0];

    let createdBooking: any = null;
    if (selectedMentor && selectedMentor.verificationStatus === "approved") {
      // Create real booking inquiry with status 'pending' (NEVER pretending inquiry is confirmed)
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 25 * 3600 * 1000).toISOString();

      const bookingResult = store.createBooking({
        studentUserId: studentId,
        mentorProfileId: selectedMentor.id,
        serviceType: "1on1_mentorship",
        sessionDurationMinutes: 60,
        startTimeUtc: startTime,
        endTimeUtc: endTime,
        userTimezone: "Asia/Kolkata",
        priceInr: selectedMentor.price60MinInr || 499,
        studentDiscussionPoints: sanitizedBrief,
      });

      if (bookingResult.success && bookingResult.booking) {
        createdBooking = bookingResult.booking;
        // Explicitly maintain distinction: inquiry created is pending mentor review
        createdBooking.status = "pending";
        createdBooking.paymentStatus = "pending";
      }
    }

    handoffBriefings.set(studentId, {
      studentUserId: studentId,
      studentName: "Student",
      targetDomain: topic || "System Design & Distributed Invariants",
      sanitizedBriefing: sanitizedBrief,
      mentorId: selectedMentor?.id,
      inquiryBookingId: createdBooking?.id,
      state: "inquiry_created",
      authorizedAt: new Date().toISOString(),
    });

    // Record audit trail entry
    handoffAuditTrail.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentUserId: studentId,
      action: "INQUIRY_CREATED",
      actorUserId: authUser.id,
      actorRole: authUser.role,
      state: "inquiry_created",
      notes: `Handoff authorized; booking inquiry ${createdBooking?.id || "inquiry"} created with mentor ${selectedMentor?.id || "pending"}.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      handoffAuthorized: true,
      state: "inquiry_created",
      // Clearly distinguish inquiry from confirmed booking
      isConfirmedBooking: false,
      inquiryStatus: "pending_mentor_review",
      briefing: sanitizedBrief,
      bookingId: createdBooking?.id,
      inquiryBookingId: createdBooking?.id,
      selectedMentor: selectedMentor
        ? {
            id: selectedMentor.id,
            headline: selectedMentor.headline,
            price60MinInr: selectedMentor.price60MinInr,
          }
        : null,
      message: "Explicit authorization granted and briefing prepared for verified mentor inquiry.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: "401_UNAUTHORIZED: Authentication required to revoke handoff consent.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || authUser.id;

    if (studentId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403_FORBIDDEN: You cannot revoke consent for another student.",
        },
        { status: 403 }
      );
    }

    // Revoke consent immediately on server
    await StudentConsentService.revokeConsent(
      studentId,
      "mentor_sharing",
      "Revoked by student via handoff card",
      authUser.id
    );

    // Update state in handoff briefings
    const existing = handoffBriefings.get(studentId);
    if (existing) {
      existing.state = "inquiry_or_booking_cancelled";
    }
    handoffBriefings.delete(studentId);

    // Record revocation in audit log
    handoffAuditTrail.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentUserId: studentId,
      action: "CONSENT_REVOKED",
      actorUserId: authUser.id,
      actorRole: authUser.role,
      state: "inquiry_or_booking_cancelled",
      notes: "Student revoked mentor_sharing consent. All subsequent mentor reads are blocked.",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      handoffAuthorized: false,
      state: "inquiry_or_booking_cancelled",
      message: "Mentor sharing consent revoked. Mentor access immediately terminated.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
