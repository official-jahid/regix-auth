import {
  createSession,
  detectIpFromRequest,
  logAudit,
  logLogin,
  setAuthCookie,
  verifyPassword,
} from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, username, password } = await request.json();
    const ip = detectIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (user.isBlacklisted) {
      await logLogin(user.id, ip, "email", false, "Account blacklisted");
      return NextResponse.json(
        { error: "Your account has been blacklisted" },
        { status: 403 },
      );
    }

    if (!user.isActive) {
      await logLogin(user.id, ip, "email", false, "Account inactive");
      return NextResponse.json(
        { error: "Your account is inactive" },
        { status: 403 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await logLogin(user.id, ip, "email", false, "Invalid password");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const sessionToken = await createSession(user.id, ip, userAgent);
    await setAuthCookie(sessionToken);
    await logLogin(user.id, ip, "email", true);
    await logAudit(
      "USER_LOGIN",
      user.id,
      JSON.stringify({ method: "email" }),
      ip,
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
