/**
 * MentorMaze Ultra-Low Latency In-Memory Chat & Signaling Hub (< 1ms)
 * 100% Free Technology — Uses Native Server-Sent Events (SSE) & Memory Broadcast
 */

type MessageListener = (data: any) => void;

declare global {
  // eslint-disable-next-line no-var
  var __mmChatRoomListeners: Map<string, Set<MessageListener>> | undefined;
}

if (!global.__mmChatRoomListeners) {
  global.__mmChatRoomListeners = new Map();
}

const roomListeners = global.__mmChatRoomListeners;

export class RealtimeChatHub {
  /**
   * Subscribe an active SSE stream connection to room events
   */
  public static subscribe(bookingId: string, listener: MessageListener): () => void {
    if (!roomListeners.has(bookingId)) {
      roomListeners.set(bookingId, new Set());
    }

    const listeners = roomListeners.get(bookingId)!;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        roomListeners.delete(bookingId);
      }
    };
  }

  /**
   * Broadcast message to all room listeners with sub-millisecond dispatch
   */
  public static broadcast(bookingId: string, message: any): void {
    const listeners = roomListeners.get(bookingId);
    if (!listeners || listeners.size === 0) return;

    for (const listener of listeners) {
      try {
        listener(message);
      } catch (err) {
        console.warn("[RealtimeChatHub] Listener notification error:", err);
      }
    }
  }
}
