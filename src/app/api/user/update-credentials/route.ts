import {
  getCurrentUser,
  hashPassword,
  logAudit,
  verifyPassword,
} from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword, displayName } = await request.json();

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 },
        );
      }

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 },
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, displayName: displayName ?? user.displayName },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { displayName: displayName ?? user.displayName },
      });
    }

    await logAudit("USER_UPDATED_CREDENTIALS", user.id);

    return NextResponse.json({ success: true, message: "Credentials updated" });
  } catch (error) {
    console.error("Update credentials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
