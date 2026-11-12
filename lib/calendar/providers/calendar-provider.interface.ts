/**
 * MentorMaze Calendar Provider Adapter Interface
 * Enables modular external calendar synchronization (Google Calendar, Microsoft 365)
 */

export interface BookingCalendarPayload {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  meetingUrl?: string;
  studentName: string;
  studentEmail: string;
  mentorName: string;
  mentorEmail: string;
}

export interface ExternalBusyInterval {
  startTimeUtc: Date;
  endTimeUtc: Date;
}

export interface ICalendarProvider {
  readonly providerName: "google_calendar" | "microsoft_365";

  listBusyPeriods(
    startTimeUtc: Date,
    endTimeUtc: Date
  ): Promise<ExternalBusyInterval[]>;

  createEvent(
    booking: BookingCalendarPayload
  ): Promise<{ externalEventId: string; htmlLink?: string } | null>;

  updateEvent(
    externalEventId: string,
    booking: BookingCalendarPayload
  ): Promise<{ externalEventId: string } | null>;

  deleteEvent(externalEventId: string): Promise<boolean>;
}

