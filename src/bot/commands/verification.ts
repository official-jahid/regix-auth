import type { ChatInputCommandInteraction } from "discord.js";
import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandRoleOption,
  SlashCommandUserOption,
} from "discord.js";
import { serverEnv } from "../../lib/env/serverEnv.js";
import { isMod } from "../utils/permissions.js";

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

async function requireMod(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (!(await isMod(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}

export const verificationData = new SlashCommandBuilder()
  .setName("verification")
  .setDescription("Manage verification system")
  .addSubcommand((sub) =>
    sub
      .setName("setup_role")
      .setDescription("Set the verified role")
      .addRoleOption((option: SlashCommandRoleOption) =>
        option
          .setName("role")
          .setDescription("Role to assign on verification")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("setup_channel")
      .setDescription("Set the verification channel")
      .addChannelOption((option: SlashCommandChannelOption) =>
        option
          .setName("channel")
          .setDescription("Channel for verification")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("enable").setDescription("Enable verification system"),
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable verification system"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("set_verified")
      .setDescription("Manually verify a user")
      .addUserOption((option: SlashCommandUserOption) =>
        option
          .setName("user")
          .setDescription("User to verify")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("reset")
      .setDescription("Reset verification for a user")
      .addUserOption((option: SlashCommandUserOption) =>
        option
          .setName("user")
          .setDescription("User to reset")
          .setRequired(true),
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function verificationExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireMod(interaction))) return;
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "setup_role": {
      const role = interaction.options.getRole("role", true);
      await callBotApi("/api/bot/settings/modify", {
        guildId: interaction.guildId!,
        setting: "verifiedRoleId",
        value: role.id,
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("✅ Verification Role Set")
            .setDescription(`Verified role has been set to ${role}`),
        ],
      });
      break;
    }

    case "setup_channel": {
      const channel = interaction.options.getChannel("channel", true);
      await callBotApi("/api/bot/settings/modify", {
        guildId: interaction.guildId!,
        setting: "verificationChannelId",
        value: channel.id,
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("✅ Verification Channel Set")
            .setDescription(`Verification channel has been set to ${channel}`),
        ],
      });
      break;
    }

    case "enable": {
      await callBotApi("/api/bot/settings/modify", {
        guildId: interaction.guildId!,
        setting: "verificationEnabled",
        value: true,
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("✅ Verification Enabled")
            .setDescription(
              "Verification system has been enabled for this server.",
            ),
        ],
      });
      break;
    }

    case "disable": {
      await callBotApi("/api/bot/settings/modify", {
        guildId: interaction.guildId!,
        setting: "verificationEnabled",
        value: false,
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("❌ Verification Disabled")
            .setDescription(
              "Verification system has been disabled for this server.",
            ),
        ],
      });
      break;
    }

    case "set_verified": {
      const user = interaction.options.getUser("user", true);
      const member = await interaction.guild?.members.fetch(user.id);

      const { data: settings } = await callBotApi("/api/bot/settings/get", {
        guildId: interaction.guildId!,
      });

      const verifiedRoleId = settings?.settings?.verifiedRoleId;
      if (member && verifiedRoleId) {
        await member.roles.add(verifiedRoleId).catch(() => {});
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("✅ User Verified")
            .setDescription(`${user} has been verified.`),
        ],
      });
      break;
    }

    case "reset": {
      const user = interaction.options.getUser("user", true);
      const member = await interaction.guild?.members.fetch(user.id);

      const { data: settings } = await callBotApi("/api/bot/settings/get", {
        guildId: interaction.guildId!,
      });

      const verifiedRoleId = settings?.settings?.verifiedRoleId;
      if (member && verifiedRoleId) {
        await member.roles.remove(verifiedRoleId).catch(() => {});
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("🔄 Verification Reset")
            .setDescription(`Verification for ${user} has been reset.`),
        ],
      });
      break;
    }
  }
}
