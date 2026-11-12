/**
 * MentorMaze Google Calendar Provider Adapter
 * Interacts with Google Calendar v3 REST API
 * https://mentormaze.aitathastu.com
 */

import {
  ICalendarProvider,
  BookingCalendarPayload,
  ExternalBusyInterval,
} from "./calendar-provider.interface";
import { decryptToken, encryptToken } from "../crypto";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export class GoogleCalendarProvider implements ICalendarProvider {
  readonly providerName = "google_calendar" as const;
  private connectionId: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;

  constructor(connectionId: string, tokens?: {
    accessTokenEncrypted?: string | null;
    refreshTokenEncrypted?: string | null;
    tokenExpiresAt?: Date | null;
  }) {
    this.connectionId = connectionId;
    if (tokens?.accessTokenEncrypted) {
      this.accessToken = decryptToken(tokens.accessTokenEncrypted);
    }
    if (tokens?.refreshTokenEncrypted) {
      this.refreshToken = decryptToken(tokens.refreshTokenEncrypted);
    }
    if (tokens?.tokenExpiresAt) {
      this.tokenExpiresAt = new Date(tokens.tokenExpiresAt);
    }
  }

  /**
   * Refreshes access token if expired or nearing expiration
   */
  private async getValidAccessToken(): Promise<string | null> {
    const now = new Date();
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt.getTime() > now.getTime() + 60000) {
      return this.accessToken;
    }

    if (!this.refreshToken) {
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return null;
    }

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        console.error("Google Calendar token refresh failed:", await response.text());
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

      // Persist newly refreshed encrypted token in DB
      try {
        const db = getDb();
        await db
          .update(schema.calendarConnections)
          .set({
            accessTokenEncrypted: encryptToken(data.access_token),
            tokenExpiresAt: this.tokenExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(schema.calendarConnections.id, this.connectionId));
      } catch (dbErr) {
        // Non-blocking for token use in-memory
      }

      return this.accessToken || null;
    } catch (err) {
      console.error("Failed to refresh Google Calendar token:", err);
      return null;
    }
  }

  /**
   * Query freeBusy API to retrieve external busy intervals
   */
  async listBusyPeriods(
    startTimeUtc: Date,
    endTimeUtc: Date
  ): Promise<ExternalBusyInterval[]> {
    const token = await this.getValidAccessToken();
    if (!token) return [];

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: startTimeUtc.toISOString(),
          timeMax: endTimeUtc.toISOString(),
          items: [{ id: "primary" }],
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const busyList = data.calendars?.primary?.busy || [];

      return busyList.map((item: any) => ({
        startTimeUtc: new Date(item.start),
        endTimeUtc: new Date(item.end),
      }));
    } catch (err) {
      console.error("Error reading Google Calendar freeBusy:", err);
      return [];
    }
  }

  /**
   * Create confirmed booking event in mentor's primary calendar
   */
  async createEvent(
    booking: BookingCalendarPayload
  ): Promise<{ externalEventId: string; htmlLink?: string } | null> {
    const token = await this.getValidAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `MentorMaze: ${booking.serviceType.replace(/_/g, " ")} (${booking.studentName})`,
            description: `${booking.description}\n\nJoin Video Room: ${booking.meetingUrl || "https://mentormaze.aitathastu.com/dashboard/sessions"}\nPlatform: MentorMaze by AI Tathastu`,
            start: { dateTime: booking.startTimeUtc.toISOString() },
            end: { dateTime: booking.endTimeUtc.toISOString() },
            attendees: [
              { email: booking.studentEmail, displayName: booking.studentName },
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 15 },
                { method: "email", minutes: 60 },
              ],
            },
          }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return { externalEventId: data.id, htmlLink: data.htmlLink };
    } catch (err) {
      console.error("Error creating Google Calendar event:", err);
      return null;
    }
  }

  /**
   * Update event start/end times when booking is rescheduled
   */
  async updateEvent(
    externalEventId: string,
    booking: BookingCalendarPayload
  ): Promise<{ externalEventId: string } | null> {
    const token = await this.getValidAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `MentorMaze: ${booking.serviceType.replace(/_/g, " ")} (${booking.studentName}) [Rescheduled]`,
            start: { dateTime: booking.startTimeUtc.toISOString() },
            end: { dateTime: booking.endTimeUtc.toISOString() },
          }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return { externalEventId: data.id };
    } catch (err) {
      console.error("Error updating Google Calendar event:", err);
      return null;
    }
  }

  /**
   * Delete or cancel event when booking is cancelled
   */
  async deleteEvent(externalEventId: string): Promise<boolean> {
    const token = await this.getValidAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(externalEventId)}`,
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        }
      );

      return response.ok || response.status === 404 || response.status === 410;
    } catch (err) {
      console.error("Error deleting Google Calendar event:", err);
      return false;
    }
  }
}
