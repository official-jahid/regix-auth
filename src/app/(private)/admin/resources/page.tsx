import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { listResources } from "@/server/resources";
import DeleteResourceButton from "./_components/DeleteResourceButton";

export const metadata: Metadata = {
  title: "Resources | REGIX Studio",
  description: "Manage member resources",
};

const ResourcesPage = async () => {
  const items = await listResources();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Resources</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} {items.length === 1 ? "resource" : "resources"}
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className={buttonVariants({ variant: "default", size: "sm" })}>
          New resource
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-md truncate">
                  {item.content}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteResourceButton
                    id={item.id}
                    title={item.title}
                  />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground text-center">
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default ResourcesPage;
