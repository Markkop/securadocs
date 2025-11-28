import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // Apply rate limiting to specific endpoints
  let rateLimitConfig = null;
  let rateLimitKey = "";

  // Auth endpoints
  if (pathname.startsWith("/api/auth/sign-in")) {
    rateLimitConfig = RATE_LIMITS.login;
    rateLimitKey = `login:${ip}`;
  } else if (pathname.startsWith("/api/auth/sign-up")) {
    rateLimitConfig = RATE_LIMITS.register;
    rateLimitKey = `register:${ip}`;
  }
  // File upload endpoint
  else if (pathname === "/api/files/upload" && request.method === "POST") {
    rateLimitConfig = RATE_LIMITS.upload;
    rateLimitKey = `upload:${ip}`;
  }

  // Apply rate limit if configured
  if (rateLimitConfig && rateLimitKey) {
    const result = checkRateLimit(rateLimitKey, rateLimitConfig);

    // Add rate limit headers to response
    const response = result.success
      ? NextResponse.next()
      : NextResponse.json(
          {
            error: "Muitas requisições. Tente novamente mais tarde.",
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          { status: 429 }
        );

    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.reset.toString());

    if (!result.success) {
      response.headers.set(
        "Retry-After",
        Math.ceil((result.reset - Date.now()) / 1000).toString()
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to auth routes
    "/api/auth/:path*",
    // Apply to file upload
    "/api/files/upload",
  ],
};
