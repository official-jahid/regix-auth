"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcnui/alert-dialog";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  deleteLicense,
  resetLicense,
  toggleLicenseActive,
} from "@/server/licenses";

const LicenseRowActions = ({ id, name }: { id: string; name: string }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: "toggle" | "reset" | "delete") => {
    setBusy(true);
    const result =
      action === "toggle" ? await toggleLicenseActive(id)
      : action === "reset" ? await resetLicense(id)
      : await deleteLicense(id);
    if ("error" in result) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Toggle
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Toggle {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Deactivating makes validation fail. The bound account is kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={() => run("toggle")}>
                {busy ? "Working" : "Toggle"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Reset
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Unbinds the owner and makes the key reusable. The account is
                kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={() => run("reset")}>
                {busy ? "Working" : "Reset"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "destructive", size: "sm" })}>
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Activations and renewals for this key are removed too. The bound
                account is kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={() => run("delete")}>
                {busy ? "Deleting" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export default LicenseRowActions;
