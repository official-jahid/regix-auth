"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shadcnui/button";
import { approveRenewal, rejectRenewal } from "@/server/client";

const RenewalQueueActions = ({ id }: { id: string }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (action: "approve" | "reject") => {
    setBusy(action);
    const result =
      action === "approve" ? await approveRenewal(id) : await rejectRenewal(id);
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
          variant="secondary"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("approve")}>
          {busy === "approve" ? "Approving" : "Approve"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("reject")}>
          {busy === "reject" ? "Rejecting" : "Reject"}
        </Button>
      </span>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};

export default RenewalQueueActions;
