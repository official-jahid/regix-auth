import { hashPassword, logAudit } from "@/lib/auth";
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

    const { action, ...params } = await request.json();

    switch (action) {
      case "find": {
        const { userId, email, username } = params;
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(userId ? [{ id: userId }] : []),
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true,
            isActive: true,
            isBlacklisted: true,
            createdAt: true,
            discordAccount: { select: { discordId: true, username: true } },
            premiumKeys: {
              where: { isRedeemed: true },
              select: { key: true, isLifetime: true, expiresAt: true },
            },
          },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({ success: true, user });
      }

      case "create": {
        const { email, username, password, role = "USER" } = params;
        if (!email || !username || !password) {
          return NextResponse.json(
            { error: "Email, username, and password required" },
            { status: 400 },
          );
        }

        const existing = await prisma.user.findFirst({
          where: { OR: [{ email }, { username }] },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Email or username already taken" },
            { status: 409 },
          );
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
          data: {
            email,
            username,
            passwordHash,
            displayName: username,
            role:
              (
                [
                  "USER",
                  "ADMIN",
                  "MODERATOR",
                  "DISTRIBUTOR",
                  "RESELLER",
                  "OWNER",
                ].includes(role)
              ) ?
                role
              : "USER",
            isActive: true,
          },
        });

        await logAudit("USER_CREATED_BOT", user.id, JSON.stringify({ role }));

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          },
        });
      }

      case "blacklist": {
        const { userId, reason } = params;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        await prisma.user.update({
          where: { id: userId },
          data: { isBlacklisted: true },
        });
        await prisma.blacklistEntry.create({
          data: {
            userId,
            reason: reason || "Blacklisted via bot",
            blacklistedBy: "bot",
          },
        });

        await logAudit(
          "USER_BLACKLISTED_BOT",
          userId,
          JSON.stringify({ reason }),
        );

        return NextResponse.json({
          success: true,
          message: `User ${user.username} has been blacklisted`,
        });
      }

      case "unblacklist": {
        const { userId: ubId } = params;
        const ubUser = await prisma.user.findUnique({ where: { id: ubId } });
        if (!ubUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        await prisma.user.update({
          where: { id: ubId },
          data: { isBlacklisted: false },
        });

        await logAudit("USER_UNBLACKLISTED_BOT", ubId);

        return NextResponse.json({
          success: true,
          message: `User ${ubUser.username} has been unblacklisted`,
        });
      }

      case "reset": {
        const { userId: rId } = params;
        const rUser = await prisma.user.findUnique({ where: { id: rId } });
        if (!rUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        // Destroy all sessions
        await prisma.session.deleteMany({ where: { userId: rId } });

        await logAudit("USER_SESSIONS_RESET_BOT", rId);

        return NextResponse.json({
          success: true,
          message: `All sessions for ${rUser.username} have been terminated`,
        });
      }

      case "resetPassword": {
        const { userId: rpId, newPassword } = params;
        if (!rpId || !newPassword) {
          return NextResponse.json(
            { error: "userId and newPassword are required" },
            { status: 400 },
          );
        }

        if (newPassword.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters" },
            { status: 400 },
          );
        }

        const rpUser = await prisma.user.findUnique({ where: { id: rpId } });
        if (!rpUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: rpId },
          data: { passwordHash },
        });

        // Destroy all sessions for security
        await prisma.session.deleteMany({ where: { userId: rpId } });

        await logAudit("USER_PASSWORD_RESET_BOT", rpId);

        return NextResponse.json({
          success: true,
          message: `Password for ${rpUser.username} has been reset. All sessions terminated.`,
        });
      }

      case "resetUsername": {
        const { userId: ruId, newUsername } = params;
        if (!ruId || !newUsername) {
          return NextResponse.json(
            { error: "userId and newUsername are required" },
            { status: 400 },
          );
        }

        if (newUsername.length < 3) {
          return NextResponse.json(
            { error: "Username must be at least 3 characters" },
            { status: 400 },
          );
        }

        const ruUser = await prisma.user.findUnique({ where: { id: ruId } });
        if (!ruUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        // Check if new username is already taken
        const existing = await prisma.user.findUnique({
          where: { username: newUsername },
        });
        if (existing && existing.id !== ruId) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 },
          );
        }

        await prisma.user.update({
          where: { id: ruId },
          data: { username: newUsername },
        });

        await logAudit(
          "USER_USERNAME_RESET_BOT",
          ruId,
          JSON.stringify({ oldUsername: ruUser.username, newUsername }),
        );

        return NextResponse.json({
          success: true,
          message: `Username changed from ${ruUser.username} to ${newUsername}`,
        });
      }

      case "list": {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
            isBlacklisted: true,
            createdAt: true,
            _count: { select: { sessions: true, devices: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        return NextResponse.json({ success: true, users, count: users.length });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bot users manage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
