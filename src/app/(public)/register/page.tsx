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
import { signUp } from "@/lib/auth-client";
import { RegisterInput, registerSchema } from "@/lib/zodSchema";
import { checkLicenseKey, claimLicense } from "@/server/client";

const RegisterPage = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      licenseKey: "",
    },
    mode: "all",
  });

  const handler = async (values: RegisterInput) => {
    setAuthError(null);

    const check = await checkLicenseKey(values.licenseKey);
    if (!check.valid) {
      setAuthError(check.error);
      return;
    }

    const { error } = await signUp.email({
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setAuthError("Could not create the account. Try different details.");
      return;
    }

    const claim = await claimLicense(values.licenseKey);
    if ("error" in claim) {
      setAuthError(
        "Account created, but the key claim failed. Redeem a key from your dashboard.",
      );
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            A valid license key is required to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(handler)}
            noValidate
            className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="username"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Username</FieldLabel>
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
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
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
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="licenseKey"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>License key</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="RGX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
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
              {isSubmitting ? "Creating account" : "Register"}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Have an account? <Link href="/login">Login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default RegisterPage;
