import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import BotSettingsClient from "./BotSettingsClient";

export const metadata: Metadata = {
  title: "Bot Settings | Regix Auth",
};

export interface GuildSettingData {
  id: string;
  guildId: string;
  verificationEnabled: boolean;
  verifiedRoleId: string | null;
  verificationChannelId: string | null;
  antiNukeEnabled: boolean;
  antiRaidEnabled: boolean;
  antiSpamEnabled: boolean;
}

export interface AntiNukeData {
  id: string;
  guildId: string;
  banLimit: number;
  kickLimit: number;
  channelDeleteLimit: number;
  channelCreateLimit: number;
  roleCreateLimit: number;
  roleDeleteLimit: number;
  webhookLimit: number;
  punishment: string;
  enabled: boolean;
}

export interface AntiRaidData {
  id: string;
  guildId: string;
  joinThreshold: number;
  joinTimeWindow: number;
  messageThreshold: number;
  messageTimeWindow: number;
  mentionThreshold: number;
  punishment: string;
  enabled: boolean;
}

export interface AntiSpamData {
  id: string;
  guildId: string;
  messageLimit: number;
  timeWindow: number;
  duplicateLimit: number;
  punishment: string;
  enabled: boolean;
}

async function getBotSettings() {
  const [guilds, antiNuke, antiRaid, antiSpam, whitelist] = await Promise.all([
    prisma.guildSettings.findMany({ take: 50 }),
    prisma.antiNukeConfig.findMany({ take: 50 }),
    prisma.antiRaidConfig.findMany({ take: 50 }),
    prisma.antiSpamConfig.findMany({ take: 50 }),
    prisma.botWhitelist.findMany({ take: 100, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    guilds: guilds.map((g) => ({ ...g })),
    antiNuke: antiNuke.map((a) => ({ ...a })),
    antiRaid: antiRaid.map((a) => ({ ...a })),
    antiSpam: antiSpam.map((a) => ({ ...a })),
    whitelist: whitelist.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  };
}

export default async function BotSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth");

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (
    !adminUser ||
    (adminUser.role !== "admin" && adminUser.role !== "owner")
  ) {
    redirect("/dashboard");
  }

  const data = await getBotSettings();
  return <BotSettingsClient data={data} />;
}
