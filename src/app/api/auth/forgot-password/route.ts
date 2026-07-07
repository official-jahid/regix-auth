import { createOtp } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { sendOtpEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset OTP has been sent.",
      });
    }

    // Create password reset OTP
    const otp = await createOtp(user.id, email, "PASSWORD_RESET");

    // Send email
    const result = await sendOtpEmail(email, otp, "PASSWORD_RESET");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send OTP email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
