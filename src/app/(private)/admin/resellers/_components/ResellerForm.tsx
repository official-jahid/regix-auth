"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { ResellerCreateInput, createReseller } from "@/server/users";

const formSchema = z.object({
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      error: "Username can only contain letters, numbers, and . _ -",
    })
    .trim(),
  email: z.email({ error: "Enter a valid email" }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be 8 plus chars" })
    .max(128),
  provider: z.string().min(1, { error: "Provider is required" }).max(64).trim(),
});

type FormValues = z.infer<typeof formSchema>;

const ResellerForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "", password: "", provider: "" },
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    const payload: ResellerCreateInput = { ...values };
    const result = await createReseller(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/resellers");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(handler)}
      noValidate
      className="space-y-4">
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
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="provider"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Provider</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="REGIX"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ? "Creating" : "Create reseller"}
      </Button>
    </form>
  );
};

export default ResellerForm;
