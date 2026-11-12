/**
 * MentorMaze RFC 5545 iCalendar (.ics) Generator
 * Generates standards-compliant calendar invitations for Google, Apple, and Outlook
 * https://mentormaze.aitathastu.com
 */

import { IcsCalendarOptions } from "./types";

function formatIcsDate(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generates an RFC 5545 compliant iCalendar string (.ics)
 */
export function generateIcsCalendar(options: IcsCalendarOptions): string {
  const method = options.status === "CANCELLED" ? "CANCEL" : "REQUEST";
  const sequence = typeof options.sequence === "number" ? options.sequence : 0;
  const status = options.status || "CONFIRMED";
  const now = new Date();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MentorMaze by AI Tathastu//Scheduling Engine//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${options.uid}@mentormaze.aitathastu.com`,
    `SEQUENCE:${sequence}`,
    `STATUS:${status}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(options.startTimeUtc)}`,
    `DTEND:${formatIcsDate(options.endTimeUtc)}`,
    `SUMMARY:${escapeIcsText(options.title)}`,
    `DESCRIPTION:${escapeIcsText(options.description)}`,
  ];

  if (options.location || options.meetingUrl) {
    lines.push(`LOCATION:${escapeIcsText(options.location || options.meetingUrl || "MentorMaze Live Room")}`);
  }

  if (options.meetingUrl) {
    lines.push(`URL;VALUE=URI:${options.meetingUrl}`);
  }

  if (options.organizer) {
    lines.push(
      `ORGANIZER;CN="${escapeIcsText(options.organizer.name)}":mailto:${options.organizer.email}`
    );
  }

  if (options.attendee) {
    lines.push(
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${escapeIcsText(
        options.attendee.name
      )}":mailto:${options.attendee.email}`
    );
  }

  // 15-minute countdown reminder alarm inside the calendar file
  if (status !== "CANCELLED") {
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:MentorMaze Mentorship Session starts in 15 minutes");
    lines.push("TRIGGER:-PT15M");
    lines.push("END:VALARM");
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  // RFC 5545 specifies lines terminated by CRLF (\r\n)
  return lines.join("\r\n") + "\r\n";
}

