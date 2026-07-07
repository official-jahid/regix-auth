import { detectIp, getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hwid, sid } = await request.json();
    const ip = detectIp(request.headers);

    if (!hwid) {
      return NextResponse.json({ error: "HWID is required" }, { status: 400 });
    }

    const existingDevice = await prisma.device.findFirst({
      where: { userId: user.id, hwid },
    });

    if (existingDevice) {
      const updated = await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          sid: sid ?? existingDevice.sid,
          ip,
          lastSeenAt: new Date(),
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        device: updated,
        message: "Device updated",
      });
    }

    const device = await prisma.device.create({
      data: {
        userId: user.id,
        hwid,
        sid,
        ip,
        isActive: true,
        sidUpdatedAt: new Date(),
      },
    });

    await logAudit(
      "DEVICE_REGISTERED",
      user.id,
      JSON.stringify({ hwid, sid }),
      ip,
    );

    return NextResponse.json({
      success: true,
      device,
      message: "Device registered successfully",
    });
  } catch (error) {
    console.error("Device register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
