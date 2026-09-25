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
import { PostInput, createPost, updatePost } from "@/server/posts";

const formSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }).max(150).trim(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1, { error: "Content is required" }).trim(),
  coverUrl: z.union([z.literal(""), z.url()]).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

const PostForm = ({
  postId,
  defaults,
  categoryOptions,
  tagOptions,
}: {
  postId?: string;
  defaults: FormValues;
  categoryOptions: { id: string; label: string }[];
  tagOptions: { id: string; label: string }[];
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
    const payload: PostInput = { ...values };
    const result =
      postId ? await updatePost(postId, payload) : await createPost(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/posts");
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
        name="excerpt"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Excerpt</FieldLabel>
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
        name="content"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Content</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              rows={10}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="coverUrl"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Cover URL</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              type="url"
              aria-invalid={fieldState.invalid}
              placeholder="https://example.com/cover.png"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="categoryIds"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Categories</FieldLabel>
            {categoryOptions.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No active categories yet.
              </p>
            )}
            <div className="space-y-2">
              {categoryOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value.includes(option.id)}
                    onCheckedChange={() =>
                      field.onChange(toggleId(field.value, option.id))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>
        )}
      />

      <Controller
        name="tagIds"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Tags</FieldLabel>
            {tagOptions.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No active tags yet.
              </p>
            )}
            <div className="space-y-2">
              {tagOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value.includes(option.id)}
                    onCheckedChange={() =>
                      field.onChange(toggleId(field.value, option.id))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>
        )}
      />

      {formError && <p className="text-destructive text-sm">{formError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ?
          "Saving"
        : postId ?
          "Save changes"
        : "Create post"}
      </Button>
    </form>
  );
};

export default PostForm;
