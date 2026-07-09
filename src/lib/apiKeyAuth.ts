import crypto from "crypto";

/**
 * Verifies an API key by checking against stored hashed keys.
 * This is used by external applications to authenticate via API keys.
 */

export interface ApiKeyInfo {
  valid: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}

const API_KEY_CACHE = new Map<
  string,
  { userId: string; permissions: string[] }
>();

export function verifyApiKeyHeader(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  return match[1];
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function isValidKeyFormat(key: string): boolean {
  return /^rgx_[a-f0-9]{48}$/.test(key);
}
