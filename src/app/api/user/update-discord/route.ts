import { getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discordId } = await request.json();

    if (!discordId) {
      return NextResponse.json(
        { error: "Discord ID is required" },
        { status: 400 },
      );
    }

    // Check if Discord ID is already linked to another account
    const existingLink = await prisma.discordAccount.findUnique({
      where: { discordId },
    });

    if (existingLink && existingLink.userId !== user.id) {
      return NextResponse.json(
        { error: "Discord account already linked to another user" },
        { status: 409 },
      );
    }

    // Upsert Discord account link
    await prisma.discordAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        discordId,
      },
      update: {
        discordId,
      },
    });

    await logAudit(
      "USER_UPDATED_DISCORD",
      user.id,
      JSON.stringify({ discordId }),
    );

    return NextResponse.json({
      success: true,
      message: "Discord ID updated successfully",
    });
  } catch (error) {
    console.error("Update discord error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
