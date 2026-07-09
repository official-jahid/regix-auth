import {
  createSession,
  detectIpFromRequest,
  hashPassword,
  logAudit,
  logLogin,
  setAuthCookie,
} from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { setCsrfCookie } from "@/lib/security/csrf";
import {
  applySecurity,
  checkLoginBruteForce,
  recordLoginFailure,
  recordLoginSuccess,
  securityHeaders,
} from "@/lib/security/securityMiddleware";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Apply security: strict rate limiting + CSRF
    const security = await applySecurity(request, "strict");
    if (!security.passed) {
      return security.response;
    }

    const { email, username, password, displayName, token } =
      await request.json();
    const ip = detectIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 },
      );
    }

    // License key is required
    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "A valid license key is required to register" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter" },
        { status: 400 },
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one lowercase letter" },
        { status: 400 },
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number" },
        { status: 400 },
      );
    }

    // Check brute force by IP
    const ipBlocked = checkLoginBruteForce(`ip:${ip}`);
    if (ipBlocked) return ipBlocked;

    // Validate the license key first
    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: token.trim() },
    });

    if (!premiumKey) {
      return NextResponse.json(
        { error: "Invalid license key" },
        { status: 400 },
      );
    }

    if (premiumKey.isRedeemed) {
      return NextResponse.json(
        { error: "This license key has already been redeemed" },
        { status: 400 },
      );
    }

    if (!premiumKey.isActive) {
      return NextResponse.json(
        { error: "This license key is no longer active" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      recordLoginFailure(ip, email);
      return NextResponse.json(
        {
          error:
            existing.email === email ?
              "Email already in use"
            : "Username already taken",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        role: "USER",
        isActive: true,
      },
    });

    // Clear brute force on successful registration
    recordLoginSuccess(ip, user.id);

    // Redeem the license key immediately
    const expiresAt =
      premiumKey.isLifetime ? null : (
        new Date(Date.now() + premiumKey.duration * 86400000)
      );

    await prisma.premiumKey.update({
      where: { id: premiumKey.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        userId: user.id,
        expiresAt,
        isIpLocked: true,
        lockedIp: ip,
      },
    });

    await logAudit(
      "KEY_REDEEMED_ON_REGISTER",
      user.id,
      JSON.stringify({ key: token.trim() }),
      ip,
    );

    const sessionToken = await createSession(user.id, ip, userAgent);
    await setAuthCookie(sessionToken);
    await logLogin(user.id, ip, "email", true);
    await logAudit(
      "USER_REGISTERED",
      user.id,
      JSON.stringify({ method: "email" }),
      ip,
    );

    // Set CSRF cookie
    await setCsrfCookie();

    return securityHeaders(
      NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
        },
      }),
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
