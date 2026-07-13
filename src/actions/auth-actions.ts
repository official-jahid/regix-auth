import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { sendDiscordDM } from "@/lib/discord-bot";
import { serverEnv } from "@/lib/env/serverEnv";

function generateSecureOtp(): string {
  const array = new Uint32Array(1);
  let num: number;
  do {
    crypto.getRandomValues(array);
    num = array[0] % 1000000;
  } while (num < 100000);
  return num.toString().padStart(6, "0");
}

export async function sendDiscordOtpAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const discordUserId = formData.get("discordUserId") as string;

  try {
    if (!discordUserId || !/^\d{17,20}$/.test(discordUserId)) {
      return { success: false, error: "Invalid Discord User ID format" };
    }

    const otp = generateSecureOtp();

    await prisma.otpCode.upsert({
      where: { discordUserId },
      update: {
        otp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
      create: {
        id: crypto.randomUUID(),
        discordUserId,
        otp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });

    const message = `Your verification code for Regix Auth is: **${otp}**\n\nThis code expires in 2 minutes.`;
    const sent = await sendDiscordDM(discordUserId, message);

    if (!sent) {
      return {
        success: false,
        error:
          "Unable to send Discord DM. Please check your Discord User ID and ensure DMs from server members are open.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: "Failed to send OTP" };
  }
}

export async function registerUserAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string; redirect?: string }> {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const discordUserId = formData.get("discordUserId") as string;
  const accessKey = formData.get("accessKey") as string;
  const password = formData.get("password") as string;
  const otp = formData.get("otp") as string;

  try {
    if (!discordUserId || !/^\d{17,20}$/.test(discordUserId)) {
      return { success: false, error: "Invalid Discord User ID format" };
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return { success: false, error: "Invalid OTP format" };
    }

    const otpRecord = await prisma.otpCode.findUnique({
      where: { discordUserId },
    });

    if (!otpRecord) {
      return {
        success: false,
        error: "Invalid or expired OTP. Please request a new code.",
      };
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.otpCode.delete({ where: { discordUserId } });
      return {
        success: false,
        error: "Invalid or expired OTP. Please request a new code.",
      };
    }

    if (otpRecord.otp !== otp) {
      return {
        success: false,
        error: "Invalid or expired OTP. Please request a new code.",
      };
    }

    const trimmedKey = accessKey.trim().toUpperCase();
    const premiumKey = await prisma.premiumKey.findUnique({
      where: { key: trimmedKey },
    });

    if (!premiumKey) {
      return { success: false, error: "Invalid access key" };
    }

    if (premiumKey.status === "blocked" || !premiumKey.isActive) {
      return { success: false, error: "Access key has been blocked" };
    }

    if (premiumKey.status === "used" || premiumKey.userId) {
      return { success: false, error: "Access key is already in use" };
    }

    if (premiumKey.expiresAt && premiumKey.expiresAt < new Date()) {
      return { success: false, error: "Access key has expired" };
    }

    const existingUser = await prisma.user.findFirst({
      where: { name: username },
    });
    if (existingUser) {
      return { success: false, error: "Username already taken" };
    }

    const existingDiscord = await prisma.discordAccount.findUnique({
      where: { discordId: discordUserId },
    });
    if (existingDiscord) {
      return { success: false, error: "Discord account already registered" };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one lowercase letter",
      };
    }
    if (!/\d/.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one number",
      };
    }

    const email = `${username}@discord.local`;

    const result = await auth.api.signUpEmail({
      body: {
        name: username,
        email,
        password,
      },
    });

    if (!result || !result.user) {
      return {
        success: false,
        error: (result as any)?.error || "Failed to create account",
      };
    }

    const createdUser = result.user;

    // Check if the redeemed key is the admin lifetime key → grant owner role
    const isAdminLifetimeKey = trimmedKey === serverEnv.ADMIN_LIFETIME_KEY;

    await prisma.$transaction(async (tx) => {
      await tx.discordAccount.create({
        data: {
          id: crypto.randomUUID(),
          userId: createdUser.id,
          discordId: discordUserId,
        },
      });

      const expiresAt =
        premiumKey.isLifetime ? null : (
          new Date(Date.now() + premiumKey.duration * 24 * 60 * 60 * 1000)
        );

      await tx.premiumKey.update({
        where: { id: premiumKey.id },
        data: {
          userId: createdUser.id,
          status: "used",
          redeemedAt: new Date(),
          ...(expiresAt ? { expiresAt } : {}),
        },
      });

      // Grant owner role if this is the admin lifetime key
      if (isAdminLifetimeKey) {
        await tx.user.update({
          where: { id: createdUser.id },
          data: { role: "owner" },
        });
      }
    });

    await prisma.otpCode.delete({ where: { discordUserId } });

    return { success: true, redirect: "/dashboard" };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Internal server error" };
  }
}
