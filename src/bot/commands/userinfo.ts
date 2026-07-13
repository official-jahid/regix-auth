import type { ChatInputCommandInteraction } from "discord.js";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Get user information")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Username or user ID to look up")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const query = interaction.options.getString("user", true);
    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/users/manage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "find", query }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "User not found" }));
      await interaction.editReply(err.error || "User not found.");
      return;
    }

    const user = await res.json();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`👤 User: ${user.name}`)
      .addFields(
        { name: "ID", value: `\`${user.id}\``, inline: true },
        { name: "Role", value: `\`${user.role}\``, inline: true },
        {
          name: "Blacklisted",
          value: user.isBlacklisted ? "❌ Yes" : "✅ No",
          inline: true,
        },
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Userinfo error:", error);
    await interaction.editReply("Failed to fetch user info.");
  }
}
