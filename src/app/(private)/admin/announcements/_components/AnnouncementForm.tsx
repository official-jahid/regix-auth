"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
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
import { AnnouncementInput, createAnnouncement } from "@/server/announcements";

const formSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }).max(120).trim(),
  message: z.string().min(1, { error: "Message is required" }).max(2000).trim(),
  urgency: z.enum(["info", "warning", "critical"]).default("info"),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const AnnouncementForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", message: "", urgency: "info", active: true },
    mode: "all",
  });

  const handler = async (values: FormValues) => {
    setFormError(null);
    const payload: AnnouncementInput = { ...values };
    const result = await createAnnouncement(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/announcements");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(handler)}
      noValidate
      className="space-y-4">
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
        name="message"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Message</FieldLabel>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          name="urgency"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Urgency</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}>
                <SelectTrigger id={field.name}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Visible to members</FieldLabel>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Active
              </label>
            </Field>
          )}
        />
      </div>

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ? "Creating" : "Create announcement"}
      </Button>
    </form>
  );
};

export default AnnouncementForm;
