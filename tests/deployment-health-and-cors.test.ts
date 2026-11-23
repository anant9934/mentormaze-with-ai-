import { describe, it, expect } from "vitest";
import { GET as healthGet, HEAD as healthHead } from "../app/api/health/route";
import { middleware } from "../middleware";
import { NextRequest } from "next/server";

describe("Deployment Health Check & Multi-Cloud Edge Verification", () => {
  it("returns healthy status with system telemetry via GET /api/health", async () => {
    const req = new Request("http://localhost:3000/api/health");
    const res = await healthGet(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.service).toBe("mentormaze");
    expect(["ok", "degraded"]).toContain(data.status);
    expect(data.timestamp).toBeDefined();
    expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(data.system.nodeVersion).toBeDefined();
    expect(data.system.memoryUsageMb.rss).toBeGreaterThan(0);
    expect(data.checks.database.status).toBeDefined();
  });

  it("returns 200 on HEAD /api/health with status header", async () => {
    const res = await healthHead();
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Service-Status")).toBe("ok");
  });

  it("handles CORS preflight OPTIONS requests for API routes", () => {
    const req = new NextRequest("http://localhost:3000/api/health", {
      method: "OPTIONS",
      headers: {
        origin: "https://mentormaze.aitathastu.com",
        "access-control-request-method": "GET",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://mentormaze.aitathastu.com");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("attaches baseline security headers to requests", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = middleware(req);

    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
