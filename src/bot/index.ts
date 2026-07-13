import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { serverEnv } from "../lib/env/serverEnv";

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (...args: any[]) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, BotCommand>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection<string, BotCommand>();

async function loadCommands(dir: string): Promise<BotCommand[]> {
  const commands: BotCommand[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      commands.push(...(await loadCommands(fullPath)));
      continue;
    }

    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

    const mod = await import(fullPath);

    // Single-command file
    if (mod.data && mod.execute) {
      commands.push({ data: mod.data, execute: mod.execute });
      continue;
    }

    // Multi-command file
    for (const key of Object.keys(mod)) {
      if (key.endsWith("Data") && mod[key] instanceof SlashCommandBuilder) {
        const baseName = key.slice(0, -4);
        const executeFn = mod[`${baseName}Execute`];
        if (executeFn) {
          commands.push({ data: mod[key], execute: executeFn });
        }
      }
    }
  }

  return commands;
}

export async function startBot(): Promise<void> {
  const token = serverEnv.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("⚠ DISCORD_BOT_TOKEN not set. Bot will not start.");
    return;
  }

  const clientId = serverEnv.DISCORD_CLIENT_ID;
  if (!clientId) {
    console.warn("⚠ DISCORD_CLIENT_ID not set. Bot will not start.");
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const commandsDir = join(__dirname, "commands");
  const commands = await loadCommands(commandsDir);

  client.once("ready", async () => {
    console.log(`✅ Bot logged in as ${client.user?.tag}`);

    const rest = new REST({ version: "10" }).setToken(token);
    const commandData = commands.map((c) => c.data.toJSON());

    try {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log(
        `✅ Registered ${commandData.length} slash commands globally`,
      );
    } catch (err) {
      console.error("Failed to register commands:", err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error,
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "An error occurred.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "An error occurred.",
          ephemeral: true,
        });
      }
    }
  });

  for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
  }

  await client.login(token);
}
