import { NextRequest, NextResponse } from "next/server";
import {
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from "./bruteForceProtection";
import { csrfMiddleware, getCsrfToken } from "./csrf";
import {
  MODERATE_LIMIT,
  rateLimitMiddleware,
  STRICT_LIMIT,
} from "./rateLimiter";

export type EndpointSecurity = "strict" | "moderate" | "bot" | "none";

const ENDPOINT_LIMITS: Record<
  EndpointSecurity,
  typeof STRICT_LIMIT | typeof MODERATE_LIMIT | null
> = {
  strict: STRICT_LIMIT,
  moderate: MODERATE_LIMIT,
  bot: null,
  none: null,
};

export interface SecurityCheckResult {
  passed: boolean;
  response?: NextResponse;
  ip?: string;
}

export async function applySecurity(
  request: NextRequest,
  level: EndpointSecurity = "moderate",
): Promise<SecurityCheckResult> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  if (level !== "none" && level !== "bot") {
    const limitConfig = ENDPOINT_LIMITS[level];
    if (limitConfig) {
      const rateLimitResponse = rateLimitMiddleware(request, limitConfig);
      if (rateLimitResponse) {
        return { passed: false, response: rateLimitResponse, ip };
      }
    }
  }

  // Skip CSRF for login - user doesn't have a token yet
  // CSRF cookie is set in the login response for subsequent requests
  if (level !== "none" && level !== "bot") {
    const url = new URL(request.url);
    // Skip CSRF for auth routes (login, register) since they set the cookie
    if (
      url.pathname.includes("/api/auth/login") ||
      url.pathname.includes("/api/auth/register")
    ) {
      return { passed: true, ip };
    }

    const csrfToken = await getCsrfToken();
    const csrfResponse = csrfMiddleware(request, csrfToken);
    if (csrfResponse) {
      return { passed: false, response: csrfResponse, ip };
    }
  }

  return { passed: true, ip };
}

export function checkLoginBruteForce(identifier: string): NextResponse | null {
  const { blocked, remainingTime } = checkBruteForce(identifier);
  if (blocked) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please try again in ${Math.ceil(remainingTime / 1000)} seconds.`,
        retryAfter: Math.ceil(remainingTime / 1000),
      },
      { status: 429 },
    );
  }
  return null;
}

export function recordLoginFailure(ip: string, userIdentifier?: string): void {
  recordFailedAttempt(`ip:${ip}`);
  if (userIdentifier) {
    recordFailedAttempt(`user:${userIdentifier}`);
  }
}

export function recordLoginSuccess(ip: string, userIdentifier?: string): void {
  recordSuccessfulAttempt(`ip:${ip}`);
  if (userIdentifier) {
    recordSuccessfulAttempt(`user:${userIdentifier}`);
  }
}

export function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return response;
}
