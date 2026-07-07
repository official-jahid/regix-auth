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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/shadcnui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, MailCheckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(32, "Username must be less than 32 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(64, "Password must be less than 64 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormType = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    getValues,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "all",
  });

  const [otpValue, setOtpValue] = useState("");

  const registerHandler = async (data: RegisterFormType) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          displayName: data.username,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      // Send verification OTP
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          type: "EMAIL_VERIFICATION",
        }),
      });

      const otpResult = await otpRes.json();
      if (!otpRes.ok) {
        toast.error(otpResult.error || "Failed to send verification email");
        return;
      }

      toast.success(
        "Account created! Check your email for the verification code.",
      );
      setRegisteredEmail(data.email);
      setStep("verify");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpHandler = async () => {
    if (otpValue.length !== 6) {
      toast.error("Please enter the full 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredEmail,
          code: otpValue,
          type: "EMAIL_VERIFICATION",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Invalid OTP code");
        return;
      }

      toast.success("Email verified successfully!");
      reset();
      window.location.assign("/dashboard");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredEmail,
          type: "EMAIL_VERIFICATION",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to resend code");
        return;
      }

      toast.success("Verification code resent!");
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
          {step === "register" ? "Create Account" : "Verify Email"}
        </CardHeader>

        <CardContent>
          {step === "register" ?
            <form
              onSubmit={handleSubmit(registerHandler)}
              className="grid gap-4"
              noValidate>
              <Controller
                name="username"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Choose a username"
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
                      placeholder="Enter your email"
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
                      placeholder="Create a password"
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
                      placeholder="Confirm your password"
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
                    Creating account...
                  </>
                : <>
                    <UserPlusIcon className="mr-2 h-4 w-4" /> Register
                  </>
                }
              </Button>
            </form>
          : <div className="grid gap-4">
              <p className="text-muted-foreground text-center text-sm">
                We've sent a 6-digit verification code to{" "}
                <span className="text-foreground font-medium">
                  {registeredEmail}
                </span>
              </p>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
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
              </div>

              <Button
                type="button"
                disabled={isLoading || otpValue.length !== 6}
                className="w-full"
                onClick={verifyOtpHandler}>
                {isLoading ?
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Verifying...
                  </>
                : <>
                    <MailCheckIcon className="mr-2 h-4 w-4" /> Verify Email
                  </>
                }
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="w-full"
                onClick={resendOtp}>
                Resend Code
              </Button>
            </div>
          }
        </CardContent>

        <CardFooter className="justify-center gap-1">
          {step === "register" ?
            <>
              Already have an account?
              <Link
                href="/auth"
                className="text-primary hover:underline">
                Login
              </Link>
            </>
          : <button
              type="button"
              onClick={() => setStep("register")}
              className="text-muted-foreground hover:text-primary text-sm">
              Back to registration
            </button>
          }
        </CardFooter>
      </Card>
    </section>
  );
};

export default RegisterPage;
