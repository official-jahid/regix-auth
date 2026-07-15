"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Disc3,
  ExternalLink,
  Globe,
  Infinity,
  Key,
  LogOut,
  Monitor,
  RefreshCw,
  Shield,
  User,
  Wifi,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { DashboardData } from "./page";
import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/shadcnui/dialog";
import { DialogPrimitive } from "@base-ui/react/dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(expiresAt: string | null) {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return { text: "Expired", urgent: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const urgent = days < 7;
  const text = days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${hours}h ${minutes}m ${seconds}s`;

  return { text, urgent };
}

function useExpiryCountdown(expiresAt: string | null) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown(null);
      setIsUrgent(false);
      return;
    }

    const updateCountdown = () => {
      const result = formatCountdown(expiresAt);
      if (result) {
        setCountdown(result.text);
        setIsUrgent(result.urgent);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return { countdown, isUrgent };
}

function parseUserAgent(ua: string | null): {
  browser: string;
  os: string;
  device: string;
} {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };

  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) {
    os = "Android";
    device = "Mobile";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
    device = "Mobile";
  }

  return { browser, os, device };
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, device, discord, premiumKey, sessions } = data;
  const isAdmin = user.role === "admin" || user.role === "owner";

  const getStatusBadge = () => {
    if (user.isBlacklisted)
      return {
        label: "Blacklisted",
        color: "text-red-500 border-red-500/30 bg-red-500/10",
        icon: XCircle,
      };
    if (!user.isActive)
      return {
        label: "Inactive",
        color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
        icon: AlertTriangle,
      };
    if (premiumKey)
      return {
        label: "Premium",
        color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
        icon: CheckCircle2,
      };
    return {
      label: "Free",
      color: "text-muted-foreground border-border bg-card",
      icon: User,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  const getKeyStatus = () => {
    if (!premiumKey)
      return { label: "No Key", color: "text-muted-foreground", icon: XCircle };
    if (!premiumKey.isActive)
      return { label: "Suspended", color: "text-red-500", icon: XCircle };
    if (premiumKey.expiresAt && new Date(premiumKey.expiresAt) < new Date())
      return { label: "Expired", color: "text-red-500", icon: AlertTriangle };
    return {
      label: "Access Granted",
      color: "text-emerald-500",
      icon: CheckCircle2,
    };
  };

  const keyStatus = getKeyStatus();
  const KeyStatusIcon = keyStatus.icon;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Welcome back, {user.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              href={"/dashboard/admin" as any}
              className="bg-card hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all sm:px-4 sm:py-2 sm:text-sm">
              <Shield className="size-3.5 sm:size-4" />
              Admin Panel
            </Link>
          )}
          <form
            action="/api/auth/logout"
            method="POST"
            onSubmit={() => toast.success("Logout successful")}>
            <button
              type="submit"
              className="bg-card hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all sm:px-4 sm:py-2 sm:text-sm">
              <LogOut className="size-3.5 sm:size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-card mb-6 rounded-2xl border p-4 shadow-sm sm:mb-8 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 ${status.color}`}>
            <StatusIcon className="size-3 sm:size-3.5" />
            {status.label}
          </div>
          <div className="text-muted-foreground text-xs sm:text-sm">
            Role:{" "}
            <span className="text-foreground font-medium capitalize">
              {user.role}
            </span>
          </div>
          <div className="text-muted-foreground text-xs sm:text-sm">
            Joined:{" "}
            <span className="text-foreground font-medium">
              {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* License Section */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Key className="text-primary size-4 sm:size-5" />
            Active License
          </h2>
          {premiumKey ?
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-muted/50 flex items-center justify-between rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                <code className="font-mono text-xs tracking-wider break-all sm:text-sm">
                  {premiumKey.key}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(premiumKey.key)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground ml-2 shrink-0 rounded-lg p-1.5 transition-colors">
                  <Copy className="size-3.5 sm:size-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
                  <span className="text-muted-foreground text-xs">
                    Duration
                  </span>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    {premiumKey.isLifetime ?
                      <>
                        <Infinity className="text-primary size-3.5 sm:size-4" />{" "}
                        Lifetime
                      </>
                    : <>
                        <Clock className="text-primary size-3.5 sm:size-4" />{" "}
                        {premiumKey.duration} Days
                      </>
                    }
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p
                    className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${keyStatus.color}`}>
                    <KeyStatusIcon className="size-3.5 sm:size-4" />
{keyStatus.label}
                   </p>
                 </div>
                 {premiumKey.expiresAt && !premiumKey.isLifetime && (
                   <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
                     <span className="text-muted-foreground text-xs">
                       Expires
                     </span>
                     <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                       <Clock className="text-primary size-3.5 sm:size-4" />
                       {formatDate(premiumKey.expiresAt)}
                       <ExpiryCountdown expiresAt={premiumKey.expiresAt} />
                     </p>
                   </div>
                 )}
                {premiumKey.redeemedAt && (
                  <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
                    <span className="text-muted-foreground text-xs">
                      Redeemed
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(premiumKey.redeemedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          : <div className="py-6 text-center sm:py-8">
              <Key className="text-muted-foreground mx-auto mb-3 size-6 sm:size-8" />
              <p className="text-muted-foreground text-sm">
                No active license key
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Redeem a key below to unlock premium features
              </p>
            </div>
          }
        </div>

        {/* Hardware & Credentials */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Monitor className="text-primary size-4 sm:size-5" />
            System Info
          </h2>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Cpu className="size-3 sm:size-3.5" /> SID / HWID
              </span>
              <p className="mt-1 font-mono text-xs break-all">
                {device?.sid || device?.hwid || "Not set"}
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Globe className="size-3 sm:size-3.5" /> IP Address
              </span>
              <p className="mt-1 font-mono text-xs">
                {device?.ipAddress || "Not set"}
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-2.5 sm:p-3">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Disc3 className="size-3 sm:size-3.5" /> Discord ID
              </span>
              <p className="mt-1 font-mono text-xs break-all">
                {discord?.discordId || "Not linked"}
              </p>
            </div>
          </div>
        </div>

        {/* Credential Update Form */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <RefreshCw className="text-primary size-4 sm:size-5" />
            Update Credentials
          </h2>
          <DashboardForm
            device={device}
            discord={discord}
          />
        </div>

        {/* Redeem Key */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Key className="text-primary size-4 sm:size-5" />
            Redeem Key
          </h2>
          <RedeemForm />
        </div>

        {/* Sessions */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Globe className="text-primary size-4 sm:size-5" />
            Active Sessions
          </h2>
          {sessions.length > 0 ?
            <div className="space-y-2">
              {sessions.map((session) => {
                const ua = parseUserAgent(session.userAgent);
                return (
                  <div
                    key={session.id}
                    className="bg-muted/30 flex flex-col gap-2 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-center gap-2">
                        <Wifi className="text-muted-foreground size-3.5 shrink-0 sm:size-4" />
                        <span className="text-sm font-medium">
                          {session.ipAddress || "Unknown IP"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:ml-0">
                        <span className="bg-background/80 text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                          {ua.browser}
                        </span>
                        <span className="bg-background/80 text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                          {ua.os}
                        </span>
                        <span className="bg-background/80 text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                          {ua.device}
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-[10px] sm:text-xs">
                      {formatDateTime(session.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          : <p className="text-muted-foreground text-sm">No active sessions</p>}
        </div>

        {/* Verification API */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6 lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <ExternalLink className="text-primary size-4 sm:size-5" />
            Verification API
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 sm:px-3">
              <CheckCircle2 className="size-2.5 sm:size-3" />
              Online
            </div>
            <code className="bg-muted rounded-lg px-2 py-1.5 font-mono text-xs break-all sm:px-3 sm:py-2">
              GET /api/verify?sid={device?.sid || "{MACHINE_SID}"}
            </code>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `/api/verify?sid=${device?.sid || "{MACHINE_SID}"}`,
                )
              }
              className="bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border p-1.5 transition-colors sm:p-2">
              <Copy className="size-3.5 sm:size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const { countdown, isUrgent } = useExpiryCountdown(expiresAt);

  if (!countdown) return null;

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isUrgent
          ? "animate-pulse text-red-500"
          : "text-muted-foreground"
      }`}
      title="Time until expiration">
      {countdown}
    </span>
  );
}

