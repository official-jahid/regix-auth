import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getStats } from "../utils/api.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View system statistics");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await getStats();
    if (!result.ok) {
      await interaction.editReply({
        content: "❌ Unable to fetch statistics.",
      });
      return;
    }

    const { users, count } = result.data;
    const totalUsers = count || 0;
    const activeUsers = users.filter((u: any) => u.isActive).length;
    const blacklistedUsers = users.filter((u: any) => u.isBlacklisted).length;
    const admins = users.filter((u: any) => u.role === "ADMIN").length;
    const mods = users.filter((u: any) => u.role === "MOD").length;

    const embed = new EmbedBuilder()
      .setTitle("📊 System Statistics")
      .setColor(0x5865f2)
      .addFields(
        { name: "Total Users", value: `${totalUsers}`, inline: true },
        { name: "Active Users", value: `${activeUsers}`, inline: true },
        { name: "Blacklisted", value: `${blacklistedUsers}`, inline: true },
        { name: "Admins", value: `${admins}`, inline: true },
        { name: "Mods", value: `${mods}`, inline: true },
        {
          name: "Bot Latency",
          value: `${interaction.client.ws.ping}ms`,
          inline: true,
        },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("stats error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
