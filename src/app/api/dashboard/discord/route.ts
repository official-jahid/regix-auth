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

    const discord = await prisma.discordAccount.findUnique({
      where: { userId: session.user.id },
      select: { discordId: true, username: true, discriminator: true, avatarUrl: true },
    });

    return NextResponse.json({ discord });
  } catch (error) {
    console.error("Discord fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discordId } = await request.json();

    if (!discordId) {
      return NextResponse.json({ error: "Discord ID is required" }, { status: 400 });
    }

    const existing = await prisma.discordAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      await prisma.discordAccount.update({
        where: { userId: session.user.id },
        data: { discordId },
      });
    } else {
      await prisma.discordAccount.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          discordId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}