import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminKeysClient from "./AdminKeysClient";

export const metadata: Metadata = {
  title: "Key Management | Regix Auth",
  description: "Manage premium license keys",
};

export interface KeyData {
  id: string;
  key: string;
  duration: number;
  isLifetime: boolean;
  isActive: boolean;
  status: string;
  userId: string | null;
  user: { name: string; email: string } | null;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
}

async function getKeysData(): Promise<KeyData[]> {
  const keys = await prisma.premiumKey.findMany({
    select: {
      id: true,
      key: true,
      duration: true,
      isLifetime: true,
      isActive: true,
      status: true,
      userId: true,
      user: { select: { name: true, email: true } },
      createdAt: true,
      expiresAt: true,
      redeemedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return keys.map((k) => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    expiresAt: k.expiresAt?.toISOString() ?? null,
    redeemedAt: k.redeemedAt?.toISOString() ?? null,
  }));
}

export default async function AdminKeysPage() {
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

  const keys = await getKeysData();
  return <AdminKeysClient keys={keys} />;
}
