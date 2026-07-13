import { serverEnv } from "../../lib/env/serverEnv";

const BASE_URL = serverEnv.BETTER_AUTH_URL || "http://localhost:3000";
const SECRET_KEY = serverEnv.SECRET_KEY;

async function apiRequest<T>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ========== KEYS ==========
export interface GeneratedKey {
  id: string;
  key: string;
  duration: number;
  isLifetime: boolean;
  isActive: boolean;
}

export async function generateKeys(
  count: number,
  duration: number,
  lifetime: boolean,
): Promise<{ keys: GeneratedKey[]; count: number }> {
  return apiRequest("/api/admin/keys", "POST", { count, duration, lifetime });
}

export async function getKeyInfo(key: string): Promise<{
  id: string;
  key: string;
  isActive: boolean;
  isLifetime: boolean;
  userId: string | null;
  user?: { name: string; email: string } | null;
  expiresAt: string | null;
  redeemedAt: string | null;
}> {
  const data = await apiRequest<{ key: any }>("/api/bot/keys/info", "POST", {
    key,
  });
  return data as any;
}

// ========== USERS ==========
export async function findUser(
  query: string,
): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
  isBlacklisted: boolean;
}> {
  return apiRequest("/api/bot/users/manage", "POST", { action: "find", query });
}

export async function createUser(
  username: string,
  password: string,
  role?: string,
): Promise<{ id: string; name: string }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "create",
    username,
    password,
    role: role || "user",
  });
}

export async function blacklistUser(
  userId: string,
  reason: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "blacklist",
    userId,
    reason,
  });
}

export async function unblacklistUser(
  userId: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "unblacklist",
    userId,
  });
}

export async function resetUserSessions(
  userId: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "reset",
    userId,
  });
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "resetPassword",
    userId,
    newPassword,
  });
}

export async function resetUserUsername(
  userId: string,
  newUsername: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/users/manage", "POST", {
    action: "resetUsername",
    userId,
    newUsername,
  });
}

export async function listUsers(): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isBlacklisted: boolean;
  }>
> {
  return apiRequest("/api/bot/users/manage", "POST", { action: "list" });
}

// ========== WHITELIST ==========
export async function addWhitelist(
  userId: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/whitelist/modify", "POST", {
    action: "add",
    userId,
  });
}

export async function removeWhitelist(
  userId: string,
): Promise<{ success: boolean }> {
  return apiRequest("/api/bot/whitelist/modify", "POST", {
    action: "remove",
    userId,
  });
}

export async function checkWhitelist(
  userId: string,
): Promise<{ whitelisted: boolean }> {
  return apiRequest("/api/bot/whitelist/check", "POST", { userId });
}
