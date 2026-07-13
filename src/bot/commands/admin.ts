import type { ChatInputCommandInteraction } from "discord.js";
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from "discord.js";
import { isAdmin, isMod } from "../utils/permissions.js";

// ==================== GENKEY ====================
export const genkeyData = new SlashCommandBuilder()
  .setName("genkey")
  .setDescription("Generate license keys")
  .addIntegerOption((option: SlashCommandIntegerOption) =>
    option
      .setName("count")
      .setDescription("Number of keys (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addIntegerOption((option: SlashCommandIntegerOption) =>
    option
      .setName("duration")
      .setDescription("Duration in days")
      .setRequired(true)
      .setMinValue(1),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function genkeyExecute(interaction: ChatInputCommandInteraction) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const count = interaction.options.getInteger("count", true);
    const duration = interaction.options.getInteger("duration", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/admin/keys`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ count, duration, lifetime: false }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to generate keys.");
      return;
    }

    const data = await res.json();
    const keysList = data.keys.map((k: any) => `\`${k.key}\``).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("🔑 Keys Generated")
      .setDescription(`Generated **${data.count}** keys (${duration} days)`)
      .addFields({ name: "Keys", value: keysList.substring(0, 1024) });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Genkey error:", error);
    await interaction.editReply("Failed to generate keys.");
  }
}

// ==================== GENLICENSE ====================
export const genlicenseData = new SlashCommandBuilder()
  .setName("genlicense")
  .setDescription("Generate license keys (alias for genkey)")
  .addIntegerOption((option: SlashCommandIntegerOption) =>
    option
      .setName("count")
      .setDescription("Number of keys (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addIntegerOption((option: SlashCommandIntegerOption) =>
    option
      .setName("duration")
      .setDescription("Duration in days")
      .setRequired(true)
      .setMinValue(1),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const genlicenseExecute = genkeyExecute;

// ==================== GENUSER ====================
export const genuserData = new SlashCommandBuilder()
  .setName("genuser")
  .setDescription("Create a user account")
  .addStringOption((option: SlashCommandStringOption) =>
    option.setName("username").setDescription("Username").setRequired(true),
  )
  .addStringOption((option: SlashCommandStringOption) =>
    option.setName("password").setDescription("Password").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function genuserExecute(interaction: ChatInputCommandInteraction) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const username = interaction.options.getString("username", true);
    const password = interaction.options.getString("password", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/users/manage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "create", username, password }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to create user.");
      return;
    }

    const data = await res.json();
    await interaction.editReply(
      `✅ User **${username}** created successfully! ID: \`${data.id}\``,
    );
  } catch (error) {
    console.error("Genuser error:", error);
    await interaction.editReply("Failed to create user.");
  }
}

// ==================== BLACKLIST ====================
export const blacklistData = new SlashCommandBuilder()
  .setName("blacklist")
  .setDescription("Blacklist a user")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Username or user ID")
      .setRequired(true),
  )
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("reason")
      .setDescription("Reason for blacklist")
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function blacklistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isMod(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const query = interaction.options.getString("user", true);
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/users/manage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "blacklist", query, reason }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to blacklist user.");
      return;
    }

    await interaction.editReply(
      `✅ User **${query}** has been blacklisted.\nReason: ${reason}`,
    );
  } catch (error) {
    console.error("Blacklist error:", error);
    await interaction.editReply("Failed to blacklist user.");
  }
}

// ==================== UNBLACKLIST ====================
export const unblacklistData = new SlashCommandBuilder()
  .setName("unblacklist")
  .setDescription("Unblacklist a user")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Username or user ID")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function unblacklistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isMod(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

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
        body: JSON.stringify({ action: "unblacklist", query }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to unblacklist user.");
      return;
    }

    await interaction.editReply(`✅ User **${query}** has been unblacklisted.`);
  } catch (error) {
    console.error("Unblacklist error:", error);
    await interaction.editReply("Failed to unblacklist user.");
  }
}

// ==================== WHITELIST ====================
export const whitelistData = new SlashCommandBuilder()
  .setName("whitelist")
  .setDescription("Add a user to whitelist")
  .addUserOption((option: SlashCommandUserOption) =>
    option.setName("user").setDescription("Discord user").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function whitelistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isMod(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const user = interaction.options.getUser("user", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/whitelist/modify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "add", userId: user.id }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to whitelist user.");
      return;
    }

    await interaction.editReply(`✅ ${user} has been whitelisted.`);
  } catch (error) {
    console.error("Whitelist error:", error);
    await interaction.editReply("Failed to whitelist user.");
  }
}

// ==================== UNWHITELIST ====================
export const unwhitelistData = new SlashCommandBuilder()
  .setName("unwhitelist")
  .setDescription("Remove a user from whitelist")
  .addUserOption((option: SlashCommandUserOption) =>
    option.setName("user").setDescription("Discord user").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function unwhitelistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await isMod(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const user = interaction.options.getUser("user", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/whitelist/modify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "remove", userId: user.id }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to unwhitelist user.");
      return;
    }

    await interaction.editReply(`✅ ${user} has been removed from whitelist.`);
  } catch (error) {
    console.error("Unwhitelist error:", error);
    await interaction.editReply("Failed to unwhitelist user.");
  }
}

// ==================== RESET ====================
export const resetData = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Reset user sessions")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Username or user ID")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function resetExecute(interaction: ChatInputCommandInteraction) {
  if (!(await isAdmin(interaction.member as any))) {
    await interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

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
        body: JSON.stringify({ action: "reset", query }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to reset sessions.");
      return;
    }

    await interaction.editReply(
      `✅ Sessions for **${query}** have been reset.`,
    );
  } catch (error) {
    console.error("Reset error:", error);
    await interaction.editReply("Failed to reset sessions.");
  }
}

// ==================== RESETPASSWORD ====================
export const resetpasswordData = new SlashCommandBuilder()
  .setName("resetpassword")
  .setDescription("Reset user password")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Username or user ID")
      .setRequired(true),
  )
  .addStringOption((option: SlashCommandStringOption) =>
    option.setName("password").setDescription("New password").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function resetpasswordExecute(
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

  try {
    const query = interaction.options.getString("user", true);
    const password = interaction.options.getString("password", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/users/manage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({
          action: "resetPassword",
          query,
          newPassword: password,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to reset password.");
      return;
    }

    await interaction.editReply(`✅ Password for **${query}** has been reset.`);
  } catch (error) {
    console.error("Resetpassword error:", error);
    await interaction.editReply("Failed to reset password.");
  }
}

// ==================== RESETUSERNAME ====================
export const resetusernameData = new SlashCommandBuilder()
  .setName("resetusername")
  .setDescription("Reset user username")
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("user")
      .setDescription("Current username or user ID")
      .setRequired(true),
  )
  .addStringOption((option: SlashCommandStringOption) =>
    option
      .setName("newusername")
      .setDescription("New username")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function resetusernameExecute(
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

  try {
    const query = interaction.options.getString("user", true);
    const newUsername = interaction.options.getString("newusername", true);

    const res = await fetch(
      `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/bot/users/manage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`,
        },
        body: JSON.stringify({ action: "resetUsername", query, newUsername }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      await interaction.editReply(err.error || "Failed to reset username.");
      return;
    }

    await interaction.editReply(
      `✅ Username for **${query}** has been changed to **${newUsername}**.`,
    );
  } catch (error) {
    console.error("Resetusername error:", error);
    await interaction.editReply("Failed to reset username.");
  }
}
