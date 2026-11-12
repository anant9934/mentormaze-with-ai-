import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/index";
import { sql } from "drizzle-orm";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    try {
      const db = getDb();
      // Enqueue to transactional outbox for email list synchronization
      await db.execute(sql`
        INSERT INTO outbox_events (event_type, payload, status)
        VALUES (
          'newsletter.subscribed',
          ${JSON.stringify({ email, subscribedAt: new Date().toISOString() })},
          'pending'
        );
      `);
    } catch (dbErr) {
      // In case of local testing where table might be busy, still allow graceful logging
      console.warn("[Newsletter] Database outbox event failed:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! You'll receive updates on new mentors, programs, and features.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Unable to process subscription. Please try again later." },
      { status: 500 }
    );
  }
}

