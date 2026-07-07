import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "7d";
const SESSION_EXPIRY_DAYS = 7;

// ============================================================
// PASSWORD HASHING
// ============================================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================
// JWT TOKEN MANAGEMENT
// ============================================================
export function generateToken(payload: {
  userId: string;
  role: string;
}): string {
  return jwt.sign(payload, serverEnv.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(
  token: string,
): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, serverEnv.JWT_SECRET) as {
      userId: string;
      role: string;
    };
  } catch {
    return null;
  }
}

// ============================================================
// SESSION MANAGEMENT (Server-side)
// ============================================================
export async function createSession(
  userId: string,
  ip?: string,
  userAgent?: string,
) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      ip,
      userAgent,
      expiresAt,
    },
  });

  return token;
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session;
}

export async function destroySession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

// ============================================================
// COOKIE HELPERS
// ============================================================
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value ?? null;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

// ============================================================
// GET CURRENT USER
// ============================================================
export async function getCurrentUser() {
  const token = await getAuthTokenFromCookies();
  if (!token) return null;

  const session = await validateSession(token);
  if (!session) return null;

  return session.user;
}

// ============================================================
// GENERATE PREMIUM KEY
// ============================================================
export function generatePremiumKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments: string[] = [];

  for (let s = 0; s < 4; s++) {
    let segment = "";
    for (let i = 0; i < 5; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return segments.join("-");
}

// ============================================================
// DETECT IP FROM REQUEST
// ============================================================
export function detectIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "127.0.0.1";
}

// ============================================================
// LOGIN HISTORY
// ============================================================
export async function logLogin(
  userId: string,
  ip: string | undefined,
  method: string,
  success: boolean,
  failReason?: string,
) {
  await prisma.loginHistory.create({
    data: {
      userId,
      ip,
      method,
      success,
      failReason,
    },
  });
}

// ============================================================
// AUDIT LOG
// ============================================================
export async function logAudit(
  action: string,
  userId?: string,
  details?: string,
  ip?: string,
) {
  await prisma.auditLog.create({
    data: { action, userId, details, ip },
  });
}
