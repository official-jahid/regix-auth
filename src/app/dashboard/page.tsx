"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  KeyIcon,
  LoaderIcon,
  LogOutIcon,
  RefreshCwIcon,
  ShieldIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

interface SessionData {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    isBlacklisted: boolean;
    createdAt: string;
  };
  discord?: {
    discordId: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  premium?: {
    key: string;
    isLifetime: boolean;
    expiresAt: string | null;
    isIpLocked: boolean;
    lockedIp: string | null;
  } | null;
  device?: {
    hwid: string;
    sid: string | null;
    ip: string | null;
    sidUpdatedAt: string | null;
  } | null;
}

const sidSchema = z.object({
  sid: z.string().min(1, "SID is required"),
});

const ipSchema = z.object({
  ip: z.string().min(1, "IP is required"),
});

const discordSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
});

const DashboardPage = () => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [detectedIp, setDetectedIp] = useState("");
  const [sidCooldown, setSidCooldown] = useState(0);

  const sidForm = useForm({
    resolver: zodResolver(sidSchema),
    defaultValues: { sid: "" },
    mode: "all",
  });
  const ipForm = useForm({
    resolver: zodResolver(ipSchema),
    defaultValues: { ip: "" },
    mode: "all",
  });
  const discordForm = useForm({
    resolver: zodResolver(discordSchema),
    defaultValues: { discordId: "" },
    mode: "all",
  });

  useEffect(() => {
    fetchSession();
    detectUserIp();
  }, []);

  useEffect(() => {
    if (sidCooldown > 0) {
      const timer = setInterval(() => setSidCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [sidCooldown]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        window.location.assign("/auth");
        return;
      }
      const data = await res.json();
      setSession(data);

      // Set SID cooldown if recently updated
      if (data.device?.sidUpdatedAt) {
        const lastUpdate = new Date(data.device.sidUpdatedAt).getTime();
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        const elapsed = Date.now() - lastUpdate;
        if (elapsed < cooldownMs) {
          setSidCooldown(Math.floor((cooldownMs - elapsed) / 1000));
        }
      }
    } catch {
      window.location.assign("/auth");
    } finally {
      setLoading(false);
    }
  };

  const detectUserIp = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setDetectedIp(data.ip);
      ipForm.setValue("ip", data.ip);
    } catch {
      // Fallback
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/auth");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSid = async (data: { sid: string }) => {
    if (sidCooldown > 0) {
      toast.error(
        `Please wait ${Math.floor(sidCooldown / 60)}m ${sidCooldown % 60}s before changing SID again`,
      );
      return;
    }
    const res = await fetch("/api/device/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hwid: session?.device?.hwid || "web",
        sid: data.sid,
      }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success("SID updated successfully!");
      setSidCooldown(86400);
      fetchSession();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateIp = async (data: { ip: string }) => {
    const res = await fetch("/api/user/update-ip", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: data.ip }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success("IP updated successfully!");
      fetchSession();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateDiscord = async (data: { discordId: string }) => {
    const res = await fetch("/api/user/update-discord", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId: data.discordId }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success("Discord ID updated!");
      fetchSession();
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const isAdmin = user.role === "ADMIN";
  const daysLeft =
    session.premium?.expiresAt ?
      Math.ceil(
        (new Date(session.premium.expiresAt).getTime() - Date.now()) / 86400000,
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={session.discord?.avatarUrl || user.avatarUrl || undefined}
            />
            <AvatarFallback className="text-lg">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {user.displayName || user.username}
            </h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {user.role}
              </Badge>
              {session.premium && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-500">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => window.location.assign("/dashboard/admin")}>
              <ShieldIcon className="mr-2 h-4 w-4" /> Admin Panel
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleLogout}>
            <LogOutIcon className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      {/* User Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium">Provider</span>
            <UserIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {session.discord ? "Discord" : "Email"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium">Status</span>
            <ShieldIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${user.isBlacklisted ? "text-red-500" : "text-green-500"}`}>
              {user.isBlacklisted ? "Denied" : "Granted"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium">Premium</span>
            <KeyIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {session.premium?.isLifetime ?
                "Lifetime"
              : daysLeft !== null && daysLeft > 0 ?
                `${daysLeft} days left`
              : session.premium ?
                "Expired"
              : "None"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium">IP</span>
            <GlobeIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-bold">
              {session.device?.ip || "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Discord Info */}
      {session.discord && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Discord Account</h2>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={session.discord.avatarUrl || undefined} />
              <AvatarFallback>D</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{session.discord.username}</p>
              <p className="text-muted-foreground text-sm">
                ID: {session.discord.discordId}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(session.discord!.discordId)}>
              {copied ?
                <CheckIcon className="h-4 w-4" />
              : <CopyIcon className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Credentials Forms */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Update SID */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update SID</h2>
              <SmartphoneIcon className="text-muted-foreground h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {sidCooldown > 0 && (
              <p className="mb-2 text-sm text-yellow-500">
                Cooldown: {Math.floor(sidCooldown / 60)}m {sidCooldown % 60}s
              </p>
            )}
            <form
              onSubmit={sidForm.handleSubmit(handleUpdateSid)}
              className="space-y-3">
              <Controller
                name="sid"
                control={sidForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="sid-input">New SID</FieldLabel>
                    <Input
                      {...field}
                      id="sid-input"
                      placeholder="Enter new SID"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Button
                type="submit"
                disabled={sidForm.formState.isSubmitting || sidCooldown > 0}
                className="w-full">
                <RefreshCwIcon className="mr-2 h-4 w-4" /> Update SID
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update IP */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update IP</h2>
              <GlobeIcon className="text-muted-foreground h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={ipForm.handleSubmit(handleUpdateIp)}
              className="space-y-3">
              <Controller
                name="ip"
                control={ipForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ip-input">New IP</FieldLabel>
                    <Input
                      {...field}
                      id="ip-input"
                      placeholder="Enter IP address"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={ipForm.formState.isSubmitting}
                  className="flex-1">
                  <GlobeIcon className="mr-2 h-4 w-4" /> Update IP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={detectUserIp}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Update Discord */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update Discord</h2>
              <UserIcon className="text-muted-foreground h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={discordForm.handleSubmit(handleUpdateDiscord)}
              className="space-y-3">
              <Controller
                name="discordId"
                control={discordForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="discord-input">
                      Discord User ID
                    </FieldLabel>
                    <Input
                      {...field}
                      id="discord-input"
                      placeholder="Enter Discord ID"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Button
                type="submit"
                disabled={discordForm.formState.isSubmitting}
                className="w-full">
                <UserIcon className="mr-2 h-4 w-4" /> Update Discord
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">API Endpoints</h2>
          <p className="text-muted-foreground text-sm">
            Use these endpoints to authenticate from external applications
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted rounded-md p-3">
            <p className="font-mono text-sm">
              <span className="text-green-500">POST</span> /api/device/verify
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Verify HWID/SID for desktop apps. Body: {"{"}username, hwid, sid,
              licenseKey{"}"}
            </p>
          </div>
          <div className="bg-muted rounded-md p-3">
            <p className="font-mono text-sm">
              <span className="text-green-500">POST</span> /api/device/register
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Register a new device. Body: {"{"}hwid, sid{"}"}
            </p>
          </div>
          <div className="bg-muted rounded-md p-3">
            <p className="font-mono text-sm">
              <span className="text-blue-500">GET</span> /api/auth/session
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Get current session info (requires auth cookie)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
