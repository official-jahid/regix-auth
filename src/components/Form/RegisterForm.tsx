"use client";

import { registerFormSchema, RegisterFormType } from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../shadcnui/button";
import { Field, FieldError, FieldLabel } from "../shadcnui/field";
import { Input } from "../shadcnui/input";

const RegisterForm = () => {
  const { replace } = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      registerName: "",
      registerEmail: "",
      registerPassword: "",
      registerConfirmPassword: "",
      registerAccessKey: "",
    },
    mode: "all",
  });

  const registerHandler = async (registerData: RegisterFormType) => {
    try {
      const res = await fetch("/api/auth/register-with-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.registerName,
          email: registerData.registerEmail,
          password: registerData.registerPassword,
          accessKey: registerData.registerAccessKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Set inline error on the access key field if it's a key issue
        if (
          data.error?.toLowerCase().includes("key") ||
          data.error?.toLowerCase().includes("access")
        ) {
          setError("registerAccessKey", { message: data.error });
        } else {
          toast.error(data.error || "Registration failed");
        }
        return;
      }

      toast.success("Registration successful");

      reset();

      replace("/auth");
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
        name="registerEmail"
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="registerAccessKey"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Access Key</FieldLabel>
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

      <Button
        type="submit"
        disabled={isSubmitting}>
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
