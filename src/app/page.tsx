import {
  ArrowRight,
  BookOpen,
  Bot,
  Github,
  Key,
  Layers,
  Shield,
  Sparkles,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regix Auth — Authentication & Authorization System",
  description:
    "A comprehensive authentication and authorization system with Discord bot integration, HWID/SID licensing, and premium key management.",
};

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: typeof Sparkles;
  external?: boolean;
}

const quickLinks: QuickLink[] = [
  {
    title: "Features",
    description: "Explore all features and capabilities",
    href: "/features",
    icon: Sparkles,
  },
  {
    title: "Documentation",
    description: "View the full project documentation",
    href: "https://github.com/official-jahid/regix-auth",
    icon: BookOpen,
    external: true,
  },
  {
    title: "Get Started",
    description: "Sign in or create an account",
    href: "/auth",
    icon: ArrowRight,
  },
];

const highlights = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Rate limiting, brute force protection, CSRF, and comprehensive security headers.",
  },
  {
    icon: Bot,
    title: "Discord Bot",
    description:
      "Full-featured bot with auto-discovery command loading and role-based permissions.",
  },
  {
    icon: Key,
    title: "License Management",
    description:
      "Premium key generation, HWID/SID binding, and IP locking.",
  },
  {
    icon: Layers,
    title: "Role Hierarchy",
    description:
      "6-tier hierarchical access control from Owner to regular User.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <Github className="size-4" />
            Open Source — MIT License
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Regix{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Auth
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            A comprehensive authentication and authorization system for web
            applications, desktop applications, and Windows Forms. Featuring
            role-based access control, premium license key management, and
            hardware-based HWID/SID authentication.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto mb-24 max-w-6xl px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto mb-24 max-w-6xl px-4">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          Explore
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const content = (
              <>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary">
                    {link.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </>
            );

            return link.external ? (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                {content}
              </a>
            ) : (
              <Link
                key={link.title}
                href={link.href as any}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}