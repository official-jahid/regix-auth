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
import { ProductInput, createProduct, updateProduct } from "@/server/products";

const toNullableNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const formSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100).trim(),
  description: z.string().max(500).optional(),
  version: z.string().max(32).optional(),
  expiryDays: z.preprocess(
    toNullableNumber,
    z.number().int().min(1).max(36500).nullable().optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormValues = z.infer<typeof formSchema>;

const ProductForm = ({
  productId,
  defaults,
}: {
  productId?: string;
  defaults: FormValues;
}) => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    const payload: ProductInput = { ...values };
    const result =
      productId ?
        await updateProduct(productId, payload)
      : await createProduct(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
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
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Controller
          name="version"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Version</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="1.0.0"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="expiryDays"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Expiry days, empty for lifetime
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
          name="sortOrder"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Sort order</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                min={0}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="status"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Status</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}>
              <SelectTrigger id={field.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ?
          "Saving"
        : productId ?
          "Save changes"
        : "Create product"}
      </Button>
    </form>
  );
};

export default ProductForm;
