import { detectIpFromRequest, getCurrentUser, logAudit } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = detectIpFromRequest(request);
    const { displayName, avatarUrl, username } = await request.json();

    const updateData: Record<string, string> = {};

    if (displayName !== undefined && displayName.trim().length > 0) {
      updateData.displayName = displayName.trim();
    }

    if (avatarUrl !== undefined && avatarUrl.trim().length > 0) {
      updateData.avatarUrl = avatarUrl.trim();
    }

    if (username !== undefined && username.trim().length >= 3) {
      // Check if username is already taken
      if (username.trim() !== user.username) {
        const existing = await prisma.user.findUnique({
          where: { username: username.trim() },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Username already taken" },
            { status: 409 },
          );
        }
        updateData.username = username.trim();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await logAudit(
      "USER_PROFILE_UPDATED",
      user.id,
      JSON.stringify(updateData),
      ip,
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
