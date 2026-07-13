"use client";

import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { AlertTriangle, Key, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function KeyUpdateClient() {
  const { replace } = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessKey.trim()) {
      setError("Access key is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/update-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: accessKey.toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Access key updated successfully!");
        replace("/dashboard");
      } else {
        setError(data.error || "Failed to update key");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="w-full space-y-6">
        {/* Warning Banner */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div>
              <h2 className="text-sm font-semibold text-red-500 sm:text-base">
                Access Restricted
              </h2>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Your access key has expired or was revoked. Please enter a new
                valid access key to regain full access to your account.
              </p>
            </div>
          </div>
        </div>

        {/* Key Update Form */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold sm:text-lg">
            <Key className="text-primary size-4 sm:size-5" />
            Update Access Key
          </h3>
          <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
            Enter a new valid access key to restore your account permissions.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="access-key">New Access Key</FieldLabel>
              <Input
                id="access-key"
                type="text"
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                autoComplete="off"
                className="font-mono tracking-wider"
                aria-invalid={!!error}
              />
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full">
              {isSubmitting ?
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying...
                </>
              : <>
                  <Key className="size-4" /> Submit & Extend Access
                </>
              }
            </Button>
          </form>
        </div>

        {/* Logout */}
        <div className="text-center">
          <form
            action="/api/auth/logout"
            method="POST">
            <button
              type="submit"
              className="text-muted-foreground hover:text-destructive inline-flex items-center gap-2 text-xs transition-colors sm:text-sm">
              <LogOut className="size-3.5 sm:size-4" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
