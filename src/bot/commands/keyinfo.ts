import type { ChatInputCommandInteraction } from "discord.js";
import {
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("keyinfo")
  .setDescription("Get license key info")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("key")
      .setDescription("License key to look up")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const key = interaction.options.getString("key", true).toUpperCase();
    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/keys/info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ key }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Key not found" }));
      await interaction.editReply(err.error || "Key not found.");
      return;
    }

    const data = await res.json();
    const embed = new EmbedBuilder()
      .setColor(data.isActive ? 0x00ff00 : 0xff0000)
      .setTitle("🔑 License Key Info")
      .addFields(
        { name: "Key", value: `\`${data.key}\``, inline: false },
        {
          name: "Active",
          value: data.isActive ? "✅ Yes" : "❌ No",
          inline: true,
        },
        {
          name: "Lifetime",
          value: data.isLifetime ? "♾️ Yes" : "📅 No",
          inline: true,
        },
        {
          name: "Status",
          value: `\`${data.status || "active"}\``,
          inline: true,
        },
        { name: "User", value: data.user?.name || "Unassigned", inline: true },
        {
          name: "Expires",
          value:
            data.expiresAt ?
              new Date(data.expiresAt).toLocaleString()
            : "Never",
          inline: true,
        },
      )
      .setFooter({ text: "Regix Auth Bot" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Keyinfo error:", error);
    await interaction.editReply("Failed to fetch key info.");
  }
}
