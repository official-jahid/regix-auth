import { logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === serverEnv.SECRET_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, userId } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: "action and userId are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "add":
        await prisma.user.update({
          where: { id: userId },
          data: { isBlacklisted: false },
        });
        await logAudit("USER_WHITELISTED_BOT", userId);
        return NextResponse.json({
          success: true,
          message: `${user.username} added to whitelist`,
        });

      case "remove":
        await prisma.user.update({
          where: { id: userId },
          data: { isBlacklisted: true },
        });
        await logAudit("USER_UNWHITELISTED_BOT", userId);
        return NextResponse.json({
          success: true,
          message: `${user.username} removed from whitelist`,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bot whitelist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
