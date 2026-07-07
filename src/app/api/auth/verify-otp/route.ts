import { verifyOtp } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();

    if (!email || !code || !type) {
      return NextResponse.json(
        { error: "Email, code, and type are required" },
        { status: 400 },
      );
    }

    if (!["EMAIL_VERIFICATION", "PASSWORD_RESET"].includes(type)) {
      return NextResponse.json({ error: "Invalid OTP type" }, { status: 400 });
    }

    const result = await verifyOtp(email, code, type);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "OTP verified successfully",
      userId: result.userId,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
