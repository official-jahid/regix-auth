import { hashPassword, verifyOtp } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    if (newPassword.length > 32) {
      return NextResponse.json(
        { error: "Password must be less than 32 characters" },
        { status: 400 },
      );
    }

    // Verify the OTP first (this also marks it as used)
    const result = await verifyOtp(email, code, "PASSWORD_RESET");

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update the user's password
    await prisma.user.update({
      where: { id: result.userId },
      data: { passwordHash },
    });

    // Destroy all existing sessions for this user (force re-login)
    await prisma.session.deleteMany({
      where: { userId: result.userId },
    });

    return NextResponse.json({
      message:
        "Password has been reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
