import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .startsWith("file:./", {
        error: "DATABASE_URL must start with file:./",
      })
      .min(1, { error: "DATABASE_URL is required" }),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, { error: "BETTER_AUTH_SECRET must be at least 32 chars" }),
    BETTER_AUTH_URL: z
      .string()
      .min(1, { error: "BETTER_AUTH_URL is required" }),
    BETTER_AUTH_ALLOWED_ORIGINS: z.string().optional(),
    BETTER_AUTH_TELEMETRY: z.enum(["1", "0"]).optional(),
    ADMIN_USERNAME: z.string().min(3, { error: "ADMIN_USERNAME is required" }),
    ADMIN_PASSWORD: z.string().min(8, { error: "ADMIN_PASSWORD is required" }),
    ADMIN_EMAIL: z.email({ error: "ADMIN_EMAIL must be valid" }),
    USER_USERNAME: z.string().min(3).optional(),
    USER_PASSWORD: z.string().min(8).optional(),
    USER_EMAIL: z.email().optional(),
    RESELLER_USERNAME: z.string().min(3).optional(),
    RESELLER_PASSWORD: z.string().min(8).optional(),
    RESELLER_EMAIL: z.email().optional(),
    RESELLER_PROVIDER: z.string().min(1).optional(),
    NEXT_TELEMETRY_DISABLED: z.enum(["1", "0"]).optional(),
    CHECKPOINT_DISABLE: z.enum(["1", "0"]).optional(),
  },
  experimental__runtimeEnv: process.env,
});
