"use client";

import { useState } from "react";
import type {
  AntiNukeData,
  AntiRaidData,
  AntiSpamData,
  GuildSettingData,
} from "./page";

export default function BotSettingsClient({
  data,
}: {
  data: {
    guilds: GuildSettingData[];
    antiNuke: AntiNukeData[];
    antiRaid: AntiRaidData[];
    antiSpam: AntiSpamData[];
    whitelist: Array<{
      id: string;
      discordId: string;
      addedBy: string;
      reason: string | null;
      createdAt: string;
    }>;
  };
}) {
  const [activeTab, setActiveTab] = useState<
    "guilds" | "antinuke" | "antiraid" | "antispam" | "whitelist"
  >("guilds");

  const tabs = [
    { key: "guilds" as const, label: "Guild Settings" },
    { key: "antinuke" as const, label: "Anti-Nuke" },
    { key: "antiraid" as const, label: "Anti-Raid" },
    { key: "antispam" as const, label: "Anti-Spam" },
    { key: "whitelist" as const, label: "Whitelist" },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Discord Bot Settings</h1>

      <div className="border-border flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ?
                "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "guilds" && (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Guild ID</th>
                <th className="p-3 text-center">Verification</th>
                <th className="p-3 text-center">Anti-Nuke</th>
                <th className="p-3 text-center">Anti-Raid</th>
                <th className="p-3 text-center">Anti-Spam</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {data.guilds.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{g.guildId}</td>
                  <td className="p-3 text-center">
                    {g.verificationEnabled ? "✅" : "❌"}
                  </td>
                  <td className="p-3 text-center">
                    {g.antiNukeEnabled ? "✅" : "❌"}
                  </td>
                  <td className="p-3 text-center">
                    {g.antiRaidEnabled ? "✅" : "❌"}
                  </td>
                  <td className="p-3 text-center">
                    {g.antiSpamEnabled ? "✅" : "❌"}
                  </td>
                </tr>
              ))}
              {data.guilds.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground p-6 text-center">
                    No guilds configured yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "antinuke" && (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Guild</th>
                <th className="p-3 text-center">Ban</th>
                <th className="p-3 text-center">Kick</th>
                <th className="p-3 text-center">ChDel</th>
                <th className="p-3 text-center">ChNew</th>
                <th className="p-3 text-center">RoleNew</th>
                <th className="p-3 text-center">RoleDel</th>
                <th className="p-3 text-center">Webhook</th>
                <th className="p-3 text-center">Punish</th>
                <th className="p-3 text-center">On</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {data.antiNuke.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">
                    {a.guildId.slice(0, 10)}...
                  </td>
                  <td className="p-3 text-center">{a.banLimit}</td>
                  <td className="p-3 text-center">{a.kickLimit}</td>
                  <td className="p-3 text-center">{a.channelDeleteLimit}</td>
                  <td className="p-3 text-center">{a.channelCreateLimit}</td>
                  <td className="p-3 text-center">{a.roleCreateLimit}</td>
                  <td className="p-3 text-center">{a.roleDeleteLimit}</td>
                  <td className="p-3 text-center">{a.webhookLimit}</td>
                  <td className="p-3 text-center capitalize">{a.punishment}</td>
                  <td className="p-3 text-center">{a.enabled ? "✅" : "❌"}</td>
                </tr>
              ))}
              {data.antiNuke.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-muted-foreground p-6 text-center">
                    No anti-nuke configs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "antiraid" && (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Guild</th>
                <th className="p-3 text-center">Join Thr</th>
                <th className="p-3 text-center">Join Win(s)</th>
                <th className="p-3 text-center">Msg Thr</th>
                <th className="p-3 text-center">Msg Win(s)</th>
                <th className="p-3 text-center">Mention</th>
                <th className="p-3 text-center">Punish</th>
                <th className="p-3 text-center">On</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {data.antiRaid.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">
                    {a.guildId.slice(0, 10)}...
                  </td>
                  <td className="p-3 text-center">{a.joinThreshold}</td>
                  <td className="p-3 text-center">{a.joinTimeWindow}</td>
                  <td className="p-3 text-center">{a.messageThreshold}</td>
                  <td className="p-3 text-center">{a.messageTimeWindow}</td>
                  <td className="p-3 text-center">{a.mentionThreshold}</td>
                  <td className="p-3 text-center capitalize">{a.punishment}</td>
                  <td className="p-3 text-center">{a.enabled ? "✅" : "❌"}</td>
                </tr>
              ))}
              {data.antiRaid.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-muted-foreground p-6 text-center">
                    No anti-raid configs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "antispam" && (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Guild</th>
                <th className="p-3 text-center">Msg Limit</th>
                <th className="p-3 text-center">Time(s)</th>
                <th className="p-3 text-center">Dup Limit</th>
                <th className="p-3 text-center">Punish</th>
                <th className="p-3 text-center">On</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {data.antiSpam.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">
                    {a.guildId.slice(0, 10)}...
                  </td>
                  <td className="p-3 text-center">{a.messageLimit}</td>
                  <td className="p-3 text-center">{a.timeWindow}</td>
                  <td className="p-3 text-center">{a.duplicateLimit}</td>
                  <td className="p-3 text-center capitalize">{a.punishment}</td>
                  <td className="p-3 text-center">{a.enabled ? "✅" : "❌"}</td>
                </tr>
              ))}
              {data.antiSpam.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground p-6 text-center">
                    No anti-spam configs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "whitelist" && (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Discord ID</th>
                <th className="p-3 text-left">Added By</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {data.whitelist.map((w) => (
                <tr
                  key={w.id}
                  className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{w.discordId}</td>
                  <td className="p-3 text-xs">{w.addedBy}</td>
                  <td className="p-3 text-xs">{w.reason || "—"}</td>
                  <td className="p-3 text-xs">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data.whitelist.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground p-6 text-center">
                    No whitelisted users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
