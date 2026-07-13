import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const device = await prisma.device.findFirst({
      where: { userId: session.user.id },
      select: { id: true, hwid: true, sid: true, ipAddress: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ device });
  } catch (error) {
    console.error("Device fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sid, ipAddress } = await request.json();

    if (!sid && !ipAddress) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const existing = await prisma.device.findFirst({
      where: { userId: session.user.id },
    });

    if (existing) {
      await prisma.device.update({
        where: { id: existing.id },
        data: {
          ...(sid ? { sid } : {}),
          ...(ipAddress ? { ipAddress } : {}),
        },
      });
    } else {
      await prisma.device.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          sid: sid || null,
          ipAddress: ipAddress || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Device update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}