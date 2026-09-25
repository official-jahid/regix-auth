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
import { toggleActivation } from "@/server/activations";

const ToggleActivationButton = ({
  id,
  device,
  active,
}: {
  id: string;
  device: string;
  active: boolean;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handler = async () => {
    setBusy(true);
    const result = await toggleActivation(id);
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
      <AlertDialog>
        <AlertDialogTrigger
          className={buttonVariants({
            variant: active ? "destructive" : "secondary",
            size: "sm",
          })}>
          {active ? "Revoke" : "Restore"}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {active ? "Revoke" : "Restore"} {device}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {active ?
                "Validation fails for this device until restored."
              : "Validation passes for this device again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={handler}>
              {busy ?
                "Working"
              : active ?
                "Revoke"
              : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export default ToggleActivationButton;
