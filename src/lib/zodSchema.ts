import z from "zod";

export const loginFormSchema = z.object({
  loginEmail: z
    .string()
    .min(1, "Username is required")
    .max(32, "Username should be less than 32 char. long"),
  loginPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password should be less than 64 char. long"),
  loginRememberMe: z.boolean("This field is required"),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password should be less than 64 char. long")
  .refine((p) => /[A-Z]/.test(p), "Password must contain at least one uppercase letter")
  .refine((p) => /[a-z]/.test(p), "Password must contain at least one lowercase letter")
  .refine((p) => /\d/.test(p), "Password must contain at least one number");

export const registerFormSchema = z
  .object({
    registerName: z
      .string()
      .min(2, "Name should be more than 2 char. long")
      .max(32, "Name should be less than 32 char. long"),
    registerUsername: z
      .string()
      .min(3, "Username should be more than 3 char. long")
      .max(32, "Username should be less than 32 char. long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    registerDiscordUserId: z
      .string()
      .regex(/^\d{17,20}$/, "Invalid Discord User ID format"),
    registerAccessKey: z
      .string()
      .min(1, "Access key is required")
      .regex(/^[A-Z0-9-]+$/, "Invalid key format"),
    registerPassword: passwordSchema,
    registerConfirmPassword: z.string(),
    registerOtp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must contain only digits"),
  })
  .refine(
    ({ registerPassword, registerConfirmPassword }) =>
      registerPassword === registerConfirmPassword,
    {
      error: "Passwords did not match",
      path: ["registerConfirmPassword"],
    },
  );

export type RegisterFormType = z.infer<typeof registerFormSchema>;
