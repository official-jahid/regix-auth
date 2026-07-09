import { getBotClient } from "@/bot/index";
import prisma from "@/lib/database/dbClient";
import { EmbedBuilder, TextChannel } from "discord.js";

// ============================================================
// BOT LOG SERVICE
// ============================================================
// Centralized logging for bot actions to Discord log channel.
// Falls back to console if bot is not running or no log channel configured.

type LogLevel = "info" | "success" | "warning" | "error";

interface LogEntry {
  title: string;
  description: string;
  level: LogLevel;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  userId?: string;
  timestamp?: Date;
}

const LOG_COLORS: Record<LogLevel, number> = {
  info: 0x3498db, // Blue
  success: 0x2ecc71, // Green
  warning: 0xf39c12, // Yellow/Orange
  error: 0xe74c3c, // Red
};

const LOG_EMOJIS: Record<LogLevel, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

/**
 * Send a log message to the configured Discord log channel.
 * Falls back to console.log if bot is not running or no channel configured.
 */
export async function sendLog(entry: LogEntry): Promise<void> {
  const timestamp = entry.timestamp || new Date();

  // Always log to console as fallback
  const consolePrefix = `[${LOG_EMOJIS[entry.level]} Bot Log]`;
  console.log(`${consolePrefix} ${entry.title}: ${entry.description}`);

  try {
    // Try to get the first BotConfig with a log channel
    const botConfig = await prisma.botConfig.findFirst({
      where: { logChannelId: { not: null } },
    });

    if (!botConfig?.logChannelId) {
      console.log("ℹ️ No log channel configured. Skipping Discord log.");
      return;
    }

    const client = getBotClient();
    if (!client?.isReady()) {
      console.log("ℹ️ Bot not ready. Skipping Discord log.");
      return;
    }

    const channel = await client.channels.fetch(botConfig.logChannelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.log("⚠️ Log channel not found or not a text channel.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(LOG_COLORS[entry.level])
      .setTitle(`${LOG_EMOJIS[entry.level]} ${entry.title}`)
      .setDescription(entry.description)
      .setTimestamp(timestamp)
      .setFooter({
        text: "Regix Auth Bot Log",
      });

    if (entry.fields && entry.fields.length > 0) {
      embed.addFields(entry.fields);
    }

    if (entry.userId) {
      embed.addFields({
        name: "User",
        value: `<@${entry.userId}> (${entry.userId})`,
        inline: true,
      });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to send Discord log:", error);
  }
}

// Convenience functions
export async function logInfo(
  title: string,
  description: string,
  options?: {
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    userId?: string;
  },
) {
  return sendLog({
    title,
    description,
    level: "info",
    ...options,
  });
}

export async function logSuccess(
  title: string,
  description: string,
  options?: {
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    userId?: string;
  },
) {
  return sendLog({
    title,
    description,
    level: "success",
    ...options,
  });
}

export async function logWarning(
  title: string,
  description: string,
  options?: {
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    userId?: string;
  },
) {
  return sendLog({
    title,
    description,
    level: "warning",
    ...options,
  });
}

export async function logError(
  title: string,
  description: string,
  options?: {
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    userId?: string;
  },
) {
  return sendLog({
    title,
    description,
    level: "error",
    ...options,
  });
}
