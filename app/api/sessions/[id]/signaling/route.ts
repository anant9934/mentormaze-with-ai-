/**
 * MentorMaze Zero-Cost WebRTC Peer-to-Peer Signaling Endpoint
 * Enables peer-to-peer audio, video, and DataChannel (< 5ms) exchange without third-party cloud servers.
 */

import { NextRequest, NextResponse } from "next/server";

// In-memory ephemeral signaling message mailbox keyed by bookingId -> participantId
type SignalMessage = {
  id: string;
  senderId: string;
  senderRole: string;
  targetId?: string; // If targeting specific peer, otherwise broadcast to room
  type: "offer" | "answer" | "candidate" | "join" | "leave";
  payload: any;
  timestamp: number;
};

// Global in-memory room signaling state across server lifecycle
declare global {
  // eslint-disable-next-line no-var
  var __mmSignalingRooms: Map<string, SignalMessage[]> | undefined;
}

if (!global.__mmSignalingRooms) {
  global.__mmSignalingRooms = new Map();
}

const rooms = global.__mmSignalingRooms;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") || "";
  const since = parseInt(searchParams.get("since") || "0", 10);

  const roomMessages = rooms.get(bookingId) || [];
  
  // Return messages not sent by this participant and newer than 'since'
  const pending = roomMessages.filter(
    (m) => m.senderId !== participantId && m.timestamp > since && (!m.targetId || m.targetId === participantId)
  );

  return NextResponse.json({
    success: true,
    signals: pending,
    serverTime: Date.now(),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await req.json();
    const { senderId, senderRole, targetId, type, payload } = body;

    if (!senderId || !type) {
      return NextResponse.json(
        { success: false, error: "senderId and type are required" },
        { status: 400 }
      );
    }

    if (!rooms.has(bookingId)) {
      rooms.set(bookingId, []);
    }

    const roomMessages = rooms.get(bookingId)!;

    const signal: SignalMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      senderId,
      senderRole: senderRole || "student",
      targetId,
      type,
      payload,
      timestamp: Date.now(),
    };

    roomMessages.push(signal);

    // Keep only the most recent 100 signaling events to prevent memory leaks
    if (roomMessages.length > 100) {
      roomMessages.splice(0, roomMessages.length - 100);
    }

    return NextResponse.json({
      success: true,
      signalId: signal.id,
      timestamp: signal.timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process signaling" },
      { status: 500 }
    );
  }
}

