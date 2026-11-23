/**
 * MentorMaze Deterministic Speaker Attribution Adapter
 * Adapted from Cicada (Apache-2.0 License - https://github.com/wquguru/cicada)
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * NOTE: Strictly deterministic WebRTC track-level attribution.
 * Zero local voiceprint, zero Core ML, zero on-device speaker identification models.
 * LiveKit cryptographically asserts participant identity and track ownership via token.
 */

export interface VerifiedParticipant {
  userId: string;
  name: string;
  role: "student" | "mentor" | "system";
  isAuthorized: boolean;
}

export interface BookingParticipantContext {
  bookingId: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
}

export class SpeakerAttributionAdapter {
  private bookingContext: BookingParticipantContext;

  constructor(bookingContext: BookingParticipantContext) {
    this.bookingContext = bookingContext;
  }

  /**
   * Resolves speaker role and display name from LiveKit participant metadata and track ID.
   * Rejects unauthorized participants who are neither the booked student nor the booked mentor.
   */
  public resolveSpeaker(participantUserId: string, fallbackName?: string): VerifiedParticipant {
    if (participantUserId === this.bookingContext.studentUserId) {
      return {
        userId: participantUserId,
        name: this.bookingContext.studentName || fallbackName || "Student",
        role: "student",
        isAuthorized: true,
      };
    }

    if (participantUserId === this.bookingContext.mentorUserId) {
      return {
        userId: participantUserId,
        name: this.bookingContext.mentorName || fallbackName || "Mentor",
        role: "mentor",
        isAuthorized: true,
      };
    }

    if (participantUserId === "system" || participantUserId === "astrion-ai") {
      return {
        userId: participantUserId,
        name: "ASTRION AI",
        role: "system",
        isAuthorized: true,
      };
    }

    // Unauthorized third-party participant detected
    return {
      userId: participantUserId,
      name: fallbackName || "Unknown Participant",
      role: "system",
      isAuthorized: false,
    };
  }

  /**
   * Verifies if a given audio stream track belongs to an authorized party in the booking.
   */
  public isTrackAuthorized(participantUserId: string): boolean {
    const verified = this.resolveSpeaker(participantUserId);
    return verified.isAuthorized && verified.role !== "system";
  }
}
