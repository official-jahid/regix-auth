import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { isAdmin, isMod } from "../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show the help menu with all available commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const isAdminUser = member ? await isAdmin(member) : false;
  const isModUser = member ? await isMod(member) : false;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🤖 Regix Auth Bot - Help")
    .setDescription("Here are all available commands")
    .addFields(
      {
        name: "📋 General Commands",
        value: [
          "`/help` - Show this help menu",
          "`/stats` - View system statistics",
          "`/userinfo [user]` - Get user information",
          "`/keyinfo [key]` - Get license key info",
          "`/licenseinfo [key]` - Get license key info (alias)",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🛡️ Admin / Mod Commands",
        value: [
          "`/genuser` - Create user account",
          "`/genkey` - Generate license keys",
          "`/genlicense` - Generate license keys (alias)",
          "`/blacklist` - Blacklist user",
          "`/unblacklist` - Unblacklist user",
          "`/whitelist` - Add to whitelist",
          "`/unwhitelist` - Remove from whitelist",
          "`/reset` - Reset user sessions",
          "`/resetpassword` - Reset user password",
          "`/resetusername` - Reset user username",
        ].join("\n"),
        inline: false,
      },
    );

  // Add mod-only section if user has mod permissions
  if (isModUser) {
    embed.addFields({
      name: "⚙️ Moderation Commands",
      value: [
        "`/verification setup_role` - Set verified role",
        "`/verification setup_channel` - Set verification channel",
        "`/verification enable` - Enable verification",
        "`/verification disable` - Disable verification",
        "`/verification set_verified` - Manually verify a user",
        "`/verification reset` - Reset verification for a user",
      ].join("\n"),
      inline: false,
    });
  }

  // Add admin-only section
  if (isAdminUser) {
    embed.addFields({
      name: "🔧 Settings Commands",
      value: [
        "`/settings antinuke` - Enable/disable/view anti-nuke",
        "`/settings antiraid` - Enable/disable/view anti-raid",
        "`/settings antispam` - Enable/disable/view anti-spam",
      ].join("\n"),
      inline: false,
    });
  }

  embed.setFooter({
    text: "Regix Auth Bot",
    iconURL: interaction.client.user?.displayAvatarURL(),
  });
  embed.setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
