import {
  createSession,
  detectIpFromRequest,
  logAudit,
  logLogin,
  setAuthCookie,
  verifyPassword,
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

    const { email, username, password } = await request.json();
    const ip = detectIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 },
      );
    }

    // Check brute force by IP and identifier
    const ipBlocked = checkLoginBruteForce(`ip:${ip}`);
    if (ipBlocked) return ipBlocked;

    const identifier = email || username || "unknown";
    const userBlocked = checkLoginBruteForce(`user:${identifier}`);
    if (userBlocked) return userBlocked;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : []),
        ],
      },
    });

    if (!user) {
      recordLoginFailure(ip, identifier);
      await logLogin("unknown", ip, "email", false, "User not found");
      return securityHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
      );
    }

    if (user.isBlacklisted) {
      recordLoginFailure(ip, user.id);
      await logLogin(user.id, ip, "email", false, "Account blacklisted");
      return securityHeaders(
        NextResponse.json(
          { error: "Your account has been blacklisted" },
          { status: 403 },
        ),
      );
    }

    if (!user.isActive) {
      recordLoginFailure(ip, user.id);
      await logLogin(user.id, ip, "email", false, "Account inactive");
      return securityHeaders(
        NextResponse.json(
          { error: "Your account is inactive" },
          { status: 403 },
        ),
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordLoginFailure(ip, user.id);
      await logLogin(user.id, ip, "email", false, "Invalid password");
      return securityHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
      );
    }

    // Successful login - clear brute force counters
    recordLoginSuccess(ip, user.id);

    const sessionToken = await createSession(user.id, ip, userAgent);
    await setAuthCookie(sessionToken);
    await logLogin(user.id, ip, "email", true);
    await logAudit(
      "USER_LOGIN",
      user.id,
      JSON.stringify({ method: "email" }),
      ip,
    );

    // Set CSRF cookie for subsequent requests
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
