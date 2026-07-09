import { NextRequest, NextResponse } from "next/server";

// ============================================================
// IN-MEMORY RATE LIMITER
// ============================================================
// For production, replace with Redis-based implementation.
// This provides per-IP rate limiting with sliding window.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests within window
  message?: string; // Custom error message
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: "Too many requests. Please try again later.",
};

// Strict rate limits for sensitive endpoints
export const STRICT_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 5, // 5 per minute (login, register, OTP, etc.)
  message: "Too many attempts. Please try again in a minute.",
};

// Moderate rate limits for API endpoints
export const MODERATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 20, // 20 per minute
  message: "Too many requests. Please slow down.",
};

// Bot API endpoint limit (higher for internal use)
export const BOT_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60, // 60 per minute
  message: "Bot rate limit exceeded.",
};

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { limited: boolean; headers: Record<string, string> } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "127.0.0.1";

  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const entry = store.get(key);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Reset": "0",
    "X-RateLimit-Remaining": "0",
  };

  if (!entry || entry.resetAt <= now) {
    // First request or window expired - create new window
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    headers["X-RateLimit-Reset"] = String(now + config.windowMs);
    headers["X-RateLimit-Remaining"] = String(config.maxRequests - 1);
    return { limited: false, headers };
  }

  headers["X-RateLimit-Reset"] = String(entry.resetAt);
  const remaining = config.maxRequests - entry.count;

  if (entry.count >= config.maxRequests) {
    // Rate limited
    headers["Retry-After"] = String(Math.ceil((entry.resetAt - now) / 1000));
    headers["X-RateLimit-Remaining"] = "0";
    return { limited: true, headers };
  }

  // Increment count
  entry.count += 1;
  headers["X-RateLimit-Remaining"] = String(remaining - 1);
  return { limited: false, headers };
}

export function rateLimitMiddleware(
  request: NextRequest,
  config?: RateLimitConfig,
): NextResponse | null {
  const result = rateLimit(request, config);
  if (result.limited) {
    const response = NextResponse.json(
      {
        error: config?.message || DEFAULT_CONFIG.message,
        retryAfter: result.headers["Retry-After"],
      },
      {
        status: 429,
        headers: result.headers,
      },
    );
    return response;
  }
  return null;
}
