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
import { listClients } from "@/server/users";
import {
  BanClientButton,
  ResetDevicesButton,
} from "./_components/ClientRowActions";

export const metadata: Metadata = {
  title: "Clients | REGIX Studio",
  description: "Manage provider clients",
};

const ClientsPage = async ({
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

  const { items, total, pageCount } = await listClients({ q, page });

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
    return text === "" ? "/admin/clients" : `/admin/clients?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "client" : "clients"} under your provider
          </p>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search username or email"
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
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.username ?? "Unknown"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.email}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.ownedLicenses.length === 0 ?
                    "None"
                  : item.ownedLicenses
                      .map(
                        (link) =>
                          `${link.key} · ${link._count.activations} active`,
                      )
                      .join(", ")
                  }
                </TableCell>
                <TableCell>
                  <Badge variant={item.banned ? "outline" : "secondary"}>
                    {item.banned ? "banned" : "active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <ResetDevicesButton
                      id={item.id}
                      name={item.username ?? item.email}
                    />
                    <BanClientButton
                      id={item.id}
                      name={item.username ?? item.email}
                      banned={item.banned ?? false}
                    />
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center">
                  No clients found.
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

export default ClientsPage;
