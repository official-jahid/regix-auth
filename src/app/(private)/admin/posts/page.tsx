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
import { listPosts } from "@/server/posts";
import DeletePostButton from "./_components/DeletePostButton";

export const metadata: Metadata = {
  title: "Posts | REGIX Studio",
  description: "Manage posts",
};

const statusVariant = (status: string) =>
  status === "published" ? "secondary"
  : status === "archived" ? "outline"
  : "default";

const PostsPage = async ({
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

  const { items, total, pageCount } = await listPosts({ q, status, page });

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
    return text === "" ? "/admin/posts" : `/admin/posts?${text}`;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Posts</h1>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "post" : "posts"}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className={buttonVariants({ variant: "default", size: "sm" })}>
          New post
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search title or slug"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          className="border-input bg-background rounded border px-3 py-2 text-sm"
          aria-label="Status filter">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
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
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.slug}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.categories.length === 0 ?
                    "None"
                  : item.categories.map((link) => link.category.name).join(", ")
                  }
                </TableCell>
                <TableCell>
                  {item.tags.length === 0 ?
                    "None"
                  : item.tags.map((link) => link.tag.name).join(", ")}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/posts/${item.id}/edit`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}>
                      Edit
                    </Link>
                    <DeletePostButton
                      id={item.id}
                      title={item.title}
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
                  No posts found.
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

export default PostsPage;
