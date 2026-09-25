import { headers } from "next/headers";
import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import { getMyAnnouncements } from "@/server/announcements";
import { getMyLicense } from "@/server/client";
import { getMemberResources } from "@/server/resources";
import RedeemLicenseForm from "./_components/RedeemLicenseForm";
import MemberAnnouncements from "./_components/MemberAnnouncements";
import {
  MyDeviceList,
  RequestRenewalButton,
} from "./_components/MyLicenseControls";

export const metadata: Metadata = {
  title: "Dashboard | REGIX Studio",
  description: "Your REGIX Studio overview",
};

const licenseStatus = (expiresAt: Date | null) => {
  if (!expiresAt) return { label: "lifetime", variant: "secondary" as const };
  if (expiresAt < new Date())
    return { label: "expired", variant: "outline" as const };
  return { label: "active", variant: "secondary" as const };
};

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { license, reseller } =
    session?.user.role === "user" ?
      await getMyLicense()
    : { license: null, reseller: null };
  const derived = license ? licenseStatus(license.expiresAt) : null;
  const announcements = session ? await getMyAnnouncements() : [];
  const resources =
    session?.user.role !== "user" || license ? await getMemberResources() : [];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <h1 className="text-4xl font-semibold">
        Welcome, {session?.user.name ?? "member"}
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your current session details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Email: {session?.user.email}</p>
            <p>Role: {session?.user.role ?? "user"}</p>
          </CardContent>
        </Card>

        {(session?.user.role === "admin" ||
          session?.user.role === "reseller") && (
          <Card>
            <CardHeader>
              <CardTitle>
                {session?.user.role === "admin" ? "Admin" : "Reseller"}
              </CardTitle>
              <CardDescription>
                {session?.user.role === "admin" ?
                  "Manage the studio."
                : "Manage licenses for your provider."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/admin"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })}>
                {session?.user.role === "admin" ?
                  "Open admin"
                : "Open licenses"}
              </Link>
            </CardContent>
          </Card>
        )}

        {session?.user.role === "user" && !license && (
          <Card>
            <CardHeader>
              <CardTitle>My license</CardTitle>
              <CardDescription>
                Redeem a key to activate your access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RedeemLicenseForm />
            </CardContent>
          </Card>
        )}

        {session?.user.role === "user" && license && derived && (
          <Card>
            <CardHeader>
              <CardTitle>My license</CardTitle>
              <CardDescription>
                {license.product?.name ?? license.provider} ·{" "}
                {license.expiresAt ?
                  `expires ${license.expiresAt.toLocaleDateString()}`
                : "lifetime access"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={derived.variant}>{derived.label}</Badge>
                {license.renewals.length > 0 && (
                  <Badge variant="outline">renewal pending</Badge>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Devices</p>
                <MyDeviceList devices={license.activations} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {license.renewals.length === 0 && (
                  <RequestRenewalButton licenseId={license.id} />
                )}
                {reseller && (
                  <span className="text-muted-foreground text-xs">
                    Reseller: {reseller.username} · {reseller.email}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MemberAnnouncements items={announcements} />

      {resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              Commands, files, videos, and links from your admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="border-input rounded border px-3 py-2">
                  <p className="text-sm font-medium">
                    {resource.title}{" "}
                    <Badge variant="secondary">{resource.type}</Badge>
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm break-all whitespace-pre-wrap">
                    {resource.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default DashboardPage;
