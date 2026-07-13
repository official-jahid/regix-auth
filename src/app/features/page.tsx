import {
    ArrowRight,
    Bell,
    Bot,
    CheckCircle2,
    ChevronRight,
    Cpu,
    Gauge,
    Globe,
    Key,
    Layers,
    Lock,
    MessageSquare,
    Server,
    Shield,
    Sparkles,
    Users,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | Regix Auth",
  description:
    "Explore all features of Regix Auth — a comprehensive authentication and authorization system with Discord bot, HWID/SID licensing, and security hardening.",
};

const features = [
  {
    title: "Authentication Flow",
    icon: Lock,
    description:
      "Secure email/password authentication with OTP email verification, Discord OAuth2 integration, and 7-day session management.",
    highlights: [
      "Register requires valid license key (IP-locked)",
      "Email verification via 6-digit OTP (10-minute expiry)",
      "Login sets session cookie + CSRF token",
      "Sessions expire after 7 days",
    ],
  },
  {
    title: "Discord Bot Integration",
    icon: Bot,
    description:
      "Full-featured Discord bot with auto-discovery command loading, role-based permissions, and super admin bypass.",
    highlights: [
      "Everyone commands: /help, /stats, /userinfo, /keyinfo",
      "Admin commands: /genuser, /blacklist, /genlicense, /reset",
      "Super admin hardcoded bypass (ID: 1076183559796183242)",
      "Auto-discovery command loader with multi-command support",
    ],
  },
  {
    title: "Premium License System",
    icon: Key,
    description:
      "Sophisticated license key management supporting lifetime and timed keys with HWID/SID hardware binding.",
    highlights: [
      "Format: XXXXX-XXXXX-XXXXX-XXXXX (20 chars, uppercase)",
      "Duration in days or lifetime (0 = lifetime)",
      "IP locking prevents account sharing",
      "Device (HWID/SID) verification for desktop apps",
    ],
  },
  {
    title: "Security Architecture",
    icon: Shield,
    description:
      "Multi-layered security with rate limiting, brute force protection, CSRF, and comprehensive security headers.",
    highlights: [
      "Rate limiting: 5/min (auth), 20/min (API), 60/min (bot)",
      "Brute force: Exponential backoff (30s → 2h), blocks after 5 attempts",
      "CSRF: Double-submit cookie pattern with 32-char random tokens",
      "Security headers: HSTS, X-Frame-Options, X-Content-Type-Options",
    ],
  },
  {
    title: "Role Hierarchy",
    icon: Layers,
    description:
      "Hierarchical role-based access control system with 6 tiers spanning from Owner down to regular User.",
    highlights: [
      "OWNER (100) — Bypasses all checks",
      "ADMIN (80) — Full admin access",
      "MODERATOR (60) — Moderation access",
      "DISTRIBUTOR (40) / RESELLER (20) / USER (0)",
    ],
  },
  {
    title: "Admin Panel",
    icon: Gauge,
    description:
      "Comprehensive admin dashboard for user management, license key generation, and system oversight.",
    highlights: [
      "User management: blacklist, activate, role changes, delete",
      "License key generation: 1-100 keys, configurable duration",
      "System statistics and monitoring",
      "Audit log tracking for admin actions",
    ],
  },
  {
    title: "Chat System",
    icon: MessageSquare,
    description:
      "Real-time direct messaging between users with reactions, editing, and automatic message expiration.",
    highlights: [
      "Direct messaging with 3-second polling",
      "Message reactions with emoji picker",
      "Edit/delete own messages",
      "Automatic message expiration (24 hours)",
    ],
  },
  {
    title: "Notification System",
    icon: Bell,
    description:
      "Full notification infrastructure with create, bulk broadcast, read tracking, and automatic cleanup.",
    highlights: [
      "Create notifications for individual users",
      "Bulk broadcast to multiple users",
      "Mark single or all as read",
      "Automatic cleanup of old notifications (30 days)",
    ],
  },
  {
    title: "Device Authentication",
    icon: Cpu,
    description:
      "Hardware-based authentication using HWID (Hardware ID) and SID (Security Identifier) for desktop app security.",
    highlights: [
      "HWID + SID tracking with IP lockdown",
      "24-hour cooldown for SID changes",
      "Device verification API for desktop apps",
      "IP lock prevents account sharing",
    ],
  },
  {
    title: "User Dashboard",
    icon: Users,
    description:
      "Personal dashboard for session management, device tracking, and premium status overview.",
    highlights: [
      "View and manage active sessions",
      "Track registered devices",
      "Premium status and license info",
      "Login history with IP detection",
    ],
  },
  {
    title: "API Architecture",
    icon: Server,
    description:
      "RESTful API with dedicated endpoints for auth, admin, bot, device, keys, chat, and notifications.",
    highlights: [
      "Bot API with SECRET_KEY Bearer auth",
      "Admin endpoints for user and key management",
      "Device verification endpoints",
      "Chat and notification APIs",
    ],
  },
  {
    title: "OAuth Integration",
    icon: Globe,
    description:
      "Discord OAuth2 integration for seamless authentication with Discord accounts.",
    highlights: [
      "Link Discord accounts to user profiles",
      "Store discordId, username, discriminator",
      "Automatic avatar sync",
      "OAuth callback handling",
    ],
  },
];

const techStack = [
  { category: "Framework", items: "Next.js 16.2 + React 19.2 (App Router)" },
  { category: "Database", items: "Prisma 7 with libSQL (SQLite)" },
  {
    category: "Styling",
    items: "Tailwind CSS v4 + shadcn/ui (base-luma preset)",
  },
  { category: "UI Primitives", items: "@base-ui/react (not Radix)" },
  { category: "Icons", items: "Lucide React" },
  { category: "Package Manager", items: "Bun (npm >= 11 compatible)" },
  { category: "Bot Library", items: "discord.js v14" },
  { category: "Auth", items: "bcryptjs + jsonwebtoken (7-day expiry)" },
  { category: "Email", items: "Resend API for OTP emails" },
  { category: "Theme", items: "next-themes (dark default)" },
];

const botCommands = [
  {
    category: "Everyone",
    commands: [
      { name: "/help", description: "Show help menu" },
      { name: "/stats", description: "View system statistics" },
      { name: "/userinfo [user]", description: "Get user information" },
      { name: "/keyinfo [key]", description: "Get license key info" },
    ],
  },
  {
    category: "Admin / Mod",
    commands: [
      { name: "/genuser", description: "Create user account" },
      { name: "/blacklist", description: "Blacklist user" },
      { name: "/unblacklist", description: "Unblacklist user" },
      { name: "/whitelist", description: "Add to whitelist" },
      { name: "/unwhitelist", description: "Remove from whitelist" },
      { name: "/genlicense", description: "Generate license keys" },
      { name: "/resetpassword", description: "Reset user password" },
      { name: "/resetusername", description: "Reset user username" },
    ],
  },
  {
    category: "Verification (WIP)",
    commands: [
      { name: "/verification setup_role", description: "Set verified role" },
      {
        name: "/verification setup_channel",
        description: "Set verification channel",
      },
      { name: "/verification enable", description: "Enable verification" },
      { name: "/verification disable", description: "Disable verification" },
    ],
  },
  {
    category: "Anti-Nuke / Anti-Raid (WIP)",
    commands: [
      { name: "/settings antinuke", description: "Enable/disable/view anti-nuke" },
      { name: "/settings antiraid", description: "Enable/disable anti-raid" },
      { name: "/settings antispam", description: "Enable/disable anti-spam" },
    ],
  },
];

const PlansSection = () => (
  <section className="mx-auto mb-24 max-w-6xl px-4">
    <h2 className="mb-12 text-center text-4xl font-bold tracking-tight">
      Project Roadmap
    </h2>
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <CheckCircle2 className="size-5 text-green-500" />
          Foundation
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Next.js 16 + React 19 App Router",
            "Prisma 7 + SQLite database schema",
            "Email/password + Discord OAuth",
            "Admin seed and panel basics",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="size-5 text-amber-500" />
          In Progress
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Discord bot command auto-discovery",
            "Bot API endpoints with SECRET_KEY auth",
            "Verification system",
            "Anti-nuke / Anti-raid / Anti-spam",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Gauge className="size-5 text-blue-500" />
          Upcoming
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Admin key management page",
            "Analytics/stats dashboard",
            "2FA via TOTP/OTP",
            "Production deployment & CI/CD",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Gauge className="mt-0.5 size-4 shrink-0 text-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <Sparkles className="size-4 text-primary" />
            v1.0.0 — Comprehensive Auth System
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
            <a
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl">
              Get Started
              <ArrowRight className="size-4" />
            </a>
            <a
              href="https://github.com/official-jahid/regix-auth"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground">
              View on GitHub
              <Globe className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto mb-24 max-w-6xl px-4">
        <h2 className="mb-12 text-center text-4xl font-bold tracking-tight">
          Tech Stack
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((tech) => (
            <div
              key={tech.category}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                {tech.category}
              </h3>
              <p className="text-sm font-semibold">{tech.items}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto mb-24 max-w-6xl px-4">
        <div className="mb-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Everything You Need
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete authentication, authorization, and management platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="space-y-1.5">
                  {feature.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="mt-0.5 size-3 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bot Commands */}
      <section className="mx-auto mb-24 max-w-6xl px-4">
        <h2 className="mb-12 text-center text-4xl font-bold tracking-tight">
          Discord Bot Commands
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {botCommands.map((group) => (
            <div key={group.category} className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">{group.category}</h3>
              <div className="space-y-2">
                {group.commands.map((cmd) => (
                  <div
                    key={cmd.name}
                    className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 px-4 py-2.5">
                    <code className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                      {cmd.name}
                    </code>
                    <span className="text-right text-xs text-muted-foreground">
                      {cmd.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Roadmap */}
      <PlansSection />

      {/* CTA */}
      <section className="mx-auto mb-24 max-w-4xl px-4 text-center">
        <div className="rounded-3xl border bg-gradient-to-b from-primary/5 to-transparent p-12 shadow-sm">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Deploy your own instance or explore the source code on GitHub.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl">
              Sign In
              <ArrowRight className="size-4" />
            </a>
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-8 py-3 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground">
              Create Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}