import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getUserInfo } from "../utils/api.js";

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Get information about a user")
  .addStringOption((opt) =>
    opt
      .setName("user")
      .setDescription("Username or email of the user")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const identifier = interaction.options.getString("user", true);
    const findType = identifier.includes("@") ? "email" : "username";
    const result = await getUserInfo(identifier, findType);

    if (!result.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const u = result.data.user;
    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info: ${u.username}`)
      .setColor(u.isBlacklisted ? 0xff0000 : 0x00ff00)
      .addFields(
        { name: "Username", value: u.username, inline: true },
        { name: "Email", value: u.email, inline: true },
        { name: "Display Name", value: u.displayName || "None", inline: true },
        { name: "Role", value: u.role, inline: true },
        {
          name: "Status",
          value: u.isBlacklisted ? "❌ Blacklisted" : "✅ Active",
          inline: true,
        },
        {
          name: "Created",
          value: new Date(u.createdAt).toLocaleDateString(),
          inline: true,
        },
      )
      .setTimestamp();

    if (u.discordAccount) {
      embed.addFields({
        name: "Discord",
        value: `ID: ${u.discordAccount.discordId}\nUser: ${u.discordAccount.username}`,
        inline: false,
      });
    }

    if (u.premiumKeys && u.premiumKeys.length > 0) {
      const key = u.premiumKeys[0];
      embed.addFields({
        name: "Premium",
        value:
          key.isLifetime ? "🌟 Lifetime" : (
            `📅 Expires: ${new Date(key.expiresAt).toLocaleDateString()}`
          ),
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("userinfo error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
