/**
 * MentorMaze Ultra-Low Latency In-Memory Chat & Signaling Hub (< 1ms)
 * 100% Free Technology — Uses Native Server-Sent Events (SSE) & Memory Broadcast
 */

type MessageListener = (data: any) => void;

declare global {
  // eslint-disable-next-line no-var
  var __mmChatRoomListeners: Map<string, Set<MessageListener>> | undefined;
  // eslint-disable-next-line no-var
  var __mmChatRoomHistory: Map<string, any[]> | undefined;
}

if (!global.__mmChatRoomListeners) {
  global.__mmChatRoomListeners = new Map();
}

if (!global.__mmChatRoomHistory) {
  global.__mmChatRoomHistory = new Map();
}

const roomListeners = global.__mmChatRoomListeners;
const roomHistory = global.__mmChatRoomHistory;

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
   * Retrieves in-memory instant chat history (< 0.1ms)
   */
  public static getHistory(bookingId: string): any[] {
    return roomHistory.get(bookingId) || [];
  }

  /**
   * Broadcast message to all room listeners with sub-millisecond dispatch
   */
  public static broadcast(bookingId: string, message: any): void {
    // 1. Append to in-memory room history
    if (!roomHistory.has(bookingId)) {
      roomHistory.set(bookingId, []);
    }
    const history = roomHistory.get(bookingId)!;
    if (!history.some((m) => m.id === message.id)) {
      history.push(message);
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
    }

    // 2. Dispatch instantly to active listeners
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
