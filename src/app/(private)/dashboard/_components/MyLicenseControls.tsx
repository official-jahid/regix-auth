"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shadcnui/button";
import { removeMyDevice, requestRenewal } from "@/server/client";

export const MyDeviceList = ({
  devices,
}: {
  devices: { id: string; deviceId: string | null; ip: string | null }[];
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (id: string) => {
    setBusyId(id);
    const result = await removeMyDevice(id);
    if ("error" in result) {
      setError(result.error);
      setBusyId(null);
      return;
    }
    router.refresh();
    setBusyId(null);
  };

  if (devices.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No devices yet. Validating from a device registers it here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div
          key={device.id}
          className="border-input flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
          <span className="font-mono text-xs">
            {device.deviceId ?? "Unknown"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={busyId === device.id}
            onClick={() => remove(device.id)}>
            {busyId === device.id ? "Removing" : "Remove"}
          </Button>
        </div>
      ))}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
};

export const RequestRenewalButton = ({ licenseId }: { licenseId: string }) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handler = async () => {
    setBusy(true);
    const result = await requestRenewal({ licenseId });
    if ("error" in result) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setSent(true);
    router.refresh();
    setBusy(false);
  };

  if (sent) {
    return (
      <p className="text-muted-foreground text-sm">
        Renewal requested. Your reseller reviews it shortly.
      </p>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={handler}>
        {busy ? "Sending" : "Request renewal"}
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
};
