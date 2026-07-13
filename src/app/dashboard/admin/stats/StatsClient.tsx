"use client";

interface StatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    blacklistedUsers: number;
    totalKeys: number;
    activeKeys: number;
    redeemedKeys: number;
    lifetimeKeys: number;
    totalSessions: number;
    totalDevices: number;
    whitelistedUsers: number;
    totalAuditLogs: number;
  };
}

export default function StatsClient({ stats }: StatsProps) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
    {
      label: "Active Users",
      value: stats.activeUsers,
      color: "text-green-400",
    },
    {
      label: "Blacklisted",
      value: stats.blacklistedUsers,
      color: "text-red-400",
    },
    { label: "Total Keys", value: stats.totalKeys, color: "text-purple-400" },
    { label: "Active Keys", value: stats.activeKeys, color: "text-green-400" },
    {
      label: "Redeemed Keys",
      value: stats.redeemedKeys,
      color: "text-yellow-400",
    },
    {
      label: "Lifetime Keys",
      value: stats.lifetimeKeys,
      color: "text-amber-400",
    },
    {
      label: "Active Sessions",
      value: stats.totalSessions,
      color: "text-cyan-400",
    },
    {
      label: "Total Devices",
      value: stats.totalDevices,
      color: "text-indigo-400",
    },
    {
      label: "Whitelisted",
      value: stats.whitelistedUsers,
      color: "text-emerald-400",
    },
    {
      label: "Audit Logs",
      value: stats.totalAuditLogs,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border-border bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {card.label}
            </p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="border-border rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Key Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-sm">Total</p>
            <p className="text-2xl font-bold text-blue-400">
              {stats.totalKeys}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {stats.activeKeys}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Redeemed</p>
            <p className="text-2xl font-bold text-yellow-400">
              {stats.redeemedKeys}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Available</p>
            <p className="text-2xl font-bold text-purple-400">
              {stats.totalKeys - stats.redeemedKeys}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
