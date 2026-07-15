import { auth } from "@/lib/auth";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/shadcnui/card";
import prisma from "@/lib/database/dbClient";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, Shield, User, Calendar, Cpu, Globe, Disc3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile | Regix Auth",
  description: "View and manage your profile settings",
};

function formatDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getProfileData(userId: string) {
  const device = await prisma.device.findFirst({
    where: { userId },
    select: { sid: true, ipAddress: true },
  });

  const discord = await prisma.discordAccount.findUnique({
    where: { userId },
    select: { discordId: true },
  });

  return { device, discord };
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth");
  }

  const data = await getProfileData(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your account information and credentials
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-primary size-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Username</p>
                <p className="font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Role</p>
                <Badge variant="secondary" className="capitalize">
                  {session.user.role}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Member Since</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="size-3" />
                  {formatDate(session.user.createdAt as Date)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge variant={session.user.isBlacklisted ? "destructive" : "outline"}>
                  {session.user.isBlacklisted ? "Blacklisted" : "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="text-primary size-5" />
              System Credentials
            </CardTitle>
            <CardDescription>Hardware and IP binding information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Cpu className="size-3" />
                SID / HWID
              </p>
              <p className="mt-1 font-mono text-sm break-all">
                {data.device?.sid || "Not set"}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Globe className="size-3" />
                IP Address
              </p>
              <p className="mt-1 font-mono text-sm break-all">
                {data.device?.ipAddress || "Not set"}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Disc3 className="size-3" />
                Discord ID
              </p>
              <p className="mt-1 font-mono text-sm break-all">
                {data.discord?.discordId || "Not linked"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="flex justify-end">
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="destructive">
              <LogOut className="size-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
