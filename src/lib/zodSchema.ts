import z from "zod";

export const loginFormSchema = z.object({
  loginEmail: z
    .email("Invalid email address")
    .endsWith("@gmail.com", "Only gmail is allowed"),
  loginPassword: z
    .string()
    .min(6, "Password should be more than 6 char. long")
    .max(32, "Password should be less than 32 char. long"),
  loginRememberMe: z.boolean("This field is required"),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    registerName: z
      .string()
      .min(6, "Name should be more than 6 char. long")
      .max(32, "Name should be less than 32 char. long"),
    registerEmail: z
      .email("Invalid email address")
      .endsWith("@gmail.com", "Only gmail is allowed"),
    registerPassword: z
      .string()
      .min(6, "Password should be more than 6 char. long")
      .max(32, "Password should be less than 32 char. long"),
    registerConfirmPassword: z
      .string()
      .min(6, "Password should be more than 6 char. long")
      .max(32, "Password should be less than 32 char. long"),
  })
  .refine(
    ({ registerPassword, registerConfirmPassword }) =>
      registerPassword === registerConfirmPassword,
    {
      error: "Password didn't match",
      path: ["registerConfirmPassword"],
    },
  );

export type RegisterFormType = z.infer<typeof registerFormSchema>;
