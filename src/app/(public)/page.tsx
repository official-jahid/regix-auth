import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "REGIX Studio",
  description: "Accounts, roles, and content in one place",
};

const highlights = [
  {
    title: "Auth and roles",
    text: "Email or username login with admin and user roles.",
  },
  {
    title: "Taxonomy and posts",
    text: "Nested categories, tags, and a full post editor.",
  },
  {
    title: "Private dashboards",
    text: "Session guarded pages with role based access.",
  },
];

const PublicHomePage = () => {
  return (
    <main className="grid flex-1 place-items-center px-4 py-6 sm:py-10">
      <section className="w-full max-w-3xl space-y-4 text-center sm:space-y-6">
        <Badge variant="secondary">Accounts, content, and roles</Badge>

        <h1 className="text-3xl font-semibold text-balance sm:text-6xl">
          REGIX Studio
        </h1>

        <p className="text-muted-foreground mx-auto max-w-xl text-base text-pretty sm:text-xl">
          Accounts, roles, and content in one place. Sign in to manage taxonomy,
          publish posts, and run your studio.
        </p>

        <div>
          <Link
            href="/register"
            className={buttonVariants({ variant: "default", size: "lg" })}>
            Get started
          </Link>
        </div>

        <div className="grid gap-2 pt-1 text-left sm:grid-cols-3 sm:gap-3 sm:pt-2">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardHeader className="gap-1 p-4 sm:p-5">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-sm">
                  {item.text}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default PublicHomePage;
