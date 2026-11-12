import { NextRequest, NextResponse } from "next/server";
import { processOutboxBatch } from "@/lib/workers/outbox-worker";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "mentormaze_dev_cron_secret";

    // Validate cron authorization token in production
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batchSize = parseInt(searchParams.get("batchSize") || "20");

    const result = await processOutboxBatch(batchSize);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error("Outbox cron trigger error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

