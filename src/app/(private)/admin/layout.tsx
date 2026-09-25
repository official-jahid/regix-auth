import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LayoutProps } from "@/lib/types";

const AdminLayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "reseller")
  ) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:gap-8 md:py-10">
      <aside
        className="w-full shrink-0 space-y-1 md:w-56"
        aria-label="admin-sidebar">
        <Link
          href="/admin"
          className="hover:bg-muted block rounded px-3 py-2">
          Overview
        </Link>
        {isAdmin && (
          <Link
            href="/admin/taxonomy"
            className="hover:bg-muted block rounded px-3 py-2">
            Taxonomy
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/posts"
            className="hover:bg-muted block rounded px-3 py-2">
            Posts
          </Link>
        )}
        <Link
          href="/admin/licenses"
          className="hover:bg-muted block rounded px-3 py-2">
          Licenses
        </Link>
        <Link
          href="/admin/products"
          className="hover:bg-muted block rounded px-3 py-2">
          Products
        </Link>
        <Link
          href="/admin/activations"
          className="hover:bg-muted block rounded px-3 py-2">
          Activations
        </Link>
        {!isAdmin && (
          <Link
            href="/admin/clients"
            className="hover:bg-muted block rounded px-3 py-2">
            Clients
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/users"
            className="hover:bg-muted block rounded px-3 py-2">
            Users
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/resellers"
            className="hover:bg-muted block rounded px-3 py-2">
            Resellers
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/announcements"
            className="hover:bg-muted block rounded px-3 py-2">
            Announcements
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/resources"
            className="hover:bg-muted block rounded px-3 py-2">
            Resources
          </Link>
        )}
        <Link
          href="/dashboard"
          className="hover:bg-muted block rounded px-3 py-2">
          Dashboard
        </Link>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default AdminLayout;
