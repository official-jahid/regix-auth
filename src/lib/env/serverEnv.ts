import z from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, { error: "DATABASE_URL is required" }),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1, { error: "BETTER_AUTH_SECRET is required" }),
  BETTER_AUTH_URL: z.string().min(1, { error: "BETTER_AUTH_URL is required" }),
  ADMIN_LIFETIME_KEY: z
    .string()
    .min(1, { error: "ADMIN_LIFETIME_KEY is required" }),
  SECRET_KEY: z.string().min(1, { error: "SECRET_KEY is required" }),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  DISCORD_ADMIN_ROLE_ID: z.string().optional(),
  DISCORD_MOD_ROLE_ID: z.string().optional(),
  SUPER_ADMIN_IDS: z.string().optional(),
});

const serverEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  ADMIN_LIFETIME_KEY: process.env.ADMIN_LIFETIME_KEY,
  SECRET_KEY: process.env.SECRET_KEY,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID,
  DISCORD_MOD_ROLE_ID: process.env.DISCORD_MOD_ROLE_ID,
  SUPER_ADMIN_IDS: process.env.SUPER_ADMIN_IDS,
};

export const serverEnv = serverEnvSchema.parse(serverEnvVars);
