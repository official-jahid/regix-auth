"use client";

import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardHeader } from "@/components/shadcnui/card";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/shadcnui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  KeyIcon,
  LoaderIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(32, "Password must be less than 32 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    getValues,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "all",
  });

  const sendOtpHandler = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      toast.success("OTP sent to your email!");
      setVerifiedEmail(email);
      setStep("reset");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordHandler = async (data: ResetPasswordFormType) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          code: data.otp,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully! Please login.");
      reset();
      window.location.assign("/auth");
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
          Reset Password
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "email" ?
            <form
              className="grid gap-4"
              noValidate>
              <p className="text-muted-foreground text-center text-sm">
                Enter your email to receive a password reset OTP.
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
                type="button"
                disabled={isLoading}
                className="w-full"
                onClick={sendOtpHandler}>
                {isLoading ?
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Sending...
                  </>
                : <>
                    <KeyIcon className="mr-2 h-4 w-4" /> Send OTP
                  </>
                }
              </Button>
            </form>
          : <form
              onSubmit={handleSubmit(resetPasswordHandler)}
              className="grid gap-4"
              noValidate>
              <p className="text-muted-foreground text-center text-sm">
                Enter the 6-digit OTP sent to{" "}
                <span className="text-foreground font-medium">
                  {verifiedEmail}
                </span>
              </p>

              <Controller
                name="otp"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="otp">OTP Code</FieldLabel>
                    <InputOTP
                      {...field}
                      id="otp"
                      maxLength={6}
                      aria-invalid={fieldState.invalid}
                      autoComplete="one-time-code">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="newPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
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
                    Resetting...
                  </>
                : <>
                    <ShieldCheckIcon className="mr-2 h-4 w-4" /> Reset Password
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

export default ResetPasswordPage;
