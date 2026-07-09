import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { getPremiumStatus } from "@/lib/premium";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const discordAccount = await prisma.discordAccount.findUnique({
      where: { userId: user.id },
    });

    const premiumKey = await prisma.premiumKey.findFirst({
      where: { userId: user.id, isRedeemed: true },
      orderBy: { createdAt: "desc" },
    });

    const premiumStatus = getPremiumStatus(
      premiumKey ?
        {
          isRedeemed: premiumKey.isRedeemed,
          isActive: premiumKey.isActive,
          expiresAt: premiumKey.expiresAt,
          isLifetime: premiumKey.isLifetime,
        }
      : null,
    );

    const device = await prisma.device.findFirst({
      where: { userId: user.id, isActive: true },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        isBlacklisted: user.isBlacklisted,
        createdAt: user.createdAt,
      },
      discord:
        discordAccount ?
          {
            discordId: discordAccount.discordId,
            username: discordAccount.username,
            avatarUrl: discordAccount.avatarUrl,
          }
        : null,
      premium:
        premiumKey ?
          {
            key: premiumKey.key,
            isLifetime: premiumKey.isLifetime,
            expiresAt: premiumKey.expiresAt,
            isIpLocked: premiumKey.isIpLocked,
            lockedIp: premiumKey.lockedIp,
            isValid: premiumStatus.isValid,
            reason: premiumStatus.reason,
          }
        : null,
      device:
        device ?
          {
            hwid: device.hwid,
            sid: device.sid,
            ip: device.ip,
            sidUpdatedAt: device.sidUpdatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
