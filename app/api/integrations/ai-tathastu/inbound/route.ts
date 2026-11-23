import { NextRequest, NextResponse } from "next/server";
import { AITathastuInboundAuthService, InboundTathastuPayload } from "@/lib/ai-mentor/integrations/inbound-auth";
import { sharedRateLimiter } from "@/lib/security/shared-rate-limiter";

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 256 * 1024; // 256KB max

/**
 * POST /api/integrations/ai-tathastu/inbound
 * 
 * Machine-to-Machine (M2M) authenticated endpoint for AI Tathastu ecosystem ingestion.
 * Strictly verifies service token, issuer, audience, expiry, replay, tenant, student, and schema.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  // 1. Shared Distributed Rate Limiting (60 requests per minute per IP across all instances)
  // Sensitive M2M endpoint enforces fail-closed policy: If shared database rate limiter is unreachable,
  // it rejects requests with HTTP 503 rather than silently downgrading to per-process in-memory limits.
  const rateCheck = await sharedRateLimiter.check(`inbound_m2m_${ip}`, 60, 60, { policy: "fail-closed" });
  if (!rateCheck.success) {
    if (rateCheck.error === "limiter_unavailable") {
      return NextResponse.json(
        { error: "Service Unavailable: Rate limiting service temporarily unavailable. Authoritative decision required." },
        { status: 503, headers: { "Retry-After": "10" } }
      );
    }
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(rateCheck.resetInSeconds) } }
    );
  }

  // 2. Payload Size Verification (256KB max)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Payload Too Large: Inbound payload exceeds 256KB limit." },
      { status: 413 }
    );
  }

  const rawBody = await req.text().catch(() => "");
  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Payload Too Large: Inbound payload exceeds 256KB limit." },
      { status: 413 }
    );
  }

  let body: InboundTathastuPayload;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  // Structured audit log of incoming event (never log authorization headers or tokens)
  console.info(JSON.stringify({
    level: "info",
    event: "inbound_m2m_request_received",
    eventId: body.eventId || "unknown",
    studentUserId: body.studentUserId || "unknown",
    sourceSystem: body.sourceSystem || "unknown",
    ip,
    timestamp: new Date().toISOString(),
  }));

  try {
    const authHeader = req.headers.get("authorization");
    const result = await AITathastuInboundAuthService.processInboundEvent(authHeader, body);

    console.info(JSON.stringify({
      level: "info",
      event: "inbound_m2m_ingestion_success",
      eventId: result.eventId,
      receiptId: result.receiptId,
      studentUserId: result.studentUserId,
      skillsIngested: result.skillsIngested,
      timestamp: result.processedAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const message: string = error?.message || "Internal server error";

    console.warn(JSON.stringify({
      level: "warn",
      event: "inbound_m2m_ingestion_rejected",
      eventId: body?.eventId || "unknown",
      studentUserId: body?.studentUserId || "unknown",
      reason: message,
      ip,
      timestamp: new Date().toISOString(),
    }));

    if (message.startsWith("401_UNAUTHORIZED")) {
      return NextResponse.json({ error: message.replace("401_UNAUTHORIZED: ", "") }, { status: 401 });
    }
    if (message.startsWith("403_FORBIDDEN")) {
      return NextResponse.json({ error: message.replace("403_FORBIDDEN: ", "") }, { status: 403 });
    }
    if (message.startsWith("404_NOT_FOUND")) {
      return NextResponse.json({ error: message.replace("404_NOT_FOUND: ", "") }, { status: 404 });
    }
    if (message.startsWith("409_CONFLICT")) {
      return NextResponse.json({ error: message.replace("409_CONFLICT: ", "") }, { status: 409 });
    }
    if (message.startsWith("400_BAD_REQUEST")) {
      return NextResponse.json({ error: message.replace("400_BAD_REQUEST: ", "") }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
