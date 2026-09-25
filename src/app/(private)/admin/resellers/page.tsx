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
import { listResellers } from "@/server/users";
import BanUserButton from "../users/_components/BanUserButton";
import DeleteResellerButton from "./_components/DeleteResellerButton";

export const metadata: Metadata = {
  title: "Resellers | REGIX Studio",
  description: "Manage reseller accounts",
};

const ResellersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : 1) || 1,
  );

  const { items, total, pageCount } = await listResellers({ q, page });

  const query = (next: Record<string, string>) => {
    const current = new URLSearchParams();
    if (q) current.set("q", q);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }
    const text = current.toString();
    return text === "" ? "/admin/resellers" : `/admin/resellers?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Resellers</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "reseller" : "resellers"}
          </p>
        </div>
        <Link
          href="/admin/resellers/new"
          className={buttonVariants({ variant: "default", size: "sm" })}>
          New reseller
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search username, email, provider"
          className="max-w-xs"
        />
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
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Keys</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.username}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.email}
                </TableCell>
                <TableCell>{item.provider ?? "None"}</TableCell>
                <TableCell>
                  <Badge variant={item.banned ? "outline" : "secondary"}>
                    {item.banned ? "banned" : "active"}
                  </Badge>
                </TableCell>
                <TableCell>{item._count.createdLicenses}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <BanUserButton
                      id={item.id}
                      name={item.username ?? item.email}
                      banned={item.banned ?? false}
                    />
                    <DeleteResellerButton
                      id={item.id}
                      name={item.username ?? item.email}
                    />
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground text-center">
                  No resellers found.
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

export default ResellersPage;
