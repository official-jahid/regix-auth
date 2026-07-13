"use client";

import {
  Activity,
  Ban,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  Infinity,
  Key,
  Loader2,
  LogOut,
  Monitor,
  Shield,
  Trash2,
  Unlock,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { AdminKey, AdminStats, AdminUser } from "./page";

function getStatusBadge(status: string, isActive: boolean) {
  if (!isActive || status === "blocked") {
    return { label: "Blocked", color: "bg-red-500/10 text-red-500" };
  }
  if (status === "used") {
    return { label: "Used", color: "bg-blue-500/10 text-blue-500" };
  }
  if (status === "expired") {
    return { label: "Expired", color: "bg-yellow-500/10 text-yellow-500" };
  }
  return { label: "Active", color: "bg-emerald-500/10 text-emerald-500" };
}

export default function AdminClient({
  data,
}: {
  data: {
    stats: AdminStats | null;
    users: AdminUser[];
    keys: AdminKey[];
  };
}) {
  const { stats, users, keys } = data;
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "keys">(
    "overview",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            System control and management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={"/dashboard" as any}
            className="bg-card hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all sm:px-4 sm:py-2 sm:text-sm">
            <Activity className="size-3.5 sm:size-4" />
            User Dashboard
          </Link>
          <form
            action="/api/auth/logout"
            method="POST">
            <button
              type="submit"
              className="bg-card hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all sm:px-4 sm:py-2 sm:text-sm">
              <LogOut className="size-3.5 sm:size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
        {(["overview", "users", "keys"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all sm:px-5 sm:py-2 sm:text-sm ${
              activeTab === tab ?
                "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border"
            }`}>
            {tab === "overview" && (
              <Activity className="mr-1.5 size-3.5 sm:size-4" />
            )}
            {tab === "users" && <Users className="mr-1.5 size-3.5 sm:size-4" />}
            {tab === "keys" && <Key className="mr-1.5 size-3.5 sm:size-4" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && stats && <OverviewTab stats={stats} />}
      {activeTab === "users" && <UsersTab users={users} />}
      {activeTab === "keys" && <KeysTab keys={keys} />}
    </div>
  );
}

function OverviewTab({ stats }: { stats: AdminStats }) {
  const cards = [
    {
      label: "Total Users",
      value: stats.stats.totalUsers,
      icon: Users,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Active Users",
      value: stats.stats.activeUsers,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Blacklisted",
      value: stats.stats.blacklistedUsers,
      icon: XCircle,
      color: "text-red-500 bg-red-500/10",
    },
    {
      label: "Total Keys",
      value: stats.stats.totalKeys,
      icon: Key,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Active Keys",
      value: stats.stats.activeKeys,
      icon: Shield,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Redeemed Keys",
      value: stats.stats.redeemedKeys,
      icon: CheckCircle2,
      color: "text-cyan-500 bg-cyan-500/10",
    },
    {
      label: "Lifetime Keys",
      value: stats.stats.lifetimeKeys,
      icon: Infinity,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Sessions",
      value: stats.stats.totalSessions,
      icon: Wifi,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      label: "Devices",
      value: stats.stats.totalDevices,
      icon: Monitor,
      color: "text-orange-500 bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-2xl border p-3 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold sm:mt-1 sm:text-3xl">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${card.color}`}>
                  <Icon className="size-4 sm:size-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
            Recent Users
          </h3>
          {stats.recentUsers.length > 0 ?
            <div className="space-y-2">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-muted/30 flex flex-col gap-1 rounded-xl px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs capitalize">
                    {user.role} &middot;{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          : <p className="text-muted-foreground text-sm">No users yet</p>}
        </div>

        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
            Recent Keys
          </h3>
          {stats.recentKeys.length > 0 ?
            <div className="space-y-2">
              {stats.recentKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-muted/30 flex flex-col gap-1 rounded-xl px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <code className="bg-background rounded px-2 py-0.5 font-mono text-xs">
                      {key.key.substring(0, 14)}...
                    </code>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {key.isLifetime ? "Lifetime" : "Timed"} &middot;{" "}
                      {key.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(key.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          : <p className="text-muted-foreground text-sm">No keys yet</p>}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: AdminUser[] }) {
  const [userList, setUserList] = useState(users);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAction = async (
    userId: string,
    action: string,
    value?: string,
  ) => {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      const data = await res.json();
      if (data.success) {
        setUserList(
          (prev) =>
            prev
              .map((u) => {
                if (u.id !== userId) return u;
                switch (action) {
                  case "toggleActive":
                    return { ...u, isActive: !u.isActive };
                  case "toggleBlacklist":
                    return { ...u, isBlacklisted: !u.isBlacklisted };
                  case "setRole":
                    return { ...u, role: value || u.role };
                  case "delete":
                    return null as any;
                  default:
                    return u;
                }
              })
              .filter(Boolean) as AdminUser[],
        );
        toast.success("User updated successfully");
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Failed to perform action");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background ring-primary/50 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 sm:max-w-xs"
        />
        <span className="text-muted-foreground text-sm">
          {filtered.length} / {userList.length} users
        </span>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 sm:hidden">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="bg-card rounded-2xl border p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this user? This cannot be undone.")) {
                    handleAction(user.id, "delete");
                  }
                }}
                disabled={loading === user.id || user.role === "owner"}
                className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                {loading === user.id ?
                  <Loader2 className="size-4 animate-spin" />
                : <Trash2 className="size-4" />}
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={user.role}
                onChange={(e) =>
                  handleAction(user.id, "setRole", e.target.value)
                }
                disabled={loading === user.id}
                className="bg-background rounded-lg border px-2 py-1 text-xs outline-none">
                <option value="user">User</option>
                <option value="reseller">Reseller</option>
                <option value="distributor">Distributor</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => handleAction(user.id, "toggleActive")}
                disabled={loading === user.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.isActive ?
                    "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
                }`}>
                {user.isActive ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => handleAction(user.id, "toggleBlacklist")}
                disabled={loading === user.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.isBlacklisted ?
                    "bg-red-500/10 text-red-500"
                  : "bg-muted text-muted-foreground"
                }`}>
                {user.isBlacklisted ? "Banned" : "Clear"}
              </button>
            </div>
            <div className="text-muted-foreground flex gap-3 text-xs">
              <span>{user._count.sessions} sessions</span>
              <span>{user._count.devices} devices</span>
              <span>{user._count.premiumKeys} keys</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="bg-card hidden overflow-x-auto rounded-2xl border sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium">Devices</th>
              <th className="px-4 py-3 font-medium">Keys</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-muted/20 border-b last:border-0">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleAction(user.id, "setRole", e.target.value)
                    }
                    disabled={loading === user.id}
                    className="bg-background rounded-lg border px-2 py-1 text-xs outline-none">
                    <option value="user">User</option>
                    <option value="reseller">Reseller</option>
                    <option value="distributor">Distributor</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAction(user.id, "toggleActive")}
                      disabled={loading === user.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive ?
                          "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-500"
                      }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleAction(user.id, "toggleBlacklist")}
                      disabled={loading === user.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isBlacklisted ?
                          "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground"
                      }`}>
                      {user.isBlacklisted ? "Banned" : "Clear"}
                    </button>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {user._count.sessions}
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {user._count.devices}
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {user._count.premiumKeys}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (confirm("Delete this user? This cannot be undone.")) {
                        handleAction(user.id, "delete");
                      }
                    }}
                    disabled={loading === user.id || user.role === "owner"}
                    className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                    {loading === user.id ?
                      <Loader2 className="size-4 animate-spin" />
                    : <Trash2 className="size-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KeysTab({ keys }: { keys: AdminKey[] }) {
  const [keyList, setKeyList] = useState(keys);
  const [generateCount, setGenerateCount] = useState(5);
  const [generateDuration, setGenerateDuration] = useState(30);
  const [generateLifetime, setGenerateLifetime] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generateCount,
          duration: generateDuration,
          lifetime: generateLifetime,
        }),
      });
      const data = await res.json();
      if (data.keys) {
        setKeyList((prev) => [...data.keys, ...prev]);
        toast.success(`Generated ${data.count} keys successfully!`);
      } else {
        toast.error(data.error || "Failed to generate keys");
      }
    } catch {
      toast.error("Failed to generate keys");
    }
    setGenerating(false);
  };

  const handleAction = async (
    keyId: string,
    action: string,
    extraDays?: number,
  ) => {
    setLoading(keyId);
    try {
      const body: Record<string, any> = { keyId, action };
      if (extraDays) body.extraDays = extraDays;

      const res = await fetch("/api/admin/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setKeyList(
          (prev) =>
            prev
              .map((k) => {
                if (k.id !== keyId) return k;
                switch (action) {
                  case "toggleActive":
                  case "block":
                    return { ...k, isActive: false, status: "blocked" };
                  case "unblock":
                    return { ...k, isActive: true, status: "active" };
                  case "extend":
                    return { ...k, isActive: true, status: "active" };
                  case "delete":
                    return null as any;
                  default:
                    return k;
                }
              })
              .filter(Boolean) as AdminKey[],
        );
        toast.success(`Key ${action} successful`);
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Failed to perform action");
    }
    setLoading(null);
  };

  const getStatusDisplay = (key: AdminKey) => {
    const badge = getStatusBadge(key.status, key.isActive);
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Generate Keys */}
      <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
        <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
          Generate License Keys
        </h3>
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">
              Count (1-100)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="bg-background ring-primary/50 w-16 rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 sm:w-20 sm:px-3 sm:py-2"
            />
          </div>
          {!generateLifetime && (
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">
                Duration (days)
              </label>
              <input
                type="number"
                min={1}
                value={generateDuration}
                onChange={(e) => setGenerateDuration(Number(e.target.value))}
                className="bg-background ring-primary/50 w-20 rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 sm:w-24 sm:px-3 sm:py-2"
              />
            </div>
          )}
          <div className="flex items-center gap-2 pb-1 sm:pb-0">
            <input
              type="checkbox"
              id="lifetime"
              checked={generateLifetime}
              onChange={(e) => setGenerateLifetime(e.target.checked)}
              className="bg-background rounded border"
            />
            <label
              htmlFor="lifetime"
              className="text-sm">
              Lifetime
            </label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 sm:px-5 sm:py-2">
            {generating ?
              <Loader2 className="size-4 animate-spin" />
            : <Key className="size-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Mobile key cards */}
      <div className="space-y-3 sm:hidden">
        {keyList.map((key) => (
          <div
            key={key.id}
            className="bg-card rounded-2xl border p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                {key.key.substring(0, 14)}...
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(key.key);
                  toast.success("Key copied");
                }}
                className="text-muted-foreground hover:text-foreground p-1">
                <Copy className="size-3" />
              </button>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                {key.isLifetime ?
                  <>
                    <Infinity className="size-3 text-amber-500" /> Lifetime
                  </>
                : <>
                    <Clock className="size-3" /> {key.duration}d
                  </>
                }
              </span>
              {getStatusDisplay(key)}
              <span className="text-muted-foreground text-xs">
                {key.user ? key.user.name : "Unused"}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                Created: {new Date(key.createdAt).toLocaleDateString("en-GB")}
              </span>
              <div className="flex gap-1">
                {key.isActive && key.status !== "blocked" ?
                  <button
                    onClick={() => handleAction(key.id, "block")}
                    disabled={loading === key.id}
                    className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    title="Block key">
                    {loading === key.id ?
                      <Loader2 className="size-4 animate-spin" />
                    : <Ban className="size-4" />}
                  </button>
                : <button
                    onClick={() => handleAction(key.id, "unblock")}
                    disabled={loading === key.id}
                    className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                    title="Unblock key">
                    {loading === key.id ?
                      <Loader2 className="size-4 animate-spin" />
                    : <Unlock className="size-4" />}
                  </button>
                }
                <button
                  onClick={() => {
                    if (confirm("Delete this key?"))
                      handleAction(key.id, "delete");
                  }}
                  disabled={loading === key.id}
                  className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop keys table */}
      <div className="bg-card hidden overflow-x-auto rounded-2xl border sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Extend</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keyList.map((key) => (
              <tr
                key={key.id}
                className="hover:bg-muted/20 border-b last:border-0">
                <td className="px-4 py-3">
                  <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                    {key.key.substring(0, 14)}...
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(key.key);
                      toast.success("Key copied");
                    }}
                    className="text-muted-foreground hover:text-foreground ml-1 inline p-1">
                    <Copy className="size-3" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {key.isLifetime ?
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                      <Infinity className="size-3" /> Lifetime
                    </span>
                  : <span className="inline-flex items-center gap-1 text-xs font-medium">
                      <Clock className="size-3" /> {key.duration}d
                    </span>
                  }
                </td>
                <td className="px-4 py-3">{getStatusDisplay(key)}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {key.user ? key.user.name : "Unused"}
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {new Date(key.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {key.expiresAt ?
                    new Date(key.expiresAt).toLocaleDateString("en-GB")
                  : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      placeholder="Days"
                      value={extendDays[key.id] || ""}
                      onChange={(e) =>
                        setExtendDays((prev) => ({
                          ...prev,
                          [key.id]: Number(e.target.value),
                        }))
                      }
                      className="bg-background ring-primary/50 w-14 rounded border px-1 py-1 text-xs outline-none focus:ring-1"
                    />
                    <button
                      onClick={() => {
                        const days = extendDays[key.id];
                        if (!days || days < 1) {
                          toast.error("Enter a valid number of days");
                          return;
                        }
                        handleAction(key.id, "extend", days);
                      }}
                      disabled={loading === key.id}
                      className="text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors disabled:opacity-50"
                      title="Extend expiration">
                      {loading === key.id ?
                        <Loader2 className="size-4 animate-spin" />
                      : <CalendarPlus className="size-4" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {key.isActive && key.status !== "blocked" ?
                      <button
                        onClick={() => handleAction(key.id, "block")}
                        disabled={loading === key.id}
                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        title="Block key">
                        {loading === key.id ?
                          <Loader2 className="size-4 animate-spin" />
                        : <Ban className="size-4" />}
                      </button>
                    : <button
                        onClick={() => handleAction(key.id, "unblock")}
                        disabled={loading === key.id}
                        className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                        title="Unblock key">
                        {loading === key.id ?
                          <Loader2 className="size-4 animate-spin" />
                        : <Unlock className="size-4" />}
                      </button>
                    }
                    <button
                      onClick={() => {
                        if (confirm("Delete this key?"))
                          handleAction(key.id, "delete");
                      }}
                      disabled={loading === key.id}
                      className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
