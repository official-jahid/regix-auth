import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { generateKeys } from "../utils/api.js";
import { requireAdmin } from "../utils/permissions.js";

export const data = new SlashCommandBuilder()
  .setName("genkey")
  .setDescription("[Admin] Generate premium license keys")
  .addIntegerOption((opt) =>
    opt
      .setName("count")
      .setDescription("Number of keys to generate (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duration")
      .setDescription("Duration in days (default: 30, 0 = lifetime)")
      .setRequired(false),
  )
  .addBooleanOption((opt) =>
    opt
      .setName("lifetime")
      .setDescription("Generate lifetime keys")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;

  const count = interaction.options.getInteger("count", true);
  const duration = interaction.options.getInteger("duration") ?? 30;
  const isLifetime = interaction.options.getBoolean("lifetime") ?? false;

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await generateKeys(count, duration, isLifetime);

    if (!result.ok) {
      await interaction.editReply({
        content: `❌ Failed: ${result.data.error || "Unknown error"}`,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🔑 Keys Generated")
      .setColor(0x00ff00)
      .setDescription(
        `Generated **${result.data.count}** key(s)\nType: ${isLifetime ? "🌟 Lifetime" : `📅 ${duration} days`}`,
      )
      .addFields(
        ...result.data.keys.map((k: string, i: number) => ({
          name: `Key #${i + 1}`,
          value: `\`${k}\``,
          inline: false,
        })),
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("genkey error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
