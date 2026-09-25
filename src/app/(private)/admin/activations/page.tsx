import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { listActivations } from "@/server/activations";
import ToggleActivationButton from "./_components/ToggleActivationButton";

export const metadata: Metadata = {
  title: "Activations | REGIX Studio",
  description: "Track license activations",
};

const ActivationsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : 1) || 1,
  );

  const { items, total, pageCount } = await listActivations({
    q,
    status,
    page,
  });

  const query = (next: Record<string, string>) => {
    const current = new URLSearchParams();
    if (q) current.set("q", q);
    if (status !== "all") current.set("status", status);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }
    const text = current.toString();
    return text === "" ? "/admin/activations" : `/admin/activations?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Activations</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "activation" : "activations"}
          </p>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search device, IP, key"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Status filter">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          type="submit"
          className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Filter
        </button>
      </form>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>First seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">
                  {item.deviceId ?? "Unknown"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.license.key}
                </TableCell>
                <TableCell>{item.license.provider}</TableCell>
                <TableCell>{item.ip ?? "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? "secondary" : "outline"}>
                    {item.active ? "active" : "revoked"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {item.canManage ?
                    <ToggleActivationButton
                      id={item.id}
                      device={item.deviceId ?? "device"}
                      active={item.active}
                    />
                  : <span className="text-muted-foreground text-xs">
                      View only
                    </span>
                  }
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center">
                  No activations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">
          Page {page} of {pageCount}
        </span>
        {page > 1 && (
          <Link
            href={query({ page: String(page - 1) })}
            className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Previous
          </Link>
        )}
        {page < pageCount && (
          <Link
            href={query({ page: String(page + 1) })}
            className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Next
          </Link>
        )}
      </div>
    </section>
  );
};

export default ActivationsPage;
