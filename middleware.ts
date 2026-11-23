import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://mentormaze.aitathastu.com",
  "https://aitathastu.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Server-to-server or same-origin
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) return true;
  if (process.env.NEXT_PUBLIC_APP_URL && origin === process.env.NEXT_PUBLIC_APP_URL) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isApi = request.nextUrl.pathname.startsWith("/api");

  // Handle CORS Preflight for APIs
  if (isApi && request.method === "OPTIONS") {
    const allowed = isOriginAllowed(origin);
    const preflightHeaders = new Headers({
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, X-Session-Id, X-Consent-Epoch, X-Client-Version, X-Turnstile-Token",
      "Access-Control-Max-Age": "86400",
    });

    if (allowed && origin) {
      preflightHeaders.set("Access-Control-Allow-Origin", origin);
      preflightHeaders.set("Access-Control-Allow-Credentials", "true");
    } else {
      preflightHeaders.set("Access-Control-Allow-Origin", "*");
    }

    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // Continue request chain
  const response = NextResponse.next();

  // Attach CORS headers to API responses
  if (isApi) {
    if (origin && isOriginAllowed(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
  }

  // Baseline Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=*, microphone=*, display-capture=*");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
