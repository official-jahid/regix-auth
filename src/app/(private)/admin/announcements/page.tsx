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
import { listAnnouncements } from "@/server/announcements";
import AnnouncementRowActions from "./_components/AnnouncementRowActions";

export const metadata: Metadata = {
  title: "Announcements | REGIX Studio",
  description: "Manage member announcements",
};

const urgencyVariant = (urgency: string) =>
  urgency === "critical" ? "destructive"
  : urgency === "warning" ? "default"
  : "secondary";

const AnnouncementsPage = async () => {
  const items = await listAnnouncements();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Announcements</h1>
          <p className="text-muted-foreground text-sm">
            {items.length}{" "}
            {items.length === 1 ? "announcement" : "announcements"}
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className={buttonVariants({ variant: "default", size: "sm" })}>
          New announcement
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Seen by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge variant={urgencyVariant(item.urgency)}>
                    {item.urgency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.active ? "secondary" : "outline"}>
                    {item.active ? "active" : "hidden"}
                  </Badge>
                </TableCell>
                <TableCell>{item._count.acks}</TableCell>
                <TableCell className="text-right">
                  <AnnouncementRowActions
                    id={item.id}
                    title={item.title}
                    active={item.active}
                  />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center">
                  No announcements found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default AnnouncementsPage;
