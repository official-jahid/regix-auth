import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().min(1, { error: "DATABASE_URL is required" }),
    CHECKPOINT_DISABLE: z.enum(["1", "0"]).optional(),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_USERNAME: z.string().min(3),
    ADMIN_PASSWORD: z.string().min(6),
    JWT_SECRET: z.string().min(10),
    SESSION_SECRET: z.string().min(10),
    SECRET_KEY: z.string().min(5),
    RESEND_API_KEY: z.string().min(1, "Resend API key is required"),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    DISCORD_REDIRECT_URI: z.string().url().optional(),
    DISCORD_BOT_TOKEN: z.string().optional(),
    APP_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: process.env,
});
