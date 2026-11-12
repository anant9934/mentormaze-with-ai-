# MENTORMAZE — RELIABLE OUTBOX WORKER DEPLOYMENT & OPERATION GUIDE

**Platform:** MentorMaze (under AI Tathastu)  
**Evaluation Date:** November 2026  
**Module:** `lib/workers/outbox-worker.ts`, `app/api/cron/outbox/route.ts`, `scripts/run-outbox-worker.ts`  
**Author:** Principal Software Architect & DevOps/Infrastructure Lead  
**Verification Status:** Verified Locally via Automated Batch Tests; Cron Endpoint Ready for Production

---

## 1. Executive Summary

MentorMaze adopts the **Transactional Outbox Pattern** to decouple critical user actions (such as booking reservations, payment confirmations, and chat messages) from slow, asynchronous side-effects (such as email delivery via Resend, push notifications, and Google Calendar synchronization).

Instead of making external HTTP calls directly inside the user's web request—which risks hanging the client, causing timeouts, or creating distributed transaction inconsistencies if an external API fails—events are written to the `outbox_events` table inside the same ACID database transaction as the primary record.

This guide details the worker architecture, error recovery mechanisms, and practical deployment models for production.

---

## 2. Worker Architecture & Operational Invariants

```
   [User Request]
         │
         ▼
┌──────────────────────────────┐
│  PostgreSQL ACID Transaction │
│  - Insert Booking            │
│  - Insert Ledger Entry       │
│  - Insert Outbox Event ──────┼───────────────┐
└──────────────────────────────┘               │ (Atomic write)
                                               ▼
                                  ┌─────────────────────────┐
                                  │   outbox_events Table   │
                                  │ status: 'pending'       │
                                  └────────────┬────────────┘
                                               │
                                               ▼
┌───────────────────────────────────────────────────────────┐
│              Outbox Batch Processor                       │
│  1. STALE JOB RECOVERY: Reset jobs with expired locks     │
│  2. ATOMIC CLAIM: UPDATE ... WHERE id IN (SELECT ...      │
│     FOR UPDATE SKIP LOCKED) RETURNING ...                 │
│  3. EXECUTE IDEMPOTENT HANDLERS                           │
│  4. ON SUCCESS: status = 'completed'                      │
│  5. ON FAILURE: retry_count++, next_retry_at (backoff)    │
│  6. IF RETRIES >= 5: status = 'dead_letter'               │
└───────────────────────────────────────────────────────────┘
```

### 2.1 Atomic Job Claiming (`FOR UPDATE SKIP LOCKED`)
To support horizontally scaled workers without race conditions or duplicate execution, jobs are claimed using PostgreSQL's `FOR UPDATE SKIP LOCKED`:

```sql
UPDATE outbox_events
SET status = 'processing',
    locked_at = now(),
    locked_by = $workerId
WHERE id IN (
  SELECT id FROM outbox_events
  WHERE (status = 'pending' OR (status = 'failed' AND retry_count < 5 AND (next_retry_at IS NULL OR next_retry_at <= now())))
  ORDER BY created_at ASC
  LIMIT $batchSize
  FOR UPDATE SKIP LOCKED
)
RETURNING id, event_type, payload, status, retry_count;
```
If multiple worker processes poll concurrently, each immediately claims a unique partition of rows without waiting on locks or re-processing the same event.

### 2.2 Exponential Backoff Calculation
When an external provider fails (e.g., email service returns HTTP 503), the event is placed into `status = 'failed'` with an exponential retry delay:

$$\text{Delay Seconds} = \min\left(300, 5 \times 2^{\text{retry\_count}}\right)$$

- Retry 1: $5 \times 2^0 = 5\text{ seconds}$
- Retry 2: $5 \times 2^1 = 10\text{ seconds}$
- Retry 3: $5 \times 2^2 = 20\text{ seconds}$
- Retry 4: $5 \times 2^3 = 40\text{ seconds}$
- Retry 5: $5 \times 2^4 = 80\text{ seconds}$

### 2.3 Dead-Letter Queue (`dead_letter`)
After 5 consecutive failures (`MAX_RETRIES = 5`), the event is marked `status = 'dead_letter'`. It is excluded from automatic polling to prevent poison-pill events from congesting the queue. Administrators can inspect and replay dead-letter events via the admin portal.

### 2.4 Stale Job Recovery
If a worker container crashes mid-execution (e.g. OOM or SIGKILL), its claimed jobs could remain indefinitely stuck in `'processing'`. Before every batch claim, the processor automatically resets orphaned locks:

```sql
UPDATE outbox_events
SET status = 'pending', locked_at = null, locked_by = null
WHERE status = 'processing' 
  AND locked_at < now() - interval '5 minutes';
```

---

## 3. Why Serverless Applications Cannot Use `setInterval`

> [!WARNING]
> **Serverless Execution Boundary**  
> In serverless platforms such as Vercel, AWS Lambda, or Cloudflare Workers:
> - Execution processes are frozen or terminated immediately after the HTTP response is sent.
> - Background timers (`setInterval` or `setTimeout`) are paused during CPU idle and will not fire predictably.
> - Background loops cause memory leaks or zombie connections when instances are recycled.
> 
> Therefore, outbox processing in production **MUST** be triggered either via an external scheduled cron HTTP request or run as a standalone long-running worker container.

---

## 4. Production Deployment Options

### Option A: Vercel Cron / Scheduled Serverless (Recommended for Vercel)
MentorMaze includes a secure cron route at `app/api/cron/outbox/route.ts`.

1. Define a secret token in production environment:
   ```
   CRON_SECRET="mm_cron_secure_random_key_64_chars"
   ```
2. Configure `vercel.json` in project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/outbox",
         "schedule": "* * * * *"
       }
     ]
   }
   ```
3. Vercel automatically invokes the endpoint every 60 seconds with header `Authorization: Bearer <CRON_SECRET>`. The endpoint processes up to 50 queued events per execution and returns a JSON summary.

### Option B: Standalone Container / Worker Daemon (Recommended for Docker / AWS ECS / Render)
For high-volume production deployments requiring sub-second dispatch latency:
1. Run the standalone daemon script:
   ```bash
   npx tsx scripts/run-outbox-worker.ts
   ```
2. The process executes a continuous polling loop with a 3000ms idle delay, graceful SIGINT/SIGTERM handling, and structured JSON output.

### Option C: Systemd Service on Linux VM
Create `/etc/systemd/system/mentormaze-outbox.service`:
```ini
[Unit]
Description=MentorMaze Outbox Worker Daemon
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/mentormaze
ExecStart=/usr/local/bin/npx tsx scripts/run-outbox-worker.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://...

[Install]
WantedBy=multi-user.target
```

---

## 5. Structured Logging & Monitoring

The outbox worker emits structured JSON log lines for every processed event:

```json
{"level":"info","workerId":"worker-34cb5990","eventId":"8144dd28-0456-499c-aba7-02752a3d8651","eventType":"booking.created","durationMs":1,"status":"completed"}
{"level":"error","workerId":"worker-34cb5990","eventId":"c1a89b21-4321-4def-9876-aabbccddeeff","eventType":"email.dispatch","error":"Resend API rate limit exceeded","retryCount":2,"status":"failed"}
```

These logs are compatible with Datadog, AWS CloudWatch, LogDNA, and Axiom for real-time alerting on error spikes or elevated queue latency.