function DashboardForm({
  device,
  discord,
}: {
  device: { sid: string | null; ipAddress: string | null } | null;
  discord: { discordId: string | null } | null;
}) {
  const [sid, setSid] = useState(device?.sid || "");
  const [ipAddress, setIpAddress] = useState(device?.ipAddress || "");
  const [discordId, setDiscordId] = useState(discord?.discordId || "");
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const handleUpdateSid = async () => {
    if (!sid.trim()) return;
    setUpdatingField("sid");
    try {
      await fetch("/api/dashboard/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid }),
      });
      toast.success("SID updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update SID");
    } finally {
      setUpdatingField(null);
    }
  };

  const handleAutoDetectIp = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setIpAddress(data.ip);
    } catch {
      toast.error("Failed to auto-detect IP");
    }
  };

  const handleUpdateIp = async () => {
    if (!ipAddress.trim()) return;
    setUpdatingField("ip");
    try {
      await fetch("/api/dashboard/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });
      toast.success("IP address updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update IP");
    } finally {
      setUpdatingField(null);
    }
  };

  const handleUpdateDiscord = async () => {
    if (!discordId.trim()) return;
    setUpdatingField("discord");
    try {
      await fetch("/api/dashboard/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId }),
      });
      toast.success("Discord ID updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update Discord");
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {/* New SID */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium">
            New SID
          </label>
          <Input
            type="text"
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            placeholder="Enter new SID / HWID"
          />
          <Button
            onClick={handleUpdateSid}
            disabled={updatingField === "sid" || !sid.trim()}>
            {updatingField === "sid" ? "Updating..." : "Update SID"}
          </Button>
        </div>

        {/* IP Address */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium">
            IP Address
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Enter IP"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetectIp}
              disabled={updatingField === "ip"}
              title="Auto-detect IP">
              <Wifi className="size-3.5 sm:size-4" />
            </Button>
          </div>
          <Button
            onClick={handleUpdateIp}
            disabled={updatingField === "ip" || !ipAddress.trim()}>
            {updatingField === "ip" ? "Updating..." : "Update IP"}
          </Button>
        </div>

        {/* Discord ID */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-xs font-medium">
            Discord ID
          </label>
          <Input
            type="text"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="Enter Discord ID (e.g. 123456789012345678)"
          />
          <Button
            onClick={handleUpdateDiscord}
            disabled={updatingField === "discord" || !discordId.trim()}>
            {updatingField === "discord" ? "Updating..." : "Update Discord"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RedeemForm() {
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleRedeem = async () => {
    if (!accessKey.trim()) {
      setError("Access key is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Key redeemed successfully");
        setOpen(false);
        window.location.reload();
      } else {
        setError(data.error || "Failed to redeem key");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Key className="size-3.5 sm:size-4" />
          Redeem Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redeem License Key</DialogTitle>
          <DialogDescription>
            Enter your license key to unlock premium features. Keys are in format:
            XXXXX-XXXXX-XXXXX-XXXXX
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="access-key"
            value={accessKey}
            onChange={(e) => {
              setAccessKey(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            className="font-mono tracking-wider"
            autoComplete="off"
          />
{error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogPrimitive.Close
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            onClick={handleRedeem}
            disabled={isSubmitting || !accessKey.trim()}
          >
            {isSubmitting ? "Redeeming..." : "Redeem Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
