import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getLicenseInfo } from "../utils/api.js";

export const data = new SlashCommandBuilder()
  .setName("licenseinfo")
  .setDescription("Get information about a license key")
  .addStringOption((opt) =>
    opt.setName("key").setDescription("The license key").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const key = interaction.options.getString("key", true);
    const result = await getLicenseInfo(key);
    if (!result.ok) {
      await interaction.editReply({ content: `❌ License not found: ${key}` });
      return;
    }
    const k = result.data.key;
    const embed = new EmbedBuilder()
      .setTitle("📜 License Information")
      .setColor(k.isActive ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: "License Key", value: `\`${k.key}\``, inline: false },
        {
          name: "Status",
          value: k.isActive ? "✅ Active" : "❌ Inactive",
          inline: true,
        },
        {
          name: "Redeemed",
          value: k.isRedeemed ? "✅ Yes" : "❌ No",
          inline: true,
        },
        {
          name: "Type",
          value: k.isLifetime ? "🌟 Lifetime" : `📅 ${k.duration} days`,
          inline: true,
        },
      )
      .setTimestamp();
    if (k.isRedeemed && k.user)
      embed.addFields({
        name: "Redeemed By",
        value: `${k.user.username} (${k.user.email})`,
        inline: false,
      });
    if (k.expiresAt)
      embed.addFields({
        name: "Expires",
        value: new Date(k.expiresAt).toLocaleDateString(),
        inline: true,
      });
    embed.addFields({
      name: "Created",
      value: new Date(k.createdAt).toLocaleDateString(),
      inline: true,
    });
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("licenseinfo error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
