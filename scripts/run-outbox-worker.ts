/**
 * MentorMaze — Standalone Outbox Worker Daemon
 * 
 * Continuous background worker process for non-serverless deployments
 * (Docker, ECS, Kubernetes, or VM systemd service).
 */

import { processOutboxBatch } from "../lib/workers/outbox-worker";

const POLL_INTERVAL_MS = 3000;
const BATCH_SIZE = 20;

let isRunning = true;

async function main() {
  console.log(`[Outbox Worker Daemon] Starting outbox polling loop (Interval: ${POLL_INTERVAL_MS}ms, Batch: ${BATCH_SIZE})...`);

  process.on("SIGINT", () => {
    console.log("[Outbox Worker Daemon] Received SIGINT. Shutting down gracefully...");
    isRunning = false;
  });

  process.on("SIGTERM", () => {
    console.log("[Outbox Worker Daemon] Received SIGTERM. Shutting down gracefully...");
    isRunning = false;
  });

  while (isRunning) {
    try {
      const result = await processOutboxBatch(BATCH_SIZE);
      if (result.processed > 0 || result.errors > 0) {
        console.log(`[Outbox Worker Daemon] Batch complete: processed=${result.processed}, errors=${result.errors}, deadLettered=${result.deadLettered}, duration=${result.durationMs}ms`);
      }
    } catch (err) {
      console.error("[Outbox Worker Daemon] Unhandled error during batch processing:", err);
    }

    // Sleep before next poll iteration
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.log("[Outbox Worker Daemon] Worker process exited.");
}

main().catch((err) => {
  console.error("[Outbox Worker Daemon] Fatal process crash:", err);
  process.exit(1);
});
