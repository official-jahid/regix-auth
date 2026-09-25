"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { redeemLicense } from "@/server/client";

const formSchema = z.object({
  key: z.string().min(1, { error: "Key is required" }).max(64).trim(),
  deviceId: z
    .string()
    .min(1, { error: "Device ID is required" })
    .max(128)
    .trim(),
});

type FormValues = z.infer<typeof formSchema>;

const RedeemLicenseForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { key: "", deviceId: "" },
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    const result = await redeemLicense(values);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(handler)}
      noValidate
      className="space-y-4">
      <Controller
        name="key"
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="deviceId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Device ID</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Your machine ID"
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
        {isSubmitting ? "Redeeming" : "Redeem key"}
      </Button>
    </form>
  );
};

export default RedeemLicenseForm;
