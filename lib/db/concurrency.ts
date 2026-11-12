/**
 * MentorMaze Process-Level Concurrency Control
 * Serializes concurrent booking and slot hold requests targeting the same mentor within the Node.js process.
 * Eliminates race conditions before touching the database connection pool.
 * https://mentormaze.aitathastu.com
 */

export class MentorLockManager {
  private static queues = new Map<string, Promise<void>>();

  static async acquire<T>(mentorId: string, task: () => Promise<T>): Promise<T> {
    const currentQueue = this.queues.get(mentorId) || Promise.resolve();

    let releaseLock!: () => void;
    const nextInQueue = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Chain this task onto the mentor's queue (safely catching any prior failure)
    const queuedTask = currentQueue.catch(() => {}).then(async () => {
      try {
        return await task();
      } finally {
        releaseLock();
      }
    });

    this.queues.set(mentorId, nextInQueue);

    try {
      return await queuedTask;
    } finally {
      if (this.queues.get(mentorId) === nextInQueue) {
        this.queues.delete(mentorId);
      }
    }
  }
}

