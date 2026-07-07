import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regix Auth - Authentication & Authorization System",
  description:
    "Enterprise-grade authentication system for web apps, desktop applications, and more.",
};

const HomePage = () => {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-4 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-primary/10 text-primary mb-8 inline-block rounded-full px-4 py-1.5 text-sm font-medium">
            🔐 Version 1.0.0
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Regix{" "}
            <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
              Auth
            </span>
          </h1>
          <p className="text-muted-foreground mb-8 text-xl">
            Universal authentication & authorization system for web apps,
            desktop applications, Windows Forms, DLLs, terminal apps, and more.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors">
              Get Started
            </Link>
            <Link
              href="/auth/register"
              className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-11 items-center justify-center rounded-md border px-8 text-sm font-medium shadow-sm transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Authentication Methods
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    title: "Email & Password",
    description:
      "Traditional authentication with secure password hashing using bcryptjs.",
    icon: "📧",
  },
  {
    title: "Discord OAuth2",
    description:
      "Seamless Discord account linking with full OAuth2 integration.",
    icon: "💬",
  },
  {
    title: "HWID / SID Authentication",
    description:
      "Hardware-based authentication for desktop apps, Windows Forms, and DLLs.",
    icon: "💻",
  },
  {
    title: "IP Authentication & Locking",
    description:
      "Auto-detect and lock accounts to specific IP addresses for enhanced security.",
    icon: "🌐",
  },
  {
    title: "Premium License Keys",
    description:
      "Generate and manage premium keys with configurable durations including lifetime.",
    icon: "🔑",
  },
  {
    title: "Admin Dashboard",
    description:
      "Full admin panel to manage users, keys, blacklist, and view analytics.",
    icon: "⚙️",
  },
];

export default HomePage;
