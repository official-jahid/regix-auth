"use client";

import {
  registerFormSchema,
  RegisterFormType,
} from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, LockIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "../shadcnui/button";
import { Field, FieldError, FieldLabel } from "../shadcnui/field";
import { Input } from "../shadcnui/input";

const OTP_EXPIRY_SECONDS = 120;

const RegisterForm = () => {
  const { push } = useRouter();
  const [otpCooldown, setOtpCooldown] = useState(0);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    reset,
    setError,
    watch,
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      registerName: "",
      registerUsername: "",
      registerDiscordUserId: "",
      registerAccessKey: "",
      registerPassword: "",
      registerConfirmPassword: "",
      registerOtp: "",
    },
    mode: "all",
  });

  const discordUserId = watch("registerDiscordUserId");

  useEffect(() => {
    if (otpCooldown > 0) {
      const interval = setInterval(() => {
        setOtpCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpCooldown]);

  const sendOtpHandler = async () => {
    if (!discordUserId || !/^\d{17,20}$/.test(discordUserId)) {
      setError("registerDiscordUserId", {
        message: "Valid Discord User ID required",
      });
      return;
    }

    const formData = new FormData();
    formData.append("discordUserId", discordUserId);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        toast.success("OTP sent to your Discord DM");
        setOtpCooldown(OTP_EXPIRY_SECONDS);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const registerHandler = async (registerData: RegisterFormType) => {
    const formData = new FormData();
    formData.append("name", registerData.registerName);
    formData.append("username", registerData.registerUsername);
    formData.append("discordUserId", registerData.registerDiscordUserId);
    formData.append("accessKey", registerData.registerAccessKey);
    formData.append("password", registerData.registerPassword);
    formData.append("otp", registerData.registerOtp);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (
          result.error?.toLowerCase().includes("key") ||
          result.error?.toLowerCase().includes("access")
        ) {
          setError("registerAccessKey", { message: result.error });
        } else if (
          result.error?.toLowerCase().includes("otp") ||
          result.error?.toLowerCase().includes("expired") ||
          result.error?.toLowerCase().includes("invalid")
        ) {
          setError("registerOtp", { message: result.error });
        } else {
          toast.error(result.error || "Registration failed");
        }
        return;
      }

      toast.success("Registration successful");
      reset();
      push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(registerHandler)}
      className="grid gap-4"
      noValidate>
      <Controller
        name="registerName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your full name"
              autoComplete="name"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerUsername"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Username</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your username"
              autoComplete="username"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerDiscordUserId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Discord User ID</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              aria-invalid={fieldState.invalid}
              placeholder="123456789012345678 (Snowflake ID)"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerAccessKey"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Access Key / License Key</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              aria-invalid={fieldState.invalid}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              autoComplete="off"
              className="font-mono tracking-wider"
              onChange={(e) => {
                field.onChange(e.target.value.toUpperCase());
              }}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerPassword"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerConfirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid gap-2">
        <FieldLabel>Verification Code</FieldLabel>
        <div className="flex gap-2">
          <Controller
            name="registerOtp"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex-1">
                <Input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6-digit OTP"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </div>
            )}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={
              isSubmitting ||
              otpCooldown > 0 ||
              !discordUserId ||
              !/^\d{17,20}$/.test(discordUserId)
            }
            onClick={sendOtpHandler}>
            {otpCooldown > 0 ? `${otpCooldown}s` : <SendIcon />}
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ?
          <>
            <LoaderIcon className="animate-spin" /> Registering...
          </>
        : <>
            <LockIcon /> Register
          </>
        }
      </Button>
    </form>
  );
};

export default RegisterForm;