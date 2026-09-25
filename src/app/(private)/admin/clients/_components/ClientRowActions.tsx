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
import { resetClientDevices, toggleClientBan } from "@/server/users";

export const BanClientButton = ({
  id,
  name,
  banned,
}: {
  id: string;
  name: string;
  banned: boolean;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handler = async () => {
    setBusy(true);
    const result = await toggleClientBan(id);
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
            variant: banned ? "secondary" : "destructive",
            size: "sm",
          })}>
          {banned ? "Unban" : "Ban"}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banned ? "Unban" : "Ban"} {name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banned ?
                "The client can sign in again."
              : "The client is signed out everywhere and cannot sign in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={handler}>
              {busy ?
                "Working"
              : banned ?
                "Unban"
              : "Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export const ResetDevicesButton = ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handler = async () => {
    setBusy(true);
    const result = await resetClientDevices(id);
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
          className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Reset devices
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset devices for {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              All active devices are revoked. The client re-registers on next
              validation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={handler}>
              {busy ? "Working" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};
