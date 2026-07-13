"use client";

import { useState } from "react";
import type { KeyData } from "./page";

export default function AdminKeysClient({
  keys: initialKeys,
}: {
  keys: KeyData[];
}) {
  const [keys, setKeys] = useState(initialKeys);

  async function toggleKeyStatus(keyId: string, action: "revoke" | "activate") {
    const res = await fetch("/api/admin/keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, action }),
    });
    if (res.ok) {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ?
            {
              ...k,
              isActive: action === "activate",
              status: action === "activate" ? "active" : "revoked",
            }
          : k,
        ),
      );
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Premium Key Management</h1>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Key</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Duration</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Expires</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {keys.map((key) => (
              <tr
                key={key.id}
                className="hover:bg-muted/50">
                <td className="p-3 font-mono text-xs">{key.key}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      key.isActive ?
                        "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    }`}>
                    {key.status}
                  </span>
                </td>
                <td className="p-3">
                  {key.isLifetime ? "Lifetime" : `${key.duration} days`}
                </td>
                <td className="p-3">{key.user?.name || "—"}</td>
                <td className="p-3">
                  {key.isLifetime ?
                    "Never"
                  : key.expiresAt ?
                    new Date(key.expiresAt).toLocaleDateString()
                  : "—"}
                </td>
                <td className="p-3">
                  {key.isActive ?
                    <button
                      onClick={() => toggleKeyStatus(key.id, "revoke")}
                      className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30">
                      Revoke
                    </button>
                  : <button
                      onClick={() => toggleKeyStatus(key.id, "activate")}
                      className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400 hover:bg-green-500/30">
                      Activate
                    </button>
                  }
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground p-6 text-center">
                  No keys found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
