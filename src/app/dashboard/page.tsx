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
  AlertTriangleIcon,
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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
    status: string;
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
    isValid: boolean;
    reason: string;
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
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sidCooldown, setSidCooldown] = useState(0);
  const [redeemKey, setRedeemKey] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const fetchStartedRef = useRef(false);

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

  const doFetchSession = async (resetLoading = true) => {
    if (resetLoading) setLoading(true);
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/auth");
        return;
      }
      const data = await res.json();
      setSession(data);

      if (data.device?.sidUpdatedAt) {
        const lastUpdate = new Date(data.device.sidUpdatedAt).getTime();
        const cooldownMs = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const elapsed = now - lastUpdate;
        if (elapsed < cooldownMs) {
          setSidCooldown(Math.floor((cooldownMs - elapsed) / 1000));
        }
      }
    } catch {
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  const sessionFetcher = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (sessionFetcher.current) return;
    sessionFetcher.current = doFetchSession();
  }, [router]);

  const detectUserIp = async () => {
    const candidates = [
      "https://api.ipify.org?format=json",
      "https://api64.ipify.org?format=json",
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.ip) {
          ipForm.setValue("ip", data.ip);
          return;
        }
      } catch {
        // Try the next provider
      }
    }

    ipForm.setValue("ip", "127.0.0.1");
    toast.info(
      "Using local fallback IP because public IP detection was unavailable.",
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
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
      doFetchSession(false);
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
      doFetchSession(false);
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
      doFetchSession(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleRedeemKey = async (event: FormEvent) => {
    event.preventDefault();
    if (!redeemKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    setRedeeming(true);
    try {
      const res = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: redeemKey.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "Key redeemed successfully");
        setRedeemKey("");
        doFetchSession(true);
      } else {
        toast.error(result.error || "Unable to redeem key");
      }
    } catch {
      toast.error("Unable to redeem key");
    } finally {
      setRedeeming(false);
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
  const isAdmin = user.role === "ADMIN" || user.role === "OWNER";
  const hasValidPremium = session.premium?.isValid === true;
  const needsPremiumRenewal = !hasValidPremium && !isAdmin;

  if (needsPremiumRenewal) {
    const isExpired = session.premium?.reason === "expired";
    return (
      <div className="mx-auto flex min-h-dvh max-w-4xl items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <div className="mb-2 flex justify-center">
              <div className="bg-destructive/10 rounded-full p-3">
                <AlertTriangleIcon className="text-destructive h-8 w-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">
              {isExpired ? "License Expired" : "Premium Access Required"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isExpired ?
                "Your license key has expired. Please renew with a new valid key to continue using the dashboard."
              : "A valid premium license key is required to access the dashboard."
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleRedeemKey}
              className="flex flex-col gap-3">
              <Field>
                <FieldLabel htmlFor="renew-key">New License Key</FieldLabel>
                <Input
                  id="renew-key"
                  value={redeemKey}
                  onChange={(event) => setRedeemKey(event.target.value)}
                  placeholder="Enter your new license key"
                />
              </Field>
              <Button
                type="submit"
                disabled={redeeming}
                className="w-full">
                <KeyIcon className="mr-2 h-4 w-4" />
                {redeeming ? "Activating..." : "Activate New Key"}
              </Button>
            </form>
            <Button
              variant="outline"
              onClick={() => {
                sessionFetcher.current = null;
                doFetchSession(true);
              }}
              className="w-full">
              <RefreshCwIcon className="mr-2 h-4 w-4" /> Check Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const daysLeft =
    session.premium?.expiresAt ?
      Math.ceil(
        (new Date(session.premium.expiresAt).getTime() - now.getTime()) /
          86400000,
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pt-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            <AvatarImage
              src={session.discord?.avatarUrl || user.avatarUrl || undefined}
            />
            <AvatarFallback className="text-lg">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl">
              {user.displayName || user.username}
            </h1>
            <p className="text-muted-foreground truncate text-xs sm:text-sm">
              Welcome back, {user.displayName || user.username}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {user.role}
              </Badge>
              {hasValidPremium && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-500">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/admin")}>
              <ShieldIcon className="mr-1.5 h-4 w-4" /> Admin Panel
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}>
            <LogOutIcon className="mr-1.5 h-4 w-4" /> Logout
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
            <span className="text-sm font-medium">License</span>
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
              : isAdmin ?
                "Unlimited"
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

      {/* Premium status card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">License Status</h2>
              <p className="text-muted-foreground text-sm">
                {hasValidPremium ?
                  "Your account has an active license."
                : isAdmin ?
                  "Admin accounts have unlimited access."
                : "No valid license found."}
              </p>
            </div>
            {session.premium && (
              <Badge
                variant={session.premium.isValid ? "default" : "secondary"}>
                {session.premium.isValid ? "Active" : session.premium.reason}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

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
