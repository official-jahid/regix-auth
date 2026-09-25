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
import {
  CategoryInput,
  createCategory,
  updateCategory,
} from "@/server/categories";

const formSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100).trim(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().max(16).optional(),
  icon: z.string().max(48).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CategoryForm = ({
  categoryId,
  defaults,
  parentOptions,
}: {
  categoryId?: string;
  defaults: FormValues;
  parentOptions: { id: string; label: string }[];
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
    const payload: CategoryInput = {
      ...values,
      parentId: values.parentId ?? null,
    };
    const result =
      categoryId ?
        await updateCategory(categoryId, payload)
      : await createCategory(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/taxonomy/categories");
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

      <Controller
        name="parentId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Parent</FieldLabel>
            <Select
              value={field.value ?? "root"}
              onValueChange={(value) =>
                field.onChange(value === "root" ? null : value)
              }>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Root category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root category</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Controller
          name="color"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Color</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="#8b5cf6"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="icon"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Icon</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="folder"
                autoComplete="off"
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

      <Controller
        name="seoTitle"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>SEO title</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              aria-invalid={fieldState.invalid}
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="seoDescription"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>SEO description</FieldLabel>
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
        {isSubmitting ?
          "Saving"
        : categoryId ?
          "Save changes"
        : "Create category"}
      </Button>
    </form>
  );
};

export default CategoryForm;
