/**
 * MentorMaze Real-Time Event Bus
 * Manages active Server-Sent Events (SSE) connections and broadcasts events per user
 * Multi-tab synchronization & zero external dependency
 */

import { EventEmitter } from "events";

type SSEController = ReadableStreamDefaultController<any>;

interface ActiveConnection {
  connectionId: string;
  controller: SSEController;
  connectedAt: Date;
}

class NotificationEventBus extends EventEmitter {
  private userConnections = new Map<string, Map<string, ActiveConnection>>();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Register a new SSE connection for a user
   */
  public registerConnection(userId: string, connectionId: string, controller: SSEController) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Map());
    }
    const connections = this.userConnections.get(userId)!;
    connections.set(connectionId, {
      connectionId,
      controller,
      connectedAt: new Date(),
    });

    // Send initial connected ping
    this.sendToController(controller, "connected", {
      connectionId,
      connectedAt: new Date().toISOString(),
      activeTabs: connections.size,
    });
  }

  /**
   * Remove a connection when disconnected
   */
  public removeConnection(userId: string, connectionId: string) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  /**
   * Broadcast an event to all open tabs of a specific user
   */
  public broadcastToUser(userId: string, eventName: string, data: any) {
    const connections = this.userConnections.get(userId);
    if (!connections || connections.size === 0) return 0;

    let sent = 0;
    const deadConnectionIds: string[] = [];

    connections.forEach((conn, id) => {
      try {
        this.sendToController(conn.controller, eventName, data);
        sent++;
      } catch (err) {
        deadConnectionIds.push(id);
      }
    });

    // Clean up dead controllers
    for (const deadId of deadConnectionIds) {
      connections.delete(deadId);
    }
    if (connections.size === 0) {
      this.userConnections.delete(userId);
    }

    return sent;
  }

  /**
   * Broadcast an event to all connected users (for global announcements)
   */
  public broadcastGlobal(eventName: string, data: any) {
    let totalSent = 0;
    for (const userId of this.userConnections.keys()) {
      totalSent += this.broadcastToUser(userId, eventName, data);
    }
    return totalSent;
  }

  /**
   * Get total active connected users & tabs
   */
  public getStats() {
    let totalTabs = 0;
    for (const connections of this.userConnections.values()) {
      totalTabs += connections.size;
    }
    return {
      connectedUsers: this.userConnections.size,
      connectedTabs: totalTabs,
    };
  }

  /**
   * Format and send an SSE frame
   */
  private sendToController(controller: SSEController, event: string, data: any) {
    const encoder = new TextEncoder();
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }
}

// Global singleton instance preserved across Next.js dev server reloads
const globalForEvents = global as unknown as { notificationEventBus?: NotificationEventBus };

export const notificationEventBus = globalForEvents.notificationEventBus || new NotificationEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.notificationEventBus = notificationEventBus;
}

