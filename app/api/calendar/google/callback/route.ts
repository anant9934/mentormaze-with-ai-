import { NextRequest, NextResponse } from "next/server";
import { getDb, schema, initializeDatabaseSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { encryptToken } from "@/lib/calendar/crypto";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabaseSchema();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");
    const stateParam = url.searchParams.get("state");

    let stateObj: any = {};
    if (stateParam) {
      try {
        stateObj = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
      } catch {
        // Fallback
      }
    }

    const returnUrl = stateObj.returnUrl || "/mentor/availability";
    const mentorProfileId = stateObj.mentorProfileId || "30000000-0000-0000-0000-000000000001";
    const userId = stateObj.userId || "00000000-0000-0000-0000-000000000002";

    if (errorParam || !code) {
      return NextResponse.redirect(
        new URL(`${returnUrl}?calendar_error=${encodeURIComponent(errorParam || "No auth code received")}`, req.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "mentormaze.aitathastu.com";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/calendar/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Google OAuth Callback] Token exchange failed:", errBody);
      return NextResponse.redirect(
        new URL(`${returnUrl}?calendar_error=token_exchange_failed`, req.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Fetch user info to get connected Google email
    let accountEmail: string | null = null;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        accountEmail = userData.email || null;
      }
    } catch (e) {
      console.warn("[Google OAuth Callback] Userinfo fetch failed:", e);
    }

    const db = getDb();

    // Encrypt sensitive tokens using AES-256-GCM before saving to PostgreSQL
    const accessTokenEncrypted = accessToken ? encryptToken(accessToken) : null;
    const refreshTokenEncrypted = refreshToken ? encryptToken(refreshToken) : null;

    // Check if an existing connection exists
    const [existing] = await db
      .select({ id: schema.calendarConnections.id, refreshTokenEncrypted: schema.calendarConnections.refreshTokenEncrypted })
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.mentorProfileId, mentorProfileId),
          eq(schema.calendarConnections.provider, "google_calendar")
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.calendarConnections)
        .set({
          accountEmail: accountEmail || undefined,
          accessTokenEncrypted: accessTokenEncrypted || undefined,
          refreshTokenEncrypted: refreshTokenEncrypted || existing.refreshTokenEncrypted,
          tokenExpiresAt,
          status: "connected",
          lastSyncedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarConnections.id, existing.id));
    } else {
      await db.insert(schema.calendarConnections).values({
        userId,
        mentorProfileId,
        provider: "google_calendar",
        accountEmail,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        status: "connected",
        lastSyncedAt: new Date(),
      });
    }

    return NextResponse.redirect(
      new URL(`${returnUrl}?calendar_connected=google&email=${encodeURIComponent(accountEmail || "")}`, req.url)
    );
  } catch (error: any) {
    console.error("[Google OAuth Callback] Unhandled error:", error);
    return NextResponse.redirect(
      new URL(`/mentor/availability?calendar_error=${encodeURIComponent(error.message || "Failed to link Google Calendar")}`, req.url)
    );
  }
}

