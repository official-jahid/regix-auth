const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const SECRET_KEY = process.env.SECRET_KEY || "";

async function botFetch(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function generateKeys(
  count: number,
  duration: number,
  isLifetime: boolean,
) {
  return botFetch("/api/bot/keys/generate", { count, duration, isLifetime });
}

export async function manageUser(action: string, params: Record<string, any>) {
  return botFetch("/api/bot/users/manage", { action, ...params });
}

export async function getKeyInfo(key: string) {
  return botFetch("/api/bot/keys/info", { key });
}

export async function getLicenseInfo(key: string) {
  return botFetch("/api/bot/keys/info", { key });
}

export async function getUserInfo(
  identifier: string,
  type: "userId" | "email" | "username" = "username",
) {
  return botFetch("/api/bot/users/manage", {
    action: "find",
    [type]: identifier,
  });
}

export async function getStats() {
  try {
    const res = await fetch(`${API_BASE}/api/bot/users/manage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({ action: "list" }),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 500, data: { error: "Network error" } };
  }
}

export async function getWhitelistStatus(userId: string) {
  return botFetch("/api/bot/whitelist/check", { userId });
}

export async function addToWhitelist(userId: string) {
  return botFetch("/api/bot/whitelist/modify", { action: "add", userId });
}

export async function removeFromWhitelist(userId: string) {
  return botFetch("/api/bot/whitelist/modify", { action: "remove", userId });
}
