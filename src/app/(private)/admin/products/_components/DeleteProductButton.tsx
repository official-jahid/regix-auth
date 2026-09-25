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
import { deleteProduct } from "@/server/products";

const DeleteProductButton = ({ id, name }: { id: string; name: string }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handler = async () => {
    setIsDeleting(true);
    const result = await deleteProduct(id);
    if ("error" in result) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
    router.refresh();
    setIsDeleting(false);
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger
          className={buttonVariants({ variant: "destructive", size: "sm" })}>
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Linked license keys keep working with no product attached. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handler}>
              {isDeleting ? "Deleting" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export default DeleteProductButton;
