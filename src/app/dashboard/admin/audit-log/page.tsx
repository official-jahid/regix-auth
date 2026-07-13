import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuditLogClient from "./AuditLogClient";

export const metadata: Metadata = {
  title: "Audit Log | Regix Auth",
};

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  guildId: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));
}

export default async function AuditLogPage() {
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

  const logs = await getAuditLogs();
  return <AuditLogClient logs={logs} />;
}
