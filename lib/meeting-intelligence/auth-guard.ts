/**
 * MentorMaze Meeting Intelligence Authorization Guard
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Enforces:
 * 1. Server-side feature gate check (defaults to disabled -> 503).
 * 2. True session authentication via getServerSession / requireAuth -> 401.
 * 3. Database-backed booking existence and ownership verification -> 404 / 403.
 * 4. Zero trust in client-supplied role, studentUserId, mentorUserId, or query params.
 * 5. Rate limiting on costly cloud translation endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/server-auth";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { isMeetingIntelligenceEnabled, meetingIntelligenceDisabledResponse } from "./feature-gate";

export interface BookingAuthorizationContext {
  user: AuthenticatedUser;
  booking: {
    id: string;
    student_user_id: string;
    mentor_profile_id: string;
    mentor_user_id: string;
    status: string;
  };
  isStudent: boolean;
  isMentor: boolean;
  isAdmin: boolean;
}

export type MeetingAuthResult =
  | { authContext: BookingAuthorizationContext; errorResponse?: never }
  | { authContext?: never; errorResponse: NextResponse };

export async function authorizeMeetingParticipant(
  req: NextRequest,
  bookingId: string | null | undefined
): Promise<MeetingAuthResult> {
  // 1. Feature Gate Check (defaults to disabled)
  if (!isMeetingIntelligenceEnabled()) {
    return { errorResponse: meetingIntelligenceDisabledResponse() };
  }

  // 2. Validate booking ID format
  if (!bookingId || typeof bookingId !== "string" || bookingId.trim() === "") {
    return {
      errorResponse: NextResponse.json(
        { error: "bookingId is required and must be a valid identifier." },
        { status: 400 }
      ),
    };
  }

  // 3. Authenticate current user via server session
  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return { errorResponse: auth.errorResponse };
  }
  const user = auth.user;

  // 4. Resolve booking from database
  try {
    const db = await getDb();
    const result: any = await db.execute(sql`
      SELECT 
        b.id,
        b.student_user_id,
        b.mentor_profile_id,
        mp.user_id as mentor_user_id,
        b.status
      FROM bookings b
      LEFT JOIN mentor_profiles mp ON mp.id = b.mentor_profile_id
      WHERE b.id = ${bookingId}::uuid
      LIMIT 1;
    `);

    const bookingRow = result.rows?.[0] || result?.[0];
    if (!bookingRow) {
      return {
        errorResponse: NextResponse.json(
          { error: `Booking not found: ${bookingId}` },
          { status: 404 }
        ),
      };
    }

    const isStudent = user.id === bookingRow.student_user_id;
    const isMentor =
      user.id === bookingRow.mentor_user_id ||
      (!!user.mentorProfileId && user.mentorProfileId === bookingRow.mentor_profile_id);
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    // 5. Strict participant or admin check
    if (!isStudent && !isMentor && !isAdmin) {
      return {
        errorResponse: NextResponse.json(
          { error: "Forbidden: You are not an authorized participant in this mentorship session." },
          { status: 403 }
        ),
      };
    }

    return {
      authContext: {
        user,
        booking: {
          id: String(bookingRow.id),
          student_user_id: String(bookingRow.student_user_id),
          mentor_profile_id: String(bookingRow.mentor_profile_id),
          mentor_user_id: String(bookingRow.mentor_user_id),
          status: String(bookingRow.status),
        },
        isStudent,
        isMentor,
        isAdmin,
      },
    };
  } catch (err: any) {
    console.error("[MeetingIntelligence AuthGuard] Database query error:", err);
    return {
      errorResponse: NextResponse.json(
        { error: `Internal authorization verification failure: ${err?.message || "DB error"}` },
        { status: 500 }
      ),
    };
  }
}

// In-memory sliding window rate limiting for translation requests: userId -> timestamps[]
const translationRateLimits = new Map<string, number[]>();
const TRANSLATION_MAX_PER_MINUTE = 30;

export async function authorizeTranslation(
  req: NextRequest
): Promise<{ user?: AuthenticatedUser; errorResponse?: NextResponse }> {
  if (!isMeetingIntelligenceEnabled()) {
    return { errorResponse: meetingIntelligenceDisabledResponse() };
  }

  const auth = await requireAuth(req);
  if (auth.errorResponse) {
    return { errorResponse: auth.errorResponse };
  }
  const user = auth.user;

  // Enforce per-user sliding window rate limit
  const now = Date.now();
  const windowMs = 60 * 1000;
  const userTimestamps = translationRateLimits.get(user.id) || [];
  const validTimestamps = userTimestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= TRANSLATION_MAX_PER_MINUTE) {
    return {
      errorResponse: NextResponse.json(
        { error: "Too many translation requests. Rate limit of 30 requests per minute exceeded." },
        { status: 429 }
      ),
    };
  }

  validTimestamps.push(now);
  translationRateLimits.set(user.id, validTimestamps);

  return { user };
}
