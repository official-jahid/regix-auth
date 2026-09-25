"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { signIn } from "@/lib/auth-client";
import { LoginInput, loginSchema } from "@/lib/zodSchema";

const LoginPage = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
    mode: "all",
  });

  const handler = async (values: LoginInput) => {
    setAuthError(null);
    const { error } =
      values.identifier.includes("@") ?
        await signIn.email({
          email: values.identifier,
          password: values.password,
        })
      : await signIn.username({
          username: values.identifier,
          password: values.password,
        });

    if (error) {
      setAuthError("Invalid credentials. Check your login and try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Use your email or username to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(handler)}
            noValidate
            className="space-y-4">
            <Controller
              name="identifier"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Email or username
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
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
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {authError && (
              <p className="text-destructive text-sm">{authError}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full">
              {isSubmitting ? "Signing in" : "Login"}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              No account yet? <Link href="/register">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default LoginPage;
