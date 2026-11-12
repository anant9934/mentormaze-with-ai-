import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { livekitRegistry } from "@/lib/livekit/provider-registry";
import { LiveKitHealthChecker } from "@/lib/livekit/health-checker";

/**
 * Admin Video Infrastructure Management API.
 * Requires server-side admin session authentication.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();

  // In production, strictly enforce admin role
  if (process.env.NODE_ENV === "production") {
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized: Admin clearance required." }, { status: 403 });
    }
  }

  const summary = livekitRegistry.getSummary();
  const recentErrors = livekitRegistry.getRecentErrors();

  return NextResponse.json({
    success: true,
    summary,
    recentErrors,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  // In production, strictly enforce admin role
  if (process.env.NODE_ENV === "production") {
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized: Admin clearance required." }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "update_weights": {
        const { weights } = body;
        if (!weights || typeof weights !== "object") {
          return NextResponse.json({ error: "Invalid weights mapping provided." }, { status: 400 });
        }

        for (const [providerId, weight] of Object.entries(weights)) {
          livekitRegistry.updateProviderWeight(providerId, Number(weight));
        }

        return NextResponse.json({
          success: true,
          message: "Provider traffic weights updated successfully.",
          summary: livekitRegistry.getSummary(),
        });
      }

      case "toggle_provider": {
        const { providerId, enabled } = body;
        if (!providerId || typeof enabled !== "boolean") {
          return NextResponse.json({ error: "Missing providerId or enabled flag." }, { status: 400 });
        }

        livekitRegistry.toggleProvider(providerId, enabled);
        return NextResponse.json({
          success: true,
          message: `Provider ${providerId} ${enabled ? "enabled" : "disabled"} successfully.`,
          summary: livekitRegistry.getSummary(),
        });
      }

      case "check_health": {
        const { providerId } = body;
        if (!providerId) {
          // Probe all
          const results = await LiveKitHealthChecker.checkAllProviders();
          return NextResponse.json({
            success: true,
            results,
            summary: livekitRegistry.getSummary(),
          });
        }

        const result = await LiveKitHealthChecker.checkProviderHealth(providerId);
        return NextResponse.json({
          success: true,
          result,
          summary: livekitRegistry.getSummary(),
        });
      }

      case "reset_circuit": {
        const { providerId } = body;
        if (!providerId) {
          return NextResponse.json({ error: "Missing providerId." }, { status: 400 });
        }

        livekitRegistry.resetCircuitBreaker(providerId);
        return NextResponse.json({
          success: true,
          message: `Circuit breaker reset to CLOSED for provider ${providerId}.`,
          summary: livekitRegistry.getSummary(),
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to process video infrastructure action", details: err.message },
      { status: 500 }
    );
  }
}
