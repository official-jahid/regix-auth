import {
  createSession,
  detectIp,
  hashPassword,
  logAudit,
  logLogin,
  setAuthCookie,
} from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, displayName } = await request.json();
    const ip = detectIp(request.headers);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
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

    const sessionToken = await createSession(user.id, ip, userAgent);
    await setAuthCookie(sessionToken);
    await logLogin(user.id, ip, "email", true);
    await logAudit(
      "USER_REGISTERED",
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
