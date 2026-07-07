import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

let client: Client<true> & {
  commands: Collection<
    string,
    {
      data: SlashCommandBuilder;
      execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    }
  >;
};

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.log(
      "🤖 Discord Bot: DISCORD_BOT_TOKEN not set, skipping bot startup.",
    );
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  }) as typeof client;

  client.commands = new Collection();

  const commandRegistry: Array<{
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }> = [];

  // Load commands
  const { readdirSync } = await import("fs");
  const { dirname, join } = await import("path");
  const { fileURLToPath } = await import("url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const commandFiles = readdirSync(join(__dirname, "commands")).filter(
    (f) => f.endsWith(".ts") || f.endsWith(".js"),
  );

  for (const file of commandFiles) {
    const commandModule = await import(`./commands/${file}`);

    // Standard single-command files (data + execute)
    if ("data" in commandModule && "execute" in commandModule) {
      commandRegistry.push({
        data: commandModule.data,
        execute: commandModule.execute,
      });
      client.commands.set(commandModule.data.name, {
        data: commandModule.data,
        execute: commandModule.execute,
      });
    }

    // Multi-command files (named exports like genuserData + genuserExecute)
    const commandPairs: Array<{ dataName: string; executeName: string }> = [];
    for (const key of Object.keys(commandModule)) {
      if (
        key.endsWith("Data") &&
        commandModule[key] instanceof SlashCommandBuilder
      ) {
        const baseName = key.slice(0, -4);
        const executeKey = `${baseName}Execute`;
        if (typeof commandModule[executeKey] === "function") {
          commandPairs.push({ dataName: key, executeName: executeKey });
        }
      }
    }

    for (const pair of commandPairs) {
      const data = commandModule[pair.dataName] as SlashCommandBuilder;
      const execute = commandModule[pair.executeName] as (
        interaction: ChatInputCommandInteraction,
      ) => Promise<void>;

      commandRegistry.push({ data, execute });
      client.commands.set(data.name, { data, execute });
    }
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      console.error(`Command ${interaction.commandName} error:`, error);
      const reply =
        interaction.replied || interaction.deferred ?
          interaction.editReply({ content: "❌ An error occurred." })
        : interaction.reply({
            content: "❌ An error occurred.",
            ephemeral: true,
          });
      await reply.catch(() => {});
    }
  });

  client.once("clientReady", async () => {
    console.log(`✅ Bot logged in as ${client.user?.tag}`);

    const rest = new REST({ version: "10" }).setToken(token);

    try {
      await rest.put(Routes.applicationCommands(client.user!.id), {
        body: commandRegistry.map((c) => c.data.toJSON()),
      });
      console.log(
        `✅ Registered ${commandRegistry.length} slash commands globally`,
      );
    } catch (error) {
      console.error("Failed to register commands:", error);
    }
  });

  await client.login(token);
}

export function getBotClient() {
  return client;
}

export function isBotRunning(): boolean {
  return client?.isReady() ?? false;
}
