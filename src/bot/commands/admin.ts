import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  addToWhitelist,
  generateKeys,
  getUserInfo,
  manageUser,
  removeFromWhitelist,
} from "../utils/api.js";
import { requireAdmin, requireAdminOrMod } from "../utils/permissions.js";

// ============================================================
// /genuser
// ============================================================
export const genuserData = new SlashCommandBuilder()
  .setName("genuser")
  .setDescription("[Admin] Create a new user account")
  .addStringOption((opt) =>
    opt.setName("email").setDescription("User email").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("username").setDescription("Username").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("password").setDescription("Password").setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName("role")
      .setDescription("Role")
      .setRequired(false)
      .addChoices(
        { name: "User", value: "USER" },
        { name: "Mod", value: "MOD" },
        { name: "Admin", value: "ADMIN" },
      ),
  );

export async function genuserExecute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;

  const email = interaction.options.getString("email", true);
  const username = interaction.options.getString("username", true);
  const password = interaction.options.getString("password", true);
  const role = interaction.options.getString("role") || "USER";

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await manageUser("create", {
      email,
      username,
      password,
      role,
    });

    if (!result.ok) {
      await interaction.editReply({
        content: `❌ ${result.data.error || "Failed to create user"}`,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ User Created")
      .setColor(0x00ff00)
      .addFields(
        { name: "Username", value: result.data.user.username, inline: true },
        { name: "Email", value: result.data.user.email, inline: true },
        { name: "Role", value: result.data.user.role, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("genuser error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /blacklist
// ============================================================
export const blacklistData = new SlashCommandBuilder()
  .setName("blacklist")
  .setDescription("[Admin/Mod] Blacklist a user")
  .addStringOption((opt) =>
    opt.setName("user").setDescription("Username or email").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason").setRequired(false),
  );

export async function blacklistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireAdminOrMod(interaction))) return;

  const identifier = interaction.options.getString("user", true);
  const reason = interaction.options.getString("reason") || "";

  await interaction.deferReply({ ephemeral: true });

  try {
    const findType = identifier.includes("@") ? "email" : "username";
    const userResult = await getUserInfo(identifier, findType);

    if (!userResult.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const result = await manageUser("blacklist", {
      userId: userResult.data.user.id,
      reason,
    });

    if (!result.ok) {
      await interaction.editReply({ content: `❌ ${result.data.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("⛔ User Blacklisted")
      .setColor(0xff0000)
      .setDescription(result.data.message)
      .addFields(
        { name: "User", value: identifier, inline: true },
        { name: "Reason", value: reason || "No reason provided", inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("blacklist error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /unblacklist
// ============================================================
export const unblacklistData = new SlashCommandBuilder()
  .setName("unblacklist")
  .setDescription("[Admin/Mod] Unblacklist a user")
  .addStringOption((opt) =>
    opt.setName("user").setDescription("Username or email").setRequired(true),
  );

export async function unblacklistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireAdminOrMod(interaction))) return;

  const identifier = interaction.options.getString("user", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const findType = identifier.includes("@") ? "email" : "username";
    const userResult = await getUserInfo(identifier, findType);

    if (!userResult.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const result = await manageUser("unblacklist", {
      userId: userResult.data.user.id,
    });

    if (!result.ok) {
      await interaction.editReply({ content: `❌ ${result.data.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ User Unblacklisted")
      .setColor(0x00ff00)
      .setDescription(result.data.message)
      .addFields({ name: "User", value: identifier, inline: true })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("unblacklist error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /whitelist
// ============================================================
export const whitelistData = new SlashCommandBuilder()
  .setName("whitelist")
  .setDescription("[Admin/Mod] Add a user to the whitelist")
  .addStringOption((opt) =>
    opt.setName("user").setDescription("Username or email").setRequired(true),
  );

export async function whitelistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireAdminOrMod(interaction))) return;

  const identifier = interaction.options.getString("user", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const findType = identifier.includes("@") ? "email" : "username";
    const userResult = await getUserInfo(identifier, findType);

    if (!userResult.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const result = await addToWhitelist(userResult.data.user.id);

    if (!result.ok) {
      await interaction.editReply({ content: `❌ ${result.data.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ User Whitelisted")
      .setColor(0x00ff00)
      .setDescription(result.data.message)
      .addFields({ name: "User", value: identifier, inline: true })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("whitelist error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /unwhitelist
// ============================================================
export const unwhitelistData = new SlashCommandBuilder()
  .setName("unwhitelist")
  .setDescription("[Admin/Mod] Remove a user from the whitelist")
  .addStringOption((opt) =>
    opt.setName("user").setDescription("Username or email").setRequired(true),
  );

export async function unwhitelistExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireAdminOrMod(interaction))) return;

  const identifier = interaction.options.getString("user", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const findType = identifier.includes("@") ? "email" : "username";
    const userResult = await getUserInfo(identifier, findType);

    if (!userResult.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const result = await removeFromWhitelist(userResult.data.user.id);

    if (!result.ok) {
      await interaction.editReply({ content: `❌ ${result.data.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("❌ User Removed from Whitelist")
      .setColor(0xffa500)
      .setDescription(result.data.message)
      .addFields({ name: "User", value: identifier, inline: true })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("unwhitelist error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /reset
// ============================================================
export const resetData = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("[Admin/Mod] Reset a user's sessions")
  .addStringOption((opt) =>
    opt.setName("user").setDescription("Username or email").setRequired(true),
  );

export async function resetExecute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdminOrMod(interaction))) return;

  const identifier = interaction.options.getString("user", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const findType = identifier.includes("@") ? "email" : "username";
    const userResult = await getUserInfo(identifier, findType);

    if (!userResult.ok) {
      await interaction.editReply({
        content: `❌ User not found: ${identifier}`,
      });
      return;
    }

    const result = await manageUser("reset", {
      userId: userResult.data.user.id,
    });

    if (!result.ok) {
      await interaction.editReply({ content: `❌ ${result.data.error}` });
      return;
    }

    await interaction.editReply({ content: `✅ ${result.data.message}` });
  } catch (error) {
    console.error("reset error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}

// ============================================================
// /genlicense
// ============================================================
export const genlicenseData = new SlashCommandBuilder()
  .setName("genlicense")
  .setDescription("[Admin] Generate premium license keys")
  .addIntegerOption((opt) =>
    opt
      .setName("count")
      .setDescription("Number of keys (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duration")
      .setDescription("Duration in days (default: 30)")
      .setRequired(false),
  )
  .addBooleanOption((opt) =>
    opt
      .setName("lifetime")
      .setDescription("Generate lifetime keys")
      .setRequired(false),
  );

export async function genlicenseExecute(
  interaction: ChatInputCommandInteraction,
) {
  if (!(await requireAdmin(interaction))) return;

  const count = interaction.options.getInteger("count", true);
  const duration = interaction.options.getInteger("duration") ?? 30;
  const isLifetime = interaction.options.getBoolean("lifetime") ?? false;

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await generateKeys(count, duration, isLifetime);

    if (!result.ok) {
      await interaction.editReply({
        content: `❌ ${result.data.error || "Failed to generate keys"}`,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🔑 License Keys Generated")
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
    console.error("genlicense error:", error);
    await interaction.editReply({ content: "❌ An error occurred." });
  }
}
