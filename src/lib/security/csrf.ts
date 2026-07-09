import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ============================================================
// CSRF PROTECTION
// ============================================================
// Uses double-submit cookie pattern with a cryptographically
// random token. The token is set as a non-httpOnly cookie
// (readable by JS) and must be sent in a custom header.

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;
const TOKEN_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += TOKEN_CHARS[array[i] % TOKEN_CHARS.length];
  }
  return token;
}

export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });
  return token;
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

export function validateCsrfToken(
  request: NextRequest,
  cookieToken: string | null,
): boolean {
  if (!cookieToken) return false;

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) return false;

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return result === 0;
}

// Safe methods that don't need CSRF protection
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfMiddleware(
  request: NextRequest,
  cookieToken: string | null,
): NextResponse | null {
  // Skip CSRF for safe methods
  if (SAFE_METHODS.has(request.method)) return null;

  if (!validateCsrfToken(request, cookieToken)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }

  return null;
}
