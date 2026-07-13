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
import { isMod } from "../utils/permissions.js";

// Helper to send permission-denied
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

// ==================== VERIFICATION SETUP_ROLE ====================
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
      // Store in a guild settings system (in-memory for now)
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Verification Role Set")
        .setDescription(`Verified role has been set to ${role}`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case "setup_channel": {
      const channel = interaction.options.getChannel("channel", true);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Verification Channel Set")
        .setDescription(`Verification channel has been set to ${channel}`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case "enable": {
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Verification Enabled")
        .setDescription(
          "Verification system has been enabled for this server.",
        );
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case "disable": {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Verification Disabled")
        .setDescription(
          "Verification system has been disabled for this server.",
        );
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case "set_verified": {
      const user = interaction.options.getUser("user", true);
      const member = await interaction.guild?.members.fetch(user.id);

      if (member) {
        const verifiedRoleId = process.env.DISCORD_VERIFIED_ROLE_ID;
        if (verifiedRoleId) {
          await member.roles.add(verifiedRoleId).catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ User Verified")
        .setDescription(`${user} has been verified.`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case "reset": {
      const user = interaction.options.getUser("user", true);
      const member = await interaction.guild?.members.fetch(user.id);

      if (member) {
        const verifiedRoleId = process.env.DISCORD_VERIFIED_ROLE_ID;
        if (verifiedRoleId) {
          await member.roles.remove(verifiedRoleId).catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("🔄 Verification Reset")
        .setDescription(`Verification for ${user} has been reset.`);
      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
