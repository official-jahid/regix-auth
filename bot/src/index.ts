import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commands: SlashCommandBuilder[] = [];

// Load commands
const commandFiles = readdirSync(join(__dirname, "commands")).filter(
  (f) => f.endsWith(".ts") || f.endsWith(".js"),
);

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data);
  }
}

// Load events
const eventFiles = readdirSync(join(__dirname, "events")).filter(
  (f) => f.endsWith(".ts") || f.endsWith(".js"),
);

for (const file of eventFiles) {
  const event = await import(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);

  // Register slash commands globally
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN!,
  );

  try {
    await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commands,
    });
    console.log("✅ Slash commands registered globally");
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN!);
