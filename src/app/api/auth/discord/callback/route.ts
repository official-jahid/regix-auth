import {
  createSession,
  detectIp,
  hashPassword,
  logAudit,
  logLogin,
  setAuthCookie,
} from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const ip = detectIp(request.headers);

    if (!code) {
      return NextResponse.redirect(new URL("/auth?error=no_code", request.url));
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: serverEnv.DISCORD_CLIENT_ID ?? "",
        client_secret: serverEnv.DISCORD_CLIENT_SECRET ?? "",
        grant_type: "authorization_code",
        code,
        redirect_uri: serverEnv.DISCORD_REDIRECT_URI ?? "",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Discord token exchange error:", tokenData);
      return NextResponse.redirect(
        new URL("/auth?error=discord_auth_failed", request.url),
      );
    }

    // Get user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL("/auth?error=discord_user_fetch_failed", request.url),
      );
    }

    // Check if Discord account is already linked
    const existingLink = await prisma.discordAccount.findUnique({
      where: { discordId: discordUser.id },
      include: { user: true },
    });

    if (existingLink) {
      // Login with existing linked account
      const sessionToken = await createSession(
        existingLink.userId,
        ip,
        request.headers.get("user-agent") ?? undefined,
      );
      await setAuthCookie(sessionToken);
      await logLogin(existingLink.userId, ip, "discord", true);
      await logAudit("USER_LOGIN_DISCORD", existingLink.userId, undefined, ip);

      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check if user is already logged in (linking Discord to existing account)
    const authToken = request.cookies.get("auth_token")?.value;

    if (authToken) {
      const session = await prisma.session.findUnique({
        where: { token: authToken },
      });

      if (session) {
        // Link Discord to existing account
        await prisma.discordAccount.upsert({
          where: { userId: session.userId },
          create: {
            userId: session.userId,
            discordId: discordUser.id,
            username: discordUser.username,
            avatarUrl:
              discordUser.avatar ?
                `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
          },
          update: {
            discordId: discordUser.id,
            username: discordUser.username,
            avatarUrl:
              discordUser.avatar ?
                `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
          },
        });

        await logAudit(
          "DISCORD_LINKED",
          session.userId,
          JSON.stringify({ discordId: discordUser.id }),
          ip,
        );

        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Create new user from Discord account
    const passwordHash = await hashPassword(
      crypto.randomUUID() + crypto.randomUUID(),
    );

    const newUser = await prisma.user.create({
      data: {
        email: `${discordUser.id}@discord.local`,
        username: `${discordUser.username}_${discordUser.discriminator || "0"}`,
        passwordHash,
        displayName: discordUser.global_name || discordUser.username,
        avatarUrl:
          discordUser.avatar ?
            `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        role: "USER",
        isActive: true,
        discordAccount: {
          create: {
            discordId: discordUser.id,
            username: discordUser.username,
            avatarUrl:
              discordUser.avatar ?
                `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
          },
        },
      },
    });

    const sessionToken = await createSession(
      newUser.id,
      ip,
      request.headers.get("user-agent") ?? undefined,
    );
    await setAuthCookie(sessionToken);
    await logLogin(newUser.id, ip, "discord", true);
    await logAudit("USER_REGISTERED_DISCORD", newUser.id, undefined, ip);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=internal_error", request.url),
    );
  }
}
