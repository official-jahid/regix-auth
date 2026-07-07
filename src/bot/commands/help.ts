import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { isAdminOrMod } from "../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all available bot commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const member = interaction.member as
      import("discord.js").GuildMember | null;
    const isStaff = isAdminOrMod(member);

    const embed = new EmbedBuilder()
      .setTitle("🤖 REGIX Bot Commands")
      .setColor(0x5865f2)
      .setDescription("Here are all available commands. Use them responsibly!")
      .setFooter({
        text: "REGIX Auth System • Make sure Security has the highest role",
      })
      .setTimestamp();

    if (isStaff) {
      embed.addFields({
        name: "🔒 Admin/Mod Commands",
        value:
          "`/genkey` - Generate premium license keys\n" +
          "`/genuser` - Create a new user account\n" +
          "`/genlicense` - Generate premium license keys (batch)\n" +
          "`/blacklist` - Blacklist a user\n" +
          "`/unblacklist` - Unblacklist a user\n" +
          "`/whitelist` - Add a user to the whitelist\n" +
          "`/unwhitelist` - Remove a user from the whitelist\n" +
          "`/reset` - Reset a user's sessions\n" +
          "`/resetpassword` - Reset a user's password\n" +
          "`/resetusername` - Reset a user's username",
        inline: false,
      });
    }

    embed.addFields({
      name: "👥 Everyone Commands",
      value:
        "`/userinfo` - Get information about a user\n" +
        "`/keyinfo` - Get information about a license key\n" +
        "`/licenseinfo` - Get information about a license key\n" +
        "`/stats` - View system statistics\n" +
        "`/help` - Show this help message",
      inline: false,
    });

    if (isStaff) {
      embed.addFields({
        name: "⚙️ Verification Setup",
        value:
          "`/verification enable` - Enable verification\n" +
          "`/verification setup_role` - Create unverified role\n" +
          "`/verification setup_channel` - Create verification channel\n" +
          "`/verification type` - Select the verification type\n" +
          "`/verification set_verified` - Set a verified role\n" +
          "`/verification disable` - Disable verification\n" +
          "`/verification reset` - Reset verification",
        inline: false,
      });

      embed.addFields({
        name: "🛡️ Anti Nuke & Security",
        value:
          "`/settings anti nuke` - Check anti nuke settings\n" +
          "`/setlimit` - Set action limits\n" +
          "`/setpunishment` - Set punishments\n" +
          "`/enable` - Enable actions\n" +
          "`/disable` - Disable actions\n\n" +
          "⚠️ **Dangerous Actions Protected:** Banning, Kicking, Role/Channel Management, " +
          "Bot Adding, Dangerous Permissions, Admin Roles, Pruning, Invite Links\n\n" +
          "🔒 **Make sure Security has the highest role** to secure your server.",
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("help error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
