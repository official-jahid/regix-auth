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
import { listTags } from "@/server/tags";
import DeleteTagButton from "./_components/DeleteTagButton";

export const metadata: Metadata = {
  title: "Tags | REGIX Studio",
  description: "Manage post tags",
};

const TagsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const sort = typeof params.sort === "string" ? params.sort : "manual";
  const dir = typeof params.dir === "string" ? params.dir : "asc";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : 1) || 1,
  );

  const { items, total, pageCount } = await listTags({
    q,
    status,
    sort,
    dir,
    page,
  });

  const query = (next: Record<string, string>) => {
    const current = new URLSearchParams();
    if (q) current.set("q", q);
    if (status !== "all") current.set("status", status);
    if (sort !== "manual") current.set("sort", sort);
    if (dir !== "asc") current.set("dir", dir);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    }
    const text = current.toString();
    return text === "" ?
        "/admin/taxonomy/tags"
      : `/admin/taxonomy/tags?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Tags</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "tag" : "tags"}
          </p>
        </div>
        <span className="flex items-center gap-2">
          <Link
            href="/admin/taxonomy/categories"
            className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Categories
          </Link>
          <Link
            href="/admin/taxonomy/tags/new"
            className={buttonVariants({ variant: "default", size: "sm" })}>
            New tag
          </Link>
        </span>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name or slug"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Status filter">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
              <TableHead>
                <Link
                  href={query({
                    sort: "name",
                    dir: dir === "asc" ? "desc" : "asc",
                  })}>
                  Name
                </Link>
              </TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.slug}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "active" ? "secondary" : "outline"
                    }>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>{item._count.posts}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/taxonomy/tags/${item.id}/edit`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}>
                      Edit
                    </Link>
                    <DeleteTagButton
                      id={item.id}
                      name={item.name}
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
                  No tags found.
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

export default TagsPage;
