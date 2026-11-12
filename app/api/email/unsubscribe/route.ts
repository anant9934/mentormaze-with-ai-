import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email/service";

export const dynamic = "force-dynamic";

/**
 * RFC 8058 & RFC 2369 Compliant One-Click Unsubscribe Handler
 * https://www.rfc-editor.org/rfc/rfc8058
 *
 * Requirements enforced:
 * 1. Accepts HTTP POST from Mail User Agents (Gmail, Yahoo, etc.) with body "List-Unsubscribe=One-Click".
 * 2. Operates without cookies, sessions, or authorization headers.
 * 3. Never returns a 3xx redirect on POST.
 * 4. Returns HTTP 200 OK on success.
 * 5. Strictly idempotent (repeated calls return 200 OK).
 * 6. Only modifies marketing/newsletter consent; never disables transactional or security alerts.
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let token = searchParams.get("token") || searchParams.get("unsubscribeToken");

    const contentType = req.headers.get("content-type") || "";

    // Parse body based on content type
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const textBody = await req.text();
      // RFC 8058 specifies the body MUST be "List-Unsubscribe=One-Click"
      const params = new URLSearchParams(textBody);
      if (!token && params.has("token")) {
        token = params.get("token");
      }
    } else if (contentType.includes("application/json")) {
      const jsonBody = await req.json().catch(() => ({}));
      if (!token && jsonBody.token) {
        token = jsonBody.token;
      }
    } else {
      // Fallback text check
      const rawText = await req.text().catch(() => "");
      if (rawText.includes("List-Unsubscribe=One-Click") && !token) {
        token = searchParams.get("token");
      }
    }

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required unsubscribe token parameter." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Execute unsubscribe (marketing/newsletter only)
    const success = await emailService.unsubscribeByToken(token);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or unrecognized unsubscribe token." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // RFC 8058 Section 3.2: Return 200 OK without redirect
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Successfully unsubscribed from marketing and promotional emails.",
        scope: "marketing_only",
        transactionalPreserved: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("RFC 8058 POST /api/email/unsubscribe error:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error during unsubscribe execution." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * HTTP GET handler for human users clicking the link in a browser
 * Redirects to the user-facing unsubscribe confirmation page
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || searchParams.get("unsubscribeToken") || "";
  const email = searchParams.get("email") || "";

  const redirectUrl = new URL("/unsubscribe", req.url);
  if (token) redirectUrl.searchParams.set("token", token);
  if (email) redirectUrl.searchParams.set("email", email);

  return NextResponse.redirect(redirectUrl.toString(), 302);
}
