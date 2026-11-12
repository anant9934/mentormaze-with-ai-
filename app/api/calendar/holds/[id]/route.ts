import { NextRequest, NextResponse } from "next/server";
import { BookingHoldManager } from "@/lib/calendar/hold-manager";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: holdId } = await params;
    const db = getDb();

    const [hold] = await db
      .select()
      .from(schema.bookingHolds)
      .where(eq(schema.bookingHolds.id, holdId))
      .limit(1);

    if (!hold) {
      return NextResponse.json({ success: false, error: "Hold not found" }, { status: 404 });
    }

    const isExpired = new Date(hold.expiresAt) <= new Date();

    return NextResponse.json({
      success: true,
      hold: {
        ...hold,
        isExpired,
        isActive: hold.status === "active" && !isExpired,
      },
    });
  } catch (error: any) {
    console.error("[API calendar/holds/[id] GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch hold" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: holdId } = await params;
    const result = await BookingHoldManager.releaseHold(holdId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API calendar/holds/[id] DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to release hold" },
      { status: 500 }
    );
  }
}
