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
import { ResourceInput, createResource } from "@/server/resources";

const formSchema = z.object({
  type: z.string().min(1, { error: "Type is required" }).max(32).trim(),
  title: z.string().min(1, { error: "Title is required" }).max(120).trim(),
  content: z.string().min(1, { error: "Content is required" }).max(2000).trim(),
});

type FormValues = z.infer<typeof formSchema>;

const resourceTypes = ["command", "file", "video", "link", "note"];

const ResourceForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "command", title: "", content: "" },
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    const payload: ResourceInput = { ...values };
    const result = await createResource(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/resources");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(handler)}
      noValidate
      className="space-y-4">
      <Controller
        name="type"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Type</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}>
              <SelectTrigger id={field.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Title</FieldLabel>
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
        name="content"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Content</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              rows={5}
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
        {isSubmitting ? "Creating" : "Create resource"}
      </Button>
    </form>
  );
};

export default ResourceForm;
