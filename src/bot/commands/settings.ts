import type { ChatInputCommandInteraction } from "discord.js";
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { isAdmin } from "../utils/permissions.js";

// ==================== SETTINGS ANTINUKE ====================
export const settingsData = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Manage server security settings")
  .addSubcommand((sub) =>
    sub
      .setName("antinuke")
      .setDescription("Enable/disable/view anti-nuke protection")
      .addStringOption((option) =>
        option
          .setName("action")
          .setDescription("Action to take")
          .setRequired(true)
          .addChoices(
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
            { name: "Status", value: "status" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("antiraid")
      .setDescription("Enable/disable/view anti-raid protection")
      .addStringOption((option) =>
        option
          .setName("action")
          .setDescription("Action to take")
          .setRequired(true)
          .addChoices(
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
            { name: "Status", value: "status" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("antispam")
      .setDescription("Enable/disable/view anti-spam protection")
      .addStringOption((option) =>
        option
          .setName("action")
          .setDescription("Action to take")
          .setRequired(true)
          .addChoices(
            { name: "Enable", value: "enable" },
            { name: "Disable", value: "disable" },
            { name: "Status", value: "status" },
          ),
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function settingsExecute(
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
  const action = interaction.options.getString("action", true);
  const feature =
    subcommand === "antinuke" ? "Anti-Nuke"
    : subcommand === "antiraid" ? "Anti-Raid"
    : "Anti-Spam";

  // In-memory state (per guild)
  const states = new Map<string, Map<string, boolean>>();
  const guildId = interaction.guildId || "global";
  if (!states.has(guildId)) states.set(guildId, new Map());
  const guildStates = states.get(guildId)!;

  if (action === "enable") {
    guildStates.set(subcommand, true);
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`🛡️ ${feature} Enabled`)
      .setDescription(
        `${feature} protection has been **enabled** for this server.`,
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } else if (action === "disable") {
    guildStates.set(subcommand, false);
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`🛡️ ${feature} Disabled`)
      .setDescription(
        `${feature} protection has been **disabled** for this server.`,
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } else {
    const enabled = guildStates.get(subcommand);
    const embed = new EmbedBuilder()
      .setColor(enabled ? 0x00ff00 : 0xff0000)
      .setTitle(`🛡️ ${feature} Status`)
      .setDescription(
        `${feature} protection is currently **${enabled ? "ENABLED" : "DISABLED"}**`,
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
}
