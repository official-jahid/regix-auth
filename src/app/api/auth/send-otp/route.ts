import { createOtp } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { sendOtpEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 },
      );
    }

    if (!["EMAIL_VERIFICATION", "PASSWORD_RESET"].includes(type)) {
      return NextResponse.json({ error: "Invalid OTP type" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists for security
      return NextResponse.json({
        message: "If the email exists, an OTP has been sent.",
      });
    }

    // Create OTP
    const otp = await createOtp(user.id, email, type);

    // Send email
    const result = await sendOtpEmail(email, otp, type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send OTP email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "If the email exists, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
