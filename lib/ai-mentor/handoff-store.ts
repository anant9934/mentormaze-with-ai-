export type HandoffLifecycleState =
  | "handoff_recommended"
  | "student_authorization_pending"
  | "student_authorized"
  | "inquiry_created"
  | "mentor_inquiry_accepted"
  | "mentor_inquiry_rejected"
  | "booking_requested"
  | "booking_confirmed"
  | "session_completed"
  | "inquiry_or_booking_cancelled";

export interface HandoffAuditRecord {
  id: string;
  studentUserId: string;
  action: "RECOMMENDED" | "AUTHORIZED" | "INQUIRY_CREATED" | "CONSENT_REVOKED" | "ACCESS_ATTEMPT";
  actorUserId: string;
  actorRole: string;
  state: HandoffLifecycleState;
  notes?: string;
  timestamp: string;
}

export const handoffBriefings = new Map<
  string,
  {
    studentUserId: string;
    studentName: string;
    targetDomain: string;
    sanitizedBriefing: string;
    mentorId?: string;
    inquiryBookingId?: string;
    state: HandoffLifecycleState;
    authorizedAt: string;
  }
>();

export const handoffAuditTrail: HandoffAuditRecord[] = [];
