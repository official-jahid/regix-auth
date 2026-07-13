import { type NextRequest, NextResponse } from "next/server";

// In-memory rate limiter (uses Map, resets on cold start - acceptable for single-instance deployment)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
  auth: { maxRequests: 5, windowMs: 60_000 }, // 5 auth requests/min
  api: { maxRequests: 30, windowMs: 60_000 }, // 30 API requests/min
  bot: { maxRequests: 60, windowMs: 60_000 }, // 60 bot requests/min
};

function getRateLimitInfo(
  ip: string,
  tier: keyof typeof RATE_LIMIT_CONFIG,
): { allowed: boolean; remaining: number; reset: number } {
  const key = `${tier}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG[tier].windowMs,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG[tier].maxRequests - 1,
      reset: now + RATE_LIMIT_CONFIG[tier].windowMs,
    };
  }

  if (entry.count >= RATE_LIMIT_CONFIG[tier].maxRequests) {
    return { allowed: false, remaining: 0, reset: entry.resetTime };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG[tier].maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// CSRF: Validate Origin/Referer headers for state-changing requests
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host") || "";

  const allowedOrigins = [
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean);

  // If no origin header and no referer, allow (same-origin requests often omit origin)
  if (!origin && !referer) return true;

  const checkOrigin = origin || referer;
  if (!checkOrigin) return true;

  try {
    const url = new URL(checkOrigin);
    const checkHost = url.host;

    if (checkHost === host) return true;
    if (
      allowedOrigins.some((o) => {
        try {
          return new URL(o).host === checkHost;
        } catch {
          return false;
        }
      })
    )
      return true;

    return false;
  } catch {
    return false;
  }
}

// Clean up expired entries periodically
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Run cleanup every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function middleware(request: NextRequest) {
  // Initialize cleanup on first request
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupRateLimits, 60_000);
  }

  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const method = request.method.toUpperCase();

  // === RATE LIMITING ===

  // Auth endpoints: strict rate limit
  if (pathname.startsWith("/api/auth/") || pathname === "/auth") {
    const rateLimit = getRateLimitInfo(ip, "auth");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.auth.maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Limit",
      String(RATE_LIMIT_CONFIG.auth.maxRequests),
    );
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    return response;
  }

  // Bot API: moderate rate limit
  if (pathname.startsWith("/api/bot/")) {
    const rateLimit = getRateLimitInfo(ip, "bot");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    return NextResponse.next();
  }

  // General API: moderate rate limit
  if (pathname.startsWith("/api/")) {
    const rateLimit = getRateLimitInfo(ip, "api");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    return NextResponse.next();
  }

  // === CSRF PROTECTION for state-changing requests ===
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (
    stateChangingMethods.includes(method) &&
    !pathname.startsWith("/api/auth/")
  ) {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  // === SECURITY HEADERS ===
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // CSP header
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://discord.com https://discordapp.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
