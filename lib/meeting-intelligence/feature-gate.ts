/**
 * MentorMaze Meeting Intelligence Server-Side Feature Gate
 * Adapted from Cicada Integration Architecture
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Enforces fail-closed feature activation across all Meeting Intelligence APIs.
 * Defaults strictly to DISABLED ("false") unless ENABLE_MEETING_INTELLIGENCE="true".
 */

import { NextResponse } from "next/server";

export function isMeetingIntelligenceEnabled(): boolean {
  return process.env.ENABLE_MEETING_INTELLIGENCE === "true";
}

export function meetingIntelligenceDisabledResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Meeting Intelligence is temporarily unavailable while security and runtime updates are being completed.",
      code: "MEETING_INTELLIGENCE_DISABLED",
    },
    { status: 503 }
  );
}
