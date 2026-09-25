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
import { listLicenses } from "@/server/licenses";
import LicenseRowActions from "./_components/LicenseRowActions";
import RenewalQueue from "./_components/RenewalQueue";

export const metadata: Metadata = {
  title: "Licenses | REGIX Studio",
  description: "Manage software license keys",
};

type LicenseItem = Awaited<ReturnType<typeof listLicenses>>["items"][number];

const derivedStatus = (item: LicenseItem) => {
  if (!item.active) return { label: "banned", variant: "outline" as const };
  if (item.expiresAt && new Date(item.expiresAt) < new Date())
    return { label: "expired", variant: "outline" as const };
  if (item.isUsed) return { label: "bound", variant: "secondary" as const };
  return { label: "available", variant: "default" as const };
};

const expiryText = (item: LicenseItem) => {
  if (item.expiresAt) return new Date(item.expiresAt).toLocaleDateString();
  if (item.duration && item.duration !== "lifetime")
    return `${item.duration}d on redeem`;
  return "Lifetime";
};

const LicensesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const used = typeof params.used === "string" ? params.used : "all";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : 1) || 1,
  );

  const { items, total, pageCount } = await listLicenses({
    q,
    status,
    used,
    page,
  });

  const query = (next: Record<string, string>) => {
    const current = new URLSearchParams();
    if (q) current.set("q", q);
    if (status !== "all") current.set("status", status);
    if (used !== "all") current.set("used", used);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }
    const text = current.toString();
    return text === "" ? "/admin/licenses" : `/admin/licenses?${text}`;
  };

  return (
    <section className="space-y-6">
      <RenewalQueue />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Licenses</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "license" : "licenses"}
          </p>
        </div>
        <Link
          href="/admin/licenses/new"
          className={buttonVariants({ variant: "default", size: "sm" })}>
          New license
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search key, provider, user"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Status filter">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Banned</option>
        </select>
        <select
          name="used"
          defaultValue={used}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Usage filter">
          <option value="all">Used and unused</option>
          <option value="used">Bound only</option>
          <option value="unused">Available only</option>
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
              <TableHead>Key</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bound to</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const derived = derivedStatus(item);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.key}
                    {item.notes && (
                      <span className="text-muted-foreground block font-sans text-xs">
                        {item.notes}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>{item.product?.name ?? "None"}</TableCell>
                  <TableCell>
                    <Badge variant={derived.variant}>{derived.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.owner?.username ?? item.usedBy ?? "None"}
                  </TableCell>
                  <TableCell>{expiryText(item)}</TableCell>
                  <TableCell className="text-right">
                    {item.canManage ?
                      <LicenseRowActions
                        id={item.id}
                        name={item.key}
                      />
                    : <span className="text-muted-foreground text-xs">
                        View only
                      </span>
                    }
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center">
                  No licenses found.
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

export default LicensesPage;
