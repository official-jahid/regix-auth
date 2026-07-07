import { detectIp } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, username, licenseKey, hwid, sid } = await request.json();
    const ip = detectIp(request.headers);

    if ((!email && !username) || !hwid) {
      return NextResponse.json(
        { error: "Username/email and HWID are required" },
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: "User is blacklisted" },
        { status: 403 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    // Check license key if provided
    if (licenseKey) {
      const key = await prisma.premiumKey.findUnique({
        where: { key: licenseKey },
      });

      if (!key || !key.isRedeemed || key.userId !== user.id) {
        return NextResponse.json(
          { error: "Invalid license key" },
          { status: 401 },
        );
      }

      if (!key.isLifetime && key.expiresAt && key.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "License key has expired" },
          { status: 401 },
        );
      }

      // Check IP lock
      if (key.isIpLocked && key.lockedIp && key.lockedIp !== ip) {
        return NextResponse.json(
          { error: "License key is locked to a different IP" },
          { status: 401 },
        );
      }
    }

    // Check or register device
    const existingDevice = await prisma.device.findFirst({
      where: { userId: user.id, hwid },
    });

    if (existingDevice) {
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          sid: sid ?? existingDevice.sid,
          ip,
          lastSeenAt: new Date(),
          isActive: true,
        },
      });
    } else {
      await prisma.device.create({
        data: {
          userId: user.id,
          hwid,
          sid,
          ip,
          isActive: true,
          sidUpdatedAt: new Date(),
        },
      });
    }

    // Log login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip,
        method: "hwid",
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Device verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
