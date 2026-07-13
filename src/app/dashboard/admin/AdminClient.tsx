"use client";

import {
  Activity,
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
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AdminKey, AdminStats, AdminUser } from "./page";

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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "keys">("overview");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">System control and management</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={"/dashboard" as any}
            className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground sm:px-4 sm:py-2 sm:text-sm">
            <Activity className="size-3.5 sm:size-4" />
            User Dashboard
          </Link>
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

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
        {(["overview", "users", "keys"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all sm:px-5 sm:py-2 sm:text-sm ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-lg"
                : "border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}>
            {tab === "overview" && <Activity className="mr-1.5 size-3.5 sm:size-4" />}
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
    { label: "Total Users", value: stats.stats.totalUsers, icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { label: "Active Users", value: stats.stats.activeUsers, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Blacklisted", value: stats.stats.blacklistedUsers, icon: XCircle, color: "text-red-500 bg-red-500/10" },
    { label: "Total Keys", value: stats.stats.totalKeys, icon: Key, color: "text-purple-500 bg-purple-500/10" },
    { label: "Active Keys", value: stats.stats.activeKeys, icon: Shield, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Redeemed Keys", value: stats.stats.redeemedKeys, icon: CheckCircle2, color: "text-cyan-500 bg-cyan-500/10" },
    { label: "Lifetime Keys", value: stats.stats.lifetimeKeys, icon: Infinity, color: "text-amber-500 bg-amber-500/10" },
    { label: "Sessions", value: stats.stats.totalSessions, icon: Wifi, color: "text-indigo-500 bg-indigo-500/10" },
    { label: "Devices", value: stats.stats.totalDevices, icon: Monitor, color: "text-orange-500 bg-orange-500/10" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground sm:text-sm">{card.label}</p>
                  <p className="mt-0.5 text-xl font-bold sm:mt-1 sm:text-3xl">{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 sm:rounded-xl sm:p-3 ${card.color}`}>
                  <Icon className="size-4 sm:size-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Recent Users</h3>
          {stats.recentUsers.length > 0 ? (
            <div className="space-y-2">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-1 rounded-xl bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground capitalize">
                    {user.role} &middot; {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users yet</p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Recent Keys</h3>
          {stats.recentKeys.length > 0 ? (
            <div className="space-y-2">
              {stats.recentKeys.map((key) => (
                <div key={key.id} className="flex flex-col gap-1 rounded-xl bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <code className="rounded bg-background px-2 py-0.5 font-mono text-xs">{key.key.substring(0, 14)}...</code>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {key.isLifetime ? "Lifetime" : "Timed"} &middot; {key.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(key.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No keys yet</p>
          )}
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
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (userId: string, action: string, value?: string) => {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      const data = await res.json();
      if (data.success) {
        setUserList((prev) =>
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
            .filter(Boolean) as AdminUser[]
        );
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Failed to perform action");
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
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none ring-primary/50 focus:ring-2 sm:max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {userList.length} users
        </span>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 sm:hidden">
        {filtered.map((user) => (
          <div key={user.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this user? This cannot be undone.")) {
                    handleAction(user.id, "delete");
                  }
                }}
                disabled={loading === user.id || user.role === "owner"}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                {loading === user.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={user.role}
                onChange={(e) => handleAction(user.id, "setRole", e.target.value)}
                disabled={loading === user.id}
                className="rounded-lg border bg-background px-2 py-1 text-xs outline-none">
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
                  user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                }`}>
                {user.isActive ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => handleAction(user.id, "toggleBlacklist")}
                disabled={loading === user.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.isBlacklisted ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                }`}>
                {user.isBlacklisted ? "Banned" : "Clear"}
              </button>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{user._count.sessions} sessions</span>
              <span>{user._count.devices} devices</span>
              <span>{user._count.premiumKeys} keys</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-x-auto rounded-2xl border bg-card sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
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
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleAction(user.id, "setRole", e.target.value)}
                    disabled={loading === user.id}
                    className="rounded-lg border bg-background px-2 py-1 text-xs outline-none">
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
                        user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleAction(user.id, "toggleBlacklist")}
                      disabled={loading === user.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isBlacklisted ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                      }`}>
                      {user.isBlacklisted ? "Banned" : "Clear"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user._count.sessions}</td>
                <td className="px-4 py-3 text-muted-foreground">{user._count.devices}</td>
                <td className="px-4 py-3 text-muted-foreground">{user._count.premiumKeys}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (confirm("Delete this user? This cannot be undone.")) {
                        handleAction(user.id, "delete");
                      }
                    }}
                    disabled={loading === user.id || user.role === "owner"}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                    {loading === user.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: generateCount, duration: generateDuration, lifetime: generateLifetime }),
      });
      const data = await res.json();
      if (data.keys) {
        setKeyList((prev) => [...data.keys, ...prev]);
        alert(`Generated ${data.count} keys successfully!`);
      } else {
        alert(data.error || "Failed to generate keys");
      }
    } catch {
      alert("Failed to generate keys");
    }
    setGenerating(false);
  };

  const handleAction = async (keyId: string, action: string) => {
    setLoading(keyId);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyList((prev) =>
          prev
            .map((k) => {
              if (k.id !== keyId) return k;
              if (action === "toggleActive") return { ...k, isActive: !k.isActive };
              if (action === "delete") return null as any;
              return k;
            })
            .filter(Boolean) as AdminKey[]
        );
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Failed to perform action");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Generate Keys */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <h3 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Generate License Keys</h3>
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Count (1-100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="w-16 rounded-lg border bg-background px-2 py-1.5 text-sm outline-none ring-primary/50 focus:ring-2 sm:w-20 sm:px-3 sm:py-2"
            />
          </div>
          {!generateLifetime && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={generateDuration}
                onChange={(e) => setGenerateDuration(Number(e.target.value))}
                className="w-20 rounded-lg border bg-background px-2 py-1.5 text-sm outline-none ring-primary/50 focus:ring-2 sm:w-24 sm:px-3 sm:py-2"
              />
            </div>
          )}
          <div className="flex items-center gap-2 pb-1 sm:pb-0">
            <input
              type="checkbox"
              id="lifetime"
              checked={generateLifetime}
              onChange={(e) => setGenerateLifetime(e.target.checked)}
              className="rounded border bg-background"
            />
            <label htmlFor="lifetime" className="text-sm">Lifetime</label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:px-5 sm:py-2">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Mobile key cards */}
      <div className="space-y-3 sm:hidden">
        {keyList.map((key) => (
          <div key={key.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{key.key.substring(0, 14)}...</code>
              <button
                onClick={() => navigator.clipboard.writeText(key.key)}
                className="p-1 text-muted-foreground hover:text-foreground">
                <Copy className="size-3" />
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                {key.isLifetime ? <><Infinity className="size-3 text-amber-500" /> Lifetime</> : <><Clock className="size-3" /> {key.duration}d</>}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${key.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                {key.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-muted-foreground">{key.user ? key.user.name : "Unused"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created: {new Date(key.createdAt).toLocaleDateString("en-GB")}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAction(key.id, "toggleActive")}
                  disabled={loading === key.id}
                  className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                    key.isActive ? "text-red-500 hover:bg-red-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
                  }`}>
                  {loading === key.id ? <Loader2 className="size-4 animate-spin" /> : key.isActive ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                </button>
                <button
                  onClick={() => { if (confirm("Delete this key?")) handleAction(key.id, "delete"); }}
                  disabled={loading === key.id}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop keys table */}
      <div className="hidden overflow-x-auto rounded-2xl border bg-card sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keyList.map((key) => (
              <tr key={key.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{key.key.substring(0, 14)}...</code>
                  <button onClick={() => navigator.clipboard.writeText(key.key)} className="ml-1 inline p-1 text-muted-foreground hover:text-foreground">
                    <Copy className="size-3" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {key.isLifetime ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500"><Infinity className="size-3" /> Lifetime</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium"><Clock className="size-3" /> {key.duration}d</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${key.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    {key.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{key.user ? key.user.name : "Unused"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(key.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-4 py-3 text-muted-foreground">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString("en-GB") : "Never"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAction(key.id, "toggleActive")}
                      disabled={loading === key.id}
                      className={`rounded-lg p-1.5 text-xs transition-colors disabled:opacity-50 ${
                        key.isActive ? "text-red-500 hover:bg-red-500/10" : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}>
                      {loading === key.id ? <Loader2 className="size-4 animate-spin" /> : key.isActive ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this key?")) handleAction(key.id, "delete"); }}
                      disabled={loading === key.id}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
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