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
import { listUsers } from "@/server/users";
import BanUserButton from "./_components/BanUserButton";

export const metadata: Metadata = {
  title: "Users | REGIX Studio",
  description: "Manage user accounts",
};

const UsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "all";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : 1) || 1,
  );

  const { items, total, pageCount } = await listUsers({ q, role, page });

  const query = (next: Record<string, string>) => {
    const current = new URLSearchParams();
    if (q) current.set("q", q);
    if (role !== "all") current.set("role", role);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }
    const text = current.toString();
    return text === "" ? "/admin/users" : `/admin/users?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Users</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "account" : "accounts"}, excluding your own
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
        <select
          name="role"
          defaultValue={role}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Role filter">
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="reseller">Reseller</option>
          <option value="user">User</option>
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
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Licenses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.username ?? item.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.email}
                </TableCell>
                <TableCell>{item.role ?? "user"}</TableCell>
                <TableCell>{item.provider ?? "None"}</TableCell>
                <TableCell>
                  <Badge variant={item.banned ? "outline" : "secondary"}>
                    {item.banned ? "banned" : "active"}
                  </Badge>
                </TableCell>
                <TableCell>{item._count.ownedLicenses}</TableCell>
                <TableCell className="text-right">
                  {item.role === "admin" ?
                    <span className="text-muted-foreground text-xs">
                      Protected
                    </span>
                  : <BanUserButton
                      id={item.id}
                      name={item.username ?? item.email}
                      banned={item.banned ?? false}
                    />
                  }
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center">
                  No users found.
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

export default UsersPage;
