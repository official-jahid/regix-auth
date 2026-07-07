import {
  clearAuthCookie,
  destroySession,
  getAuthTokenFromCookies,
} from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const token = await getAuthTokenFromCookies();
    if (token) {
      await destroySession(token);
    }
    await clearAuthCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
