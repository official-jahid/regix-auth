import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

export const data = new SlashCommandBuilder()
  .setName("auth")
  .setDescription("Regix Auth System commands")
  .addSubcommand((sub) =>
    sub
      .setName("link")
      .setDescription("Link your Discord account to Regix Auth")
      .addStringOption((opt) =>
        opt
          .setName("email")
          .setDescription("Your Regix Auth email")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("Check your account status"),
  )
  .addSubcommand((sub) =>
    sub.setName("premium").setDescription("Check your premium status"),
  );

export async function execute(interaction: CommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "link":
      await handleLink(interaction);
      break;
    case "status":
      await handleStatus(interaction);
      break;
    case "premium":
      await handlePremium(interaction);
      break;
  }
}

async function handleLink(interaction: CommandInteraction) {
  const email = interaction.options.get("email")?.value as string;

  await interaction.reply({
    content: `🔗 To link your Discord account, visit the dashboard and use the Discord OAuth option:\n${API_BASE}/auth\n\nYour Discord ID: \`${interaction.user.id}\``,
    ephemeral: true,
  });
}

async function handleStatus(interaction: CommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const res = await fetch(`${API_BASE}/api/auth/session`);
    if (!res.ok) {
      await interaction.editReply({
        content: "❌ Unable to fetch account status. Are you logged in?",
      });
      return;
    }

    const data = await res.json();

    const embed = new EmbedBuilder()
      .setTitle("Account Status")
      .setColor(data.user?.isBlacklisted ? 0xff0000 : 0x00ff00)
      .addFields(
        {
          name: "Username",
          value: data.user?.username || "Unknown",
          inline: true,
        },
        {
          name: "Role",
          value: data.user?.role || "Unknown",
          inline: true,
        },
        {
          name: "Status",
          value: data.user?.isBlacklisted ? "❌ Blacklisted" : "✅ Active",
          inline: true,
        },
        {
          name: "Premium",
          value:
            data.premium?.isLifetime ? "Lifetime"
            : data.premium?.expiresAt ?
              `Expires: ${new Date(data.premium.expiresAt).toLocaleDateString()}`
            : "None",
          inline: true,
        },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({
      content: "❌ Error fetching account status.",
    });
  }
}

async function handlePremium(interaction: CommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const res = await fetch(`${API_BASE}/api/auth/session`);
    if (!res.ok) {
      await interaction.editReply({
        content: "❌ Unable to fetch premium status.",
      });
      return;
    }

    const data = await res.json();

    if (!data.premium) {
      const embed = new EmbedBuilder()
        .setTitle("Premium Status")
        .setColor(0xffa500)
        .setDescription("You don't have an active premium subscription.")
        .addFields({
          name: "Get Premium",
          value: `Visit ${API_BASE}/dashboard to redeem a license key.`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Premium Status")
      .setColor(0xffd700)
      .addFields(
        {
          name: "Key",
          value: `\`${data.premium.key}\``,
        },
        {
          name: "Type",
          value: data.premium.isLifetime ? "🌟 Lifetime" : "📅 Subscription",
          inline: true,
        },
        {
          name: "Expires",
          value:
            data.premium.expiresAt ?
              new Date(data.premium.expiresAt).toLocaleDateString()
            : "Never (Lifetime)",
          inline: true,
        },
        {
          name: "IP Locked",
          value: data.premium.isIpLocked ? "Yes" : "No",
          inline: true,
        },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({
      content: "❌ Error fetching premium status.",
    });
  }
}
