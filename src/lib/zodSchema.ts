import z from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, { error: "Enter your email or username" })
    .trim(),
  password: z.string().min(8, { error: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(64, { error: "Name is too long" })
    .trim(),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30, { error: "Username must be at most 30 characters" })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      error: "Username can only contain letters, numbers, and . _ -",
    })
    .trim(),
  email: z.email({ error: "Enter a valid email" }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password is too long" }),
  licenseKey: z
    .string()
    .min(1, { error: "A valid license key is required" })
    .max(64, { error: "License key is too long" })
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
