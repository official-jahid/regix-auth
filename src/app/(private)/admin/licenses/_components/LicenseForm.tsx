"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { LicenseCreateInput, createLicense } from "@/server/licenses";

const toNullableNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const formSchema = z.object({
  provider: z.string().min(1, { error: "Provider is required" }).max(64).trim(),
  productId: z.string().nullable().optional(),
  durationDays: z.preprocess(
    toNullableNumber,
    z.number().int().min(1).max(36500).nullable().optional(),
  ),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const LicenseForm = ({
  isAdmin,
  defaultProvider,
  products,
}: {
  isAdmin: boolean;
  defaultProvider: string;
  products: { id: string; name: string; expiryDays: number | null }[];
}) => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: defaultProvider,
      productId: null,
      durationDays: null,
      notes: "",
    },
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    setCreatedKey(null);
    const payload: LicenseCreateInput = {
      ...values,
      productId: values.productId ?? null,
    };
    const result = await createLicense(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    setCreatedKey(result.key);
  };

  const done = () => {
    router.push("/admin/licenses");
    router.refresh();
  };

  if (createdKey) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Key created. Copy it now, it stays visible in the list too.
        </p>
        <p className="border-input bg-muted rounded border px-3 py-2 font-mono text-sm break-all">
          {createdKey}
        </p>
        <Button onClick={done}>Back to licenses</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handler)}
      noValidate
      className="space-y-4">
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
              autoComplete="off"
              disabled={!isAdmin}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="productId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Product, optional</FieldLabel>
            <Select
              value={field.value ?? "none"}
              onValueChange={(value) =>
                field.onChange(value === "none" ? null : value)
              }>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="No product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No product</SelectItem>
                {products.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}>
                    {option.name}
                    {option.expiryDays === null ?
                      " · lifetime"
                    : ` · ${option.expiryDays}d`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="durationDays"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Duration days, empty for lifetime or product default
            </FieldLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              type="number"
              min={1}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Notes, optional</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              id={field.name}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ? "Creating" : "Create license"}
      </Button>
    </form>
  );
};

export default LicenseForm;
