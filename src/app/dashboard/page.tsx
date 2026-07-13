import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Regix Auth",
  description: "User dashboard for Regix Auth",
};

export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    isBlacklisted: boolean;
    createdAt: string;
  };
  device: {
    hwid: string | null;
    sid: string | null;
    ipAddress: string | null;
  } | null;
  discord: {
    discordId: string | null;
    username: string | null;
  } | null;
  premiumKey: {
    key: string;
    duration: number;
    isLifetime: boolean;
    isActive: boolean;
    expiresAt: string | null;
    redeemedAt: string | null;
  } | null;
  sessions: { id: string; createdAt: string; ipAddress: string | null }[];
}

async function getDashboardData(): Promise<DashboardData | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isBlacklisted: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const device = await prisma.device.findFirst({
    where: { userId: user.id },
    select: { hwid: true, sid: true, ipAddress: true },
  });

  const discord = await prisma.discordAccount.findUnique({
    where: { userId: user.id },
    select: { discordId: true, username: true },
  });

  const premiumKey = await prisma.premiumKey.findFirst({
    where: { userId: user.id, isActive: true },
    select: { key: true, duration: true, isLifetime: true, isActive: true, expiresAt: true, redeemedAt: true },
    orderBy: { redeemedAt: "desc" },
  });

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: { id: true, createdAt: true, ipAddress: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    user: { ...user, createdAt: user.createdAt.toISOString() },
    device,
    discord,
    premiumKey: premiumKey
      ? {
          ...premiumKey,
          expiresAt: premiumKey.expiresAt?.toISOString() ?? null,
          redeemedAt: premiumKey.redeemedAt?.toISOString() ?? null,
        }
      : null,
    sessions: sessions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect("/auth");
  }

  return <DashboardClient data={data} />;
}