"use client";

import type { AuditLogEntry } from "./page";

export default function AuditLogClient({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3 text-left">User ID</th>
              <th className="p-3 text-left">IP</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-muted/50">
                <td className="text-muted-foreground p-3 text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-xs">{log.target || "—"}</td>
                <td className="p-3 font-mono text-xs">
                  {log.userId?.slice(0, 12) || "—"}
                </td>
                <td className="p-3 font-mono text-xs">
                  {log.ipAddress || "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground p-6 text-center">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
