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
import { TagInput, createTag, updateTag } from "@/server/tags";

const formSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(100).trim(),
  description: z.string().max(500).optional(),
  color: z.string().max(16).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormValues = z.infer<typeof formSchema>;

const TagForm = ({
  tagId,
  defaults,
}: {
  tagId?: string;
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
    const payload: TagInput = { ...values };
    const result =
      tagId ? await updateTag(tagId, payload) : await createTag(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/taxonomy/tags");
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

      <div className="grid gap-4 md:grid-cols-2">
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
                placeholder="#22d3ee"
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

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ?
          "Saving"
        : tagId ?
          "Save changes"
        : "Create tag"}
      </Button>
    </form>
  );
};

export default TagForm;
