import { headers } from "next/headers";
import Link from "next/link";
import { Metadata } from "next";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | REGIX Studio",
  description: "REGIX Studio administration",
};

const AdminPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = session?.user.role === "admin";

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold">Admin</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Taxonomy</CardTitle>
              <CardDescription>Categories and tags for posts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin/taxonomy"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                Open taxonomy
              </Link>
            </CardContent>
          </Card>
        )}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <CardDescription>Write and publish posts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin/posts"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                Open posts
              </Link>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Licenses</CardTitle>
            <CardDescription>Keys, redemptions, and renewals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/licenses"
              className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Open licenses
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Licensed product catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/products"
              className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Open products
            </Link>
          </CardContent>
        </Card>
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Your provider accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin/clients"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                Open clients
              </Link>
            </CardContent>
          </Card>
        )}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Accounts and bans.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin/users"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                Open users
              </Link>
            </CardContent>
          </Card>
        )}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Resellers</CardTitle>
              <CardDescription>
                Reseller accounts and providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin/resellers"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                Open resellers
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
