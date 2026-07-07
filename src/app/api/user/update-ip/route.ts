import { getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ip } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 },
      );
    }

    // Update all active devices with new IP
    await prisma.device.updateMany({
      where: { userId: user.id, isActive: true },
      data: { ip },
    });

    // Update premium key IP lock if exists
    await prisma.premiumKey.updateMany({
      where: { userId: user.id, isRedeemed: true },
      data: { lockedIp: ip },
    });

    await logAudit("USER_UPDATED_IP", user.id, JSON.stringify({ ip }));

    return NextResponse.json({
      success: true,
      message: "IP updated successfully",
    });
  } catch (error) {
    console.error("Update IP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
