"use client";

import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, LockIcon, LogInIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormType = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "all",
  });

  const loginHandler = async (data: LoginFormType) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.includes("@") ? data.email : undefined,
          username: data.email.includes("@") ? undefined : data.email,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Login failed");
        return;
      }

      toast.success("Login successful!");
      reset();
      window.location.assign("/dashboard");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      toast.error(
        "Discord login is not configured. Please set NEXT_PUBLIC_DISCORD_CLIENT_ID in your .env file.",
      );
      return;
    }
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/auth/discord/callback`,
    );
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`;
  };

  return (
    <section className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center text-2xl font-semibold">
          Welcome Back
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDiscordLogin}
            disabled={isLoading}>
            <LogInIcon className="mr-2 h-4 w-4" />
            Continue with Discord
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">
                Or continue with email
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(loginHandler)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Email or Username
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your email or username"
                    autoComplete="username"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-muted-foreground hover:text-primary text-xs">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full">
              {isSubmitting || isLoading ?
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> Logging
                  in...
                </>
              : <>
                  <LockIcon className="mr-2 h-4 w-4" /> Login
                </>
              }
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center gap-1">
          Don't have an account?
          <Link
            href="/auth/register"
            className="text-primary hover:underline">
            Register
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
};

export default LoginPage;
