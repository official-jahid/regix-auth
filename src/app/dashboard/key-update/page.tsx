import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import KeyUpdateClient from "./KeyUpdateClient";

export const metadata: Metadata = {
  title: "Key Update Required | Regix Auth",
  description: "Update your access key to regain access",
};

export default async function KeyUpdatePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  return <KeyUpdateClient />;
}
