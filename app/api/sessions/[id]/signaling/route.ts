/**
 * MentorMaze Zero-Cost WebRTC Peer-to-Peer Signaling Endpoint
 * Enables peer-to-peer audio, video, and DataChannel (< 5ms) exchange without third-party cloud servers.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type SignalMessage = {
  id: string;
  seq: number;
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
  // eslint-disable-next-line no-var
  var __mmSignalingSeq: number | undefined;
}

if (!global.__mmSignalingRooms) {
  global.__mmSignalingRooms = new Map();
}
if (!global.__mmSignalingSeq) {
  global.__mmSignalingSeq = 0;
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
  const sinceSeq = parseInt(searchParams.get("sinceSeq") || "0", 10);
  const isReset = searchParams.get("reset") === "true";

  if (isReset) {
    rooms.delete(bookingId);
    return NextResponse.json({ success: true, message: "Room signaling reset" });
  }

  const now = Date.now();
  // Automatically purge signals older than 30 seconds
  let roomMessages = rooms.get(bookingId) || [];
  roomMessages = roomMessages.filter((m) => now - m.timestamp < 30000);
  rooms.set(bookingId, roomMessages);

  const lastSeq = roomMessages.length > 0 ? roomMessages[roomMessages.length - 1].seq : (global.__mmSignalingSeq || 0);

  // Filter messages: newer than sinceSeq / since (or recent within 15s if joining fresh)
  const pending = roomMessages.filter((m) => {
    if (sinceSeq > 0) {
      if (m.seq <= sinceSeq) return false;
    } else if (since > 0) {
      if (m.timestamp <= since) return false;
    } else {
      // First poll (sinceSeq=0 & since=0): only return signals from the last 15 seconds
      if (now - m.timestamp > 15000) return false;
    }
    if (clientId && (m.senderClientId ? m.senderClientId === clientId : m.senderId === clientId)) return false;
    if (m.targetClientId && clientId && m.targetClientId !== clientId) return false;
    return true;
  });

  return NextResponse.json({
    success: true,
    signals: pending,
    serverTime: now,
    lastSeq,
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

    const now = Date.now();
    let roomMessages = rooms.get(bookingId)!;

    // Prune expired messages older than 25s
    roomMessages = roomMessages.filter((m) => now - m.timestamp < 25000);

    global.__mmSignalingSeq = (global.__mmSignalingSeq || 0) + 1;

    const signal: SignalMessage = {
      id: `${now}-${Math.random().toString(36).substring(2, 8)}`,
      seq: global.__mmSignalingSeq,
      senderId,
      senderClientId: senderClientId || senderId,
      senderRole: senderRole || "student",
      targetId,
      targetClientId,
      type,
      payload,
      timestamp: now,
    };

    roomMessages.push(signal);

    // Keep only most recent 100 messages
    if (roomMessages.length > 100) {
      roomMessages.splice(0, roomMessages.length - 100);
    }
    rooms.set(bookingId, roomMessages);

    return NextResponse.json({
      success: true,
      signalId: signal.id,
      seq: signal.seq,
      timestamp: signal.timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process signaling" },
      { status: 500 }
    );
  }
}
