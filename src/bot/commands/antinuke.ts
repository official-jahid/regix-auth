import type { ChatInputCommandInteraction } from "discord.js";
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
} from "discord.js";
import { serverEnv } from "../../lib/env/serverEnv.js";
import { isAdmin } from "../utils/permissions.js";

async function callBotApi(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const res = await fetch(
    `${serverEnv.BETTER_AUTH_URL || "http://localhost:3000"}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverEnv.SECRET_KEY}`,
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, error: data?.error };
}

export const antinukeData = new SlashCommandBuilder()
  .setName("antinuke")
  .setDescription("Manage anti-nuke protection")
  .addSubcommand((sub) =>
    sub.setName("enable").setDescription("Enable anti-nuke protection"),
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable anti-nuke protection"),
  )
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("View anti-nuke status and config"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function antinukeExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  if (subcommand === "enable") {
    const { ok, error } = await callBotApi("/api/bot/settings/modify", {
      guildId,
      setting: "antiNukeEnabled",
      value: true,
    });
    if (!ok) {
      await interaction.editReply(error || "Failed to enable anti-nuke.");
      return;
    }
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("🛡️ Anti-Nuke Enabled")
          .setDescription("Anti-nuke protection is now active for this server.")
          .setFooter({ text: "Regix Auth Bot" }),
      ],
    });
  } else if (subcommand === "disable") {
    const { ok, error } = await callBotApi("/api/bot/settings/modify", {
      guildId,
      setting: "antiNukeEnabled",
      value: false,
    });
    if (!ok) {
      await interaction.editReply(error || "Failed to disable anti-nuke.");
      return;
    }
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🛡️ Anti-Nuke Disabled")
          .setDescription(
            "Anti-nuke protection has been disabled for this server.",
          )
          .setFooter({ text: "Regix Auth Bot" }),
      ],
    });
  } else {
    const { ok, data } = await callBotApi("/api/bot/settings/get", { guildId });
    if (!ok || !data?.antiNuke) {
      await interaction.editReply("Failed to load anti-nuke config.");
      return;
    }
    const cfg = data.antiNuke;
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.enabled ? 0x00ff00 : 0xff0000)
          .setTitle("🛡️ Anti-Nuke Configuration")
          .addFields(
            {
              name: "Status",
              value: cfg.enabled ? "✅ Enabled" : "❌ Disabled",
              inline: true,
            },
            {
              name: "Ban Limit",
              value: `${cfg.banLimit}`,
              inline: true,
            },
            {
              name: "Kick Limit",
              value: `${cfg.kickLimit}`,
              inline: true,
            },
            {
              name: "Channel Delete Limit",
              value: `${cfg.channelDeleteLimit}`,
              inline: true,
            },
            {
              name: "Channel Create Limit",
              value: `${cfg.channelCreateLimit}`,
              inline: true,
            },
            {
              name: "Role Create Limit",
              value: `${cfg.roleCreateLimit}`,
              inline: true,
            },
            {
              name: "Role Delete Limit",
              value: `${cfg.roleDeleteLimit}`,
              inline: true,
            },
            {
              name: "Webhook Limit",
              value: `${cfg.webhookLimit}`,
              inline: true,
            },
            {
              name: "Punishment",
              value: cfg.punishment || "ban",
              inline: true,
            },
          )
          .setFooter({ text: "Regix Auth Bot" }),
      ],
    });
  }
}

// /setlimit command
export const setlimitData = new SlashCommandBuilder()
  .setName("setlimit")
  .setDescription("Set anti-nuke limits")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("type")
      .setDescription("Type of limit to set")
      .setRequired(true)
      .addChoices(
        { name: "Ban Limit", value: "banLimit" },
        { name: "Kick Limit", value: "kickLimit" },
        { name: "Channel Delete Limit", value: "channelDeleteLimit" },
        { name: "Channel Create Limit", value: "channelCreateLimit" },
        { name: "Role Create Limit", value: "roleCreateLimit" },
        { name: "Role Delete Limit", value: "roleDeleteLimit" },
        { name: "Webhook Limit", value: "webhookLimit" },
      ),
  )
  .addIntegerOption((option: SlashCommandIntegerOption) =>
    option
      .setName("value")
      .setDescription("Limit value (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function setlimitExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const limitType = interaction.options.getString("type", true);
  const value = interaction.options.getInteger("value", true);
  const guildId = interaction.guildId!;

  const { ok, error } = await callBotApi("/api/bot/settings/setlimit", {
    guildId,
    type: limitType,
    value,
  });

  if (!ok) {
    await interaction.editReply(error || "Failed to set limit.");
    return;
  }

  const labels: Record<string, string> = {
    banLimit: "Ban Limit",
    kickLimit: "Kick Limit",
    channelDeleteLimit: "Channel Delete Limit",
    channelCreateLimit: "Channel Create Limit",
    roleCreateLimit: "Role Create Limit",
    roleDeleteLimit: "Role Delete Limit",
    webhookLimit: "Webhook Limit",
  };

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Limit Updated")
        .setDescription(`${labels[limitType]} has been set to **${value}**`),
    ],
  });
}

// /setpunishment command
export const setpunishmentData = new SlashCommandBuilder()
  .setName("setpunishment")
  .setDescription("Set punishment action for anti-nuke/anti-raid/anti-spam")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("module")
      .setDescription("Protection module")
      .setRequired(true)
      .addChoices(
        { name: "Anti-Nuke", value: "antiNuke" },
        { name: "Anti-Raid", value: "antiRaid" },
        { name: "Anti-Spam", value: "antiSpam" },
      ),
  )
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("action")
      .setDescription("Punishment action")
      .setRequired(true)
      .addChoices(
        { name: "Ban", value: "ban" },
        { name: "Kick", value: "kick" },
        { name: "Mute (timeout)", value: "mute" },
        { name: "Role Remove", value: "role-remove" },
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function setpunishmentExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const module = interaction.options.getString("module", true);
  const action = interaction.options.getString("action", true);
  const guildId = interaction.guildId!;

  const { ok, error } = await callBotApi("/api/bot/settings/setpunishment", {
    guildId,
    module,
    action,
  });

  if (!ok) {
    await interaction.editReply(error || "Failed to set punishment.");
    return;
  }

  const names: Record<string, string> = {
    antiNuke: "Anti-Nuke",
    antiRaid: "Anti-Raid",
    antiSpam: "Anti-Spam",
  };

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Punishment Updated")
        .setDescription(`${names[module]} punishment set to **${action}**`),
    ],
  });
}
