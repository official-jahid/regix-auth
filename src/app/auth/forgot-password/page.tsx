"use client";

import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, LoaderIcon, MailIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "all",
  });

  const forgotPasswordHandler = async (data: ForgotPasswordFormType) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      toast.success("OTP sent to your email!");
      setEmailSent(true);
      reset();
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center text-2xl font-semibold">
          Forgot Password
        </CardHeader>

        <CardContent className="space-y-4">
          {emailSent ?
            <div className="space-y-4 text-center">
              <div className="mx-auto w-fit rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <MailIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground text-sm">
                If an account with that email exists, we&apos;ve sent a password
                reset OTP. Please check your inbox and use the code to reset
                your password.
              </p>
              <Link
                href="/auth/reset-password"
                className="text-primary block text-sm hover:underline">
                Go to Reset Password
              </Link>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}>
                Send again
              </Button>
            </div>
          : <form
              onSubmit={handleSubmit(forgotPasswordHandler)}
              className="grid gap-4"
              noValidate>
              <p className="text-muted-foreground text-center text-sm">
                Enter your email address and we&apos;ll send you an OTP to reset
                your password.
              </p>

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
                      placeholder="Enter your email"
                      autoComplete="email"
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
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Sending...
                  </>
                : <>
                    <SendIcon className="mr-2 h-4 w-4" /> Send OTP
                  </>
                }
              </Button>
            </form>
          }

          <div className="text-center">
            <Link
              href="/auth"
              className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm">
              <ArrowLeftIcon className="h-3 w-3" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ForgotPasswordPage;
