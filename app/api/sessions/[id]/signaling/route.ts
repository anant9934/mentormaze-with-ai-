/**
 * MentorMaze Zero-Cost WebRTC Peer-to-Peer Signaling Endpoint
 * Enables peer-to-peer audio, video, and DataChannel (< 5ms) exchange without third-party cloud servers.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SignalMessage = {
  id: string;
  senderId: string;
  senderClientId?: string;
  senderRole: string;
  targetId?: string;
  targetClientId?: string;
  type: "offer" | "answer" | "candidate" | "join" | "leave" | "presence";
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
  const clientId = searchParams.get("clientId") || searchParams.get("participantId") || "";
  const since = parseInt(searchParams.get("since") || "0", 10);

  const roomMessages = rooms.get(bookingId) || [];

  // Filter messages: newer than 'since', not sent by this client instance, matching target if targeted
  const pending = roomMessages.filter((m) => {
    if (m.timestamp <= since) return false;
    if (clientId && (m.senderClientId === clientId || m.senderId === clientId)) return false;
    if (m.targetClientId && clientId && m.targetClientId !== clientId) return false;
    return true;
  });

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
    const { senderId, senderClientId, senderRole, targetId, targetClientId, type, payload } = body;

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
      senderClientId: senderClientId || senderId,
      senderRole: senderRole || "student",
      targetId,
      targetClientId,
      type,
      payload,
      timestamp: Date.now(),
    };

    roomMessages.push(signal);

    // Keep only the most recent 120 signaling events to prevent memory leaks
    if (roomMessages.length > 120) {
      roomMessages.splice(0, roomMessages.length - 120);
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
