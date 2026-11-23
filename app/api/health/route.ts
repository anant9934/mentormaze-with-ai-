import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  service: string;
  role: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: {
      status: "connected" | "degraded" | "disconnected" | "in-memory";
      latencyMs?: number;
      error?: string;
    };
    outbox: {
      status: string;
    };
  };
  system: {
    nodeVersion: string;
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const strict = url.searchParams.get("strict") === "true";
  const startDbCheck = Date.now();

  let dbStatus: "connected" | "degraded" | "disconnected" | "in-memory" = "disconnected";
  let dbLatency: number | undefined;
  let dbError: string | undefined;

  try {
    const db = getDb();
    if (process.env.USE_MEMORY_DB === "true" || process.env.VITEST === "true") {
      dbStatus = "in-memory";
      dbLatency = Date.now() - startDbCheck;
    } else {
      // Quick ping test with 2.5s timeout
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database check timeout")), 2500))
      ]);
      dbStatus = "connected";
      dbLatency = Date.now() - startDbCheck;
    }
  } catch (err: any) {
    dbError = err?.message || "Database ping failed";
    dbStatus = "degraded";
  }

  const mem = process.memoryUsage();
  const isHealthy = dbStatus === "connected" || dbStatus === "in-memory" || (!strict && dbStatus === "degraded");

  const responsePayload: HealthStatus = {
    status: isHealthy ? (dbStatus === "degraded" ? "degraded" : "ok") : "error",
    service: "mentormaze",
    role: process.env.SERVICE_ROLE || (process.env.VERCEL ? "frontend" : "backend"),
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        ...(dbError ? { error: dbError } : {}),
      },
      outbox: {
        status: "active",
      },
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
  };

  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(responsePayload, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "X-Service-Role": responsePayload.role,
      "X-Service-Status": responsePayload.status,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "X-Service-Status": "ok",
    },
  });
}
