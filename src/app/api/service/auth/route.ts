import { logLogin, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { action, secretKey, username, password, licenseKey, hwid, sid } =
      await request.json();

    // Validate the service API secret key
    if (secretKey !== serverEnv.SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    switch (action) {
      case "verify": {
        // Verify a user's credentials and license
        if (!username || !password) {
          return NextResponse.json(
            { error: "username and password are required for verify" },
            { status: 400 },
          );
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          return NextResponse.json(
            { valid: false, error: "Invalid credentials" },
            { status: 401 },
          );
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await logLogin(user.id, ip, "api", false, "Invalid password");
          return NextResponse.json(
            { valid: false, error: "Invalid credentials" },
            { status: 401 },
          );
        }

        if (user.isBlacklisted) {
          return NextResponse.json(
            { valid: false, error: "Account has been blacklisted" },
            { status: 403 },
          );
        }

        // Check license if provided
        let licenseValid = false;
        let expiresAt: string | null = null;
        let isLifetime = false;

        if (licenseKey) {
          const key = await prisma.premiumKey.findUnique({
            where: { key: licenseKey },
          });

          if (key && key.isActive) {
            if (key.isLifetime) {
              licenseValid = true;
              isLifetime = true;
            } else if (key.expiresAt && key.expiresAt > new Date()) {
              licenseValid = true;
              expiresAt = key.expiresAt.toISOString();
            }

            if (!key.isRedeemed) {
              // Auto-redeem for this user
              await prisma.premiumKey.update({
                where: { id: key.id },
                data: {
                  isRedeemed: true,
                  redeemedAt: new Date(),
                  userId: user.id,
                  expiresAt:
                    key.isLifetime ? null : (
                      new Date(Date.now() + key.duration * 86400000)
                    ),
                },
              });
            }
          }
        }

        await logLogin(user.id, ip, "api", true);

        return NextResponse.json({
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
          },
          license: {
            valid: licenseValid,
            isLifetime,
            expiresAt,
          },
          serverTime: new Date().toISOString(),
        });
      }

      case "registerDevice": {
        // Register/verify a device by HWID
        if (!username || !password || !hwid) {
          return NextResponse.json(
            { error: "username, password, and hwid are required" },
            { status: 400 },
          );
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          return NextResponse.json(
            { valid: false, error: "Invalid credentials" },
            { status: 401 },
          );
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return NextResponse.json(
            { valid: false, error: "Invalid credentials" },
            { status: 401 },
          );
        }

        // Find or create device
        let device = await prisma.device.findUnique({
          where: { userId_hwid: { userId: user.id, hwid } },
        });

        if (device) {
          device = await prisma.device.update({
            where: { id: device.id },
            data: { ip, sid, lastSeenAt: new Date() },
          });
        } else {
          device = await prisma.device.create({
            data: { userId: user.id, hwid, sid, ip },
          });
        }

        return NextResponse.json({
          valid: true,
          device: {
            id: device.id,
            hwid: device.hwid,
            isActive: device.isActive,
            lastSeenAt: device.lastSeenAt.toISOString(),
          },
          serverTime: new Date().toISOString(),
        });
      }

      case "checkLicense": {
        // Check license status
        if (!licenseKey) {
          return NextResponse.json(
            { error: "licenseKey is required" },
            { status: 400 },
          );
        }

        const key = await prisma.premiumKey.findUnique({
          where: { key: licenseKey },
          include: { user: { select: { username: true } } },
        });

        if (!key) {
          return NextResponse.json(
            { valid: false, error: "License key not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({
          valid: key.isActive,
          isLifetime: key.isLifetime,
          isRedeemed: key.isRedeemed,
          isActive: key.isActive,
          expiresAt: key.expiresAt?.toISOString() || null,
          redeemedAt: key.redeemedAt?.toISOString() || null,
          redeemedBy: key.user?.username || null,
          isIpLocked: key.isIpLocked,
          lockedIp: key.lockedIp,
          serverTime: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Service auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
