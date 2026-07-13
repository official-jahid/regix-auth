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
import type { DashboardData } from "./page";

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

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, device, discord, premiumKey, sessions } = data;
  const isAdmin = user.role === "admin" || user.role === "owner";

  const getStatusBadge = () => {
    if (user.isBlacklisted)
      return { label: "Blacklisted", color: "text-red-500 border-red-500/30 bg-red-500/10", icon: XCircle };
    if (!user.isActive)
      return { label: "Inactive", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10", icon: AlertTriangle };
    if (premiumKey)
      return { label: "Premium", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10", icon: CheckCircle2 };
    return { label: "Free", color: "text-muted-foreground border-border bg-card", icon: User };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  const getKeyStatus = () => {
    if (!premiumKey) return { label: "No Key", color: "text-muted-foreground", icon: XCircle };
    if (!premiumKey.isActive) return { label: "Suspended", color: "text-red-500", icon: XCircle };
    if (premiumKey.expiresAt && new Date(premiumKey.expiresAt) < new Date())
      return { label: "Expired", color: "text-red-500", icon: AlertTriangle };
    return { label: "Access Granted", color: "text-emerald-500", icon: CheckCircle2 };
  };

  const keyStatus = getKeyStatus();
  const KeyStatusIcon = keyStatus.icon;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Welcome back, {user.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              href={"/dashboard/admin" as any}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground sm:px-4 sm:py-2 sm:text-sm">
              <Shield className="size-3.5 sm:size-4" />
              Admin Panel
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-destructive/10 hover:text-destructive sm:px-4 sm:py-2 sm:text-sm">
              <LogOut className="size-3.5 sm:size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Status Banner */}
      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm sm:mb-8 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 ${status.color}`}>
            <StatusIcon className="size-3 sm:size-3.5" />
            {status.label}
          </div>
          <div className="text-xs text-muted-foreground sm:text-sm">
            Role: <span className="font-medium capitalize text-foreground">{user.role}</span>
          </div>
          <div className="text-xs text-muted-foreground sm:text-sm">
            Joined: <span className="font-medium text-foreground">{formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* License Section */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Key className="size-4 text-primary sm:size-5" />
            Active License
          </h2>
          {premiumKey ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 sm:px-4 sm:py-3">
                <code className="break-all font-mono text-xs tracking-wider sm:text-sm">{premiumKey.key}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(premiumKey.key)}
                  className="ml-2 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Copy className="size-3.5 sm:size-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
                  <span className="text-xs text-muted-foreground">Duration</span>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    {premiumKey.isLifetime ? (
                      <><Infinity className="size-3.5 text-primary sm:size-4" /> Lifetime</>
                    ) : (
                      <><Clock className="size-3.5 text-primary sm:size-4" /> {premiumKey.duration} Days</>
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${keyStatus.color}`}>
                    <KeyStatusIcon className="size-3.5 sm:size-4" />
                    {keyStatus.label}
                  </p>
                </div>
                {premiumKey.expiresAt && (
                  <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
                    <span className="text-xs text-muted-foreground">Expires</span>
                    <p className="mt-1 text-sm font-medium">{formatDate(premiumKey.expiresAt)}</p>
                  </div>
                )}
                {premiumKey.redeemedAt && (
                  <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
                    <span className="text-xs text-muted-foreground">Redeemed</span>
                    <p className="mt-1 text-sm font-medium">{formatDate(premiumKey.redeemedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center sm:py-8">
              <Key className="mx-auto mb-3 size-6 text-muted-foreground sm:size-8" />
              <p className="text-sm text-muted-foreground">No active license key</p>
              <p className="mt-1 text-xs text-muted-foreground">Redeem a key below to unlock premium features</p>
            </div>
          )}
        </div>

        {/* Hardware & Credentials */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Monitor className="size-4 text-primary sm:size-5" />
            System Info
          </h2>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cpu className="size-3 sm:size-3.5" /> SID / HWID
              </span>
              <p className="mt-1 break-all font-mono text-xs">{device?.sid || device?.hwid || "Not set"}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3 sm:size-3.5" /> IP Address
              </span>
              <p className="mt-1 font-mono text-xs">{device?.ipAddress || "Not set"}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-2.5 sm:p-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Disc3 className="size-3 sm:size-3.5" /> Discord ID
              </span>
              <p className="mt-1 break-all font-mono text-xs">{discord?.discordId || "Not linked"}</p>
            </div>
          </div>
        </div>

        {/* Credential Update Form */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <RefreshCw className="size-4 text-primary sm:size-5" />
            Update Credentials
          </h2>
          <DashboardForm device={device} discord={discord} />
        </div>

        {/* Redeem Key */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Key className="size-4 text-primary sm:size-5" />
            Redeem Key
          </h2>
          <RedeemForm />
        </div>

        {/* Sessions */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <Globe className="size-4 text-primary sm:size-5" />
            Active Sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col gap-1 rounded-xl bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Wifi className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />
                    <span className="text-sm">{session.ipAddress || "Unknown IP"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(session.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          )}
        </div>

        {/* Verification API */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:mb-4 sm:text-lg">
            <ExternalLink className="size-4 text-primary sm:size-5" />
            Verification API
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 sm:px-3">
              <CheckCircle2 className="size-2.5 sm:size-3" />
              Online
            </div>
            <code className="break-all rounded-lg bg-muted px-2 py-1.5 font-mono text-xs sm:px-3 sm:py-2">
              GET /api/verify?sid={device?.sid || "{MACHINE_SID}"}
            </code>
            <button
              onClick={() =>
                navigator.clipboard.writeText(`/api/verify?sid=${device?.sid || "{MACHINE_SID}"}`)
              }
              className="rounded-lg border bg-card p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:p-2">
              <Copy className="size-3.5 sm:size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardForm({
  device,
  discord,
}: {
  device: { sid: string | null; ipAddress: string | null } | null;
  discord: { discordId: string | null } | null;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">New SID</label>
          <div className="flex gap-1.5 sm:gap-2">
            <input
              type="text"
              id="sid-input"
              defaultValue={device?.sid || ""}
              placeholder="Enter new SID"
              className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs outline-none ring-primary/50 focus:ring-2 sm:px-3 sm:py-2 sm:text-sm"
            />
            <button
              onClick={async () => {
                const sid = (document.getElementById("sid-input") as HTMLInputElement).value;
                if (!sid) return;
                await fetch("/api/dashboard/device", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sid }),
                });
                window.location.reload();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3 sm:py-2">
              Update SID
            </button>
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">IP Address</label>
          <div className="flex gap-1.5 sm:gap-2">
            <input
              type="text"
              id="ip-input"
              defaultValue={device?.ipAddress || ""}
              placeholder="Enter IP"
              className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs outline-none ring-primary/50 focus:ring-2 sm:px-3 sm:py-2 sm:text-sm"
            />
            <button
              onClick={async () => {
                try {
                  const res = await fetch("https://api.ipify.org?format=json");
                  const data = await res.json();
                  (document.getElementById("ip-input") as HTMLInputElement).value = data.ip;
                } catch {
                  alert("Failed to auto-detect IP");
                }
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border bg-card px-2 py-1.5 text-xs font-medium transition-colors hover:bg-accent sm:gap-1.5 sm:px-3 sm:py-2">
              <Wifi className="size-3 sm:size-3.5" />
              Auto
            </button>
            <button
              onClick={async () => {
                const ip = (document.getElementById("ip-input") as HTMLInputElement).value;
                if (!ip) return;
                await fetch("/api/dashboard/device", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ipAddress: ip }),
                });
                window.location.reload();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3 sm:py-2">
              Update IP
            </button>
          </div>
        </div>
        <div className="space-y-1.5 sm:space-y-2 sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium text-muted-foreground">Discord ID</label>
          <div className="flex gap-1.5 sm:gap-2">
            <input
              type="text"
              id="discord-input"
              defaultValue={discord?.discordId || ""}
              placeholder="Enter Discord ID"
              className="min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs outline-none ring-primary/50 focus:ring-2 sm:px-3 sm:py-2 sm:text-sm"
            />
            <button
              onClick={async () => {
                const discordId = (document.getElementById("discord-input") as HTMLInputElement).value;
                if (!discordId) return;
                await fetch("/api/dashboard/discord", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ discordId }),
                });
                window.location.reload();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3 sm:py-2">
              Update Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedeemForm() {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      <input
        type="text"
        id="redeem-input"
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none ring-primary/50 focus:ring-2 sm:text-sm"
      />
      <button
        onClick={async () => {
          const key = (document.getElementById("redeem-input") as HTMLInputElement).value;
          if (!key) return;
          const res = await fetch("/api/dashboard/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          });
          const data = await res.json();
          if (data.success) {
            window.location.reload();
          } else {
            alert(data.error || "Failed to redeem key");
          }
        }}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        Redeem Key
      </button>
    </div>
  );
}