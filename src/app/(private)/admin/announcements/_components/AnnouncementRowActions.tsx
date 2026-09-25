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
import { Button, buttonVariants } from "@/components/shadcnui/button";
import { deleteAnnouncement, toggleAnnouncement } from "@/server/announcements";

const AnnouncementRowActions = ({
  id,
  title,
  active,
}: {
  id: string;
  title: string;
  active: boolean;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (action: "toggle" | "delete") => {
    setBusy(action);
    const result =
      action === "toggle" ?
        await toggleAnnouncement(id)
      : await deleteAnnouncement(id);
    if ("error" in result) {
      setError(result.error);
      setBusy(null);
      return;
    }
    router.refresh();
    setBusy(null);
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("toggle")}>
          {busy === "toggle" ?
            "Working"
          : active ?
            "Hide"
          : "Show"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "destructive", size: "sm" })}>
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
              <AlertDialogDescription>
                Member acknowledgements are removed too. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy !== null}
                onClick={() => run("delete")}>
                {busy === "delete" ? "Deleting" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export default AnnouncementRowActions;
