import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View system statistics");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/admin/stats`,
      {
        headers: { Authorization: `Bearer ${process.env.SECRET_KEY}` },
      },
    );

    if (!res.ok) {
      await interaction.editReply("Failed to fetch statistics.");
      return;
    }

    const data = await res.json();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📊 System Statistics")
      .addFields(
        {
          name: "👥 Total Users",
          value: `\`${data.totalUsers || "N/A"}\``,
          inline: true,
        },
        {
          name: "🔑 Total Keys",
          value: `\`${data.totalKeys || "N/A"}\``,
          inline: true,
        },
        {
          name: "✅ Active Keys",
          value: `\`${data.activeKeys || "N/A"}\``,
          inline: true,
        },
        {
          name: "🔄 Redeemed Keys",
          value: `\`${data.redeemedKeys || "N/A"}\``,
          inline: true,
        },
        {
          name: "♾️ Lifetime Keys",
          value: `\`${data.lifetimeKeys || "N/A"}\``,
          inline: true,
        },
        {
          name: "🖥️ Total Sessions",
          value: `\`${data.totalSessions || "N/A"}\``,
          inline: true,
        },
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Stats error:", error);
    await interaction.editReply("Failed to fetch statistics.");
  }
}
