import {
  ArrowLeftIcon,
  BookOpenIcon,
  BotIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  KeyIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation - Regix Auth",
  description:
    "Complete documentation for Regix Auth - Universal authentication & authorization system",
};

const DocsPage = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6 pt-24">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Complete guide to setting up and using the Regix Auth system
        </p>
      </div>

      {/* Quick Start */}
      <Section
        icon={BookOpenIcon}
        title="Quick Start">
        <div className="space-y-4">
          <h3 className="font-semibold">Prerequisites</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Node.js 24+ and Bun</li>
            <li>SQLite (included, no setup needed)</li>
            <li>Discord Application (for OAuth & Bot features - optional)</li>
          </ul>

          <h3 className="font-semibold">Installation</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`# Clone the repository
git clone https://github.com/official-jahid/regix-auth.git
cd regix-auth

# Install dependencies
bun install

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Setup database and seed admin
bun run migrate
bun run prisma/seed.ts

# Start development server
bun run dev`}</code>
          </pre>

          <h3 className="font-semibold">Default Admin Account</h3>
          <div className="bg-muted rounded-lg p-4">
            <p>
              <strong>Email:</strong> admin@regix-auth.com
            </p>
            <p>
              <strong>Username:</strong> owner
            </p>
            <p>
              <strong>Password:</strong> RegixAdmin123!
            </p>
            <p className="text-destructive mt-2 text-sm">
              ⚠️ Change the default password immediately after first login!
            </p>
          </div>
        </div>
      </Section>

      {/* Authentication Methods */}
      <Section
        icon={ShieldIcon}
        title="Authentication Methods">
        <div className="space-y-6">
          {/* Email/Password */}
          <div>
            <h3 className="mb-2 font-semibold">📧 Email & Password</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              Traditional username/email + password authentication with bcryptjs
              hashing.
            </p>
            <p className="text-muted-foreground text-sm">
              Users can register at <code>/auth/register</code> and login at{" "}
              <code>/auth</code>. Passwords are hashed with 12 salt rounds.
            </p>
          </div>

          {/* Discord OAuth */}
          <div>
            <h3 className="mb-2 font-semibold">💬 Discord OAuth2</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              Full Discord OAuth2 integration for login and account linking.
            </p>
            <h4 className="mb-1 text-sm font-medium">Setup:</h4>
            <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://discord.com/developers/applications"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer">
                  Discord Developer Portal
                </a>
              </li>
              <li>Create an application and copy the Client ID</li>
              <li>
                Set <code>NEXT_PUBLIC_DISCORD_CLIENT_ID</code> and{" "}
                <code>DISCORD_CLIENT_SECRET</code> in .env
              </li>
              <li>
                Add redirect URI:{" "}
                <code>https://yourdomain.com/api/auth/discord/callback</code>
              </li>
            </ol>
          </div>

          {/* HWID/SID */}
          <div>
            <h3 className="mb-2 font-semibold">💻 HWID / SID Authentication</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              Hardware-based authentication for desktop applications, Windows
              Forms, DLLs, and terminal apps.
            </p>
            <p className="text-muted-foreground text-sm">
              External apps send HWID/SID payloads to{" "}
              <code>/api/device/verify</code> for validation. Users can update
              their SID (24h cooldown) and IP from the dashboard.
            </p>
          </div>

          {/* IP Authentication */}
          <div>
            <h3 className="mb-2 font-semibold">🌐 IP Authentication</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              Auto-detect user IP on login and store for security auditing.
              Admins can enable IP-locking on premium keys.
            </p>
            <p className="text-muted-foreground text-sm">
              Users can update their IP from the dashboard with auto-detect
              button.
            </p>
          </div>
        </div>
      </Section>

      {/* API Reference */}
      <Section
        icon={CodeIcon}
        title="API Reference">
        <p className="text-muted-foreground mb-6 text-sm">
          REST API endpoints for external application integration
        </p>

        <div className="space-y-4">
          <ApiEndpoint
            method="POST"
            path="/api/auth/login"
            description="Authenticate with email/username and password"
            body={`{ "email": "user@example.com", "username": "user", "password": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/register"
            description="Create a new user account"
            body={`{ "email": "...", "username": "...", "password": "...", "displayName": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/logout"
            description="Destroy current session"
            auth
          />
          <ApiEndpoint
            method="GET"
            path="/api/auth/session"
            description="Get current user session info"
            auth
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/register"
            description="Register a new device (HWID/SID)"
            auth
            body={`{ "hwid": "...", "sid": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/verify"
            description="Verify HWID/SID for external app authentication"
            body={`{ "username": "...", "hwid": "...", "sid": "...", "licenseKey": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/keys/generate"
            description="Generate premium license keys (Admin only)"
            auth
            body={`{ "count": 1, "duration": 30, "isLifetime": false }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/keys/redeem"
            description="Redeem a premium license key"
            auth
            body={`{ "key": "ABCDE-12345-FGHIJ-67890" }`}
          />
        </div>
      </Section>

      {/* Premium Keys */}
      <Section
        icon={KeyIcon}
        title="Premium License Keys">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Premium keys allow users to unlock premium features. Keys are
            generated by admins and redeemed by users.
          </p>

          <h3 className="font-semibold">Key Features</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              Configurable durations: 1 Day, 7 Days, 30 Days, 90 Days, 1 Year,
              Lifetime
            </li>
            <li>Bulk generation (up to 100 keys at once)</li>
            <li>IP-locking option to prevent sharing</li>
            <li>Admin can activate/deactivate/delete keys</li>
            <li>
              Key format: <code>XXXXX-XXXXX-XXXXX-XXXXX</code>
            </li>
          </ul>

          <h3 className="font-semibold">Admin Key Generation</h3>
          <p className="text-muted-foreground text-sm">
            Navigate to <code>/dashboard/admin</code> → License Keys tab →
            Generate License Keys section. Configure count, duration, and
            lifetime option.
          </p>
        </div>
      </Section>

      {/* Discord Bot */}
      <Section
        icon={BotIcon}
        title="Discord Bot">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Built-in Discord bot with slash commands for account management.
          </p>

          <h3 className="font-semibold">Setup</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`cd bot
bun install
# Set DISCORD_BOT_TOKEN in .env
bun dev`}</code>
          </pre>

          <h3 className="font-semibold">Commands</h3>
          <div className="space-y-2">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-sm">/auth link {"<email>"}</p>
              <p className="text-muted-foreground text-xs">
                Link your Discord account to Regix Auth
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-sm">/auth status</p>
              <p className="text-muted-foreground text-xs">
                Check your account status and premium info
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-sm">/auth premium</p>
              <p className="text-muted-foreground text-xs">
                View your premium subscription details
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-sm">/ping</p>
              <p className="text-muted-foreground text-xs">Check bot latency</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Admin Guide */}
      <Section
        icon={SettingsIcon}
        title="Admin Guide">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Access the admin panel at <code>/dashboard/admin</code>.
          </p>

          <h3 className="font-semibold">Features</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>User Management:</strong> View all users, their roles,
              devices, premium status, login history
            </li>
            <li>
              <strong>User Actions:</strong> Blacklist/unblacklist,
              activate/deactivate, change roles (USER/MOD/ADMIN), delete users
            </li>
            <li>
              <strong>Key Management:</strong> Generate single/bulk keys, view
              all keys, activate/deactivate/delete keys
            </li>
            <li>
              <strong>Dashboard Stats:</strong> Total users, active users,
              blacklisted users, key statistics
            </li>
          </ul>

          <h3 className="font-semibold">Admin Credentials</h3>
          <p className="text-muted-foreground text-sm">
            The default admin account is created during database seeding.
            Credentials are in your <code>.env</code> file.
          </p>
        </div>
      </Section>

      {/* User Guide */}
      <Section
        icon={UsersIcon}
        title="User Dashboard Guide">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            After logging in, users are redirected to <code>/dashboard</code>.
          </p>

          <h3 className="font-semibold">Dashboard Sections</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>Profile Header:</strong> Avatar, display name, role badge,
              premium status
            </li>
            <li>
              <strong>Info Cards:</strong> Provider, status (granted/denied),
              premium status, current IP
            </li>
            <li>
              <strong>Discord Account:</strong> Linked Discord info with ID copy
              button
            </li>
            <li>
              <strong>Update SID:</strong> Change SID with 24-hour cooldown
              countdown
            </li>
            <li>
              <strong>Update IP:</strong> Change IP with auto-detect button
            </li>
            <li>
              <strong>Update Discord:</strong> Link/change Discord user ID
            </li>
            <li>
              <strong>API Endpoints:</strong> Documentation of available API
              endpoints for external apps
            </li>
          </ul>
        </div>
      </Section>

      {/* Production Deployment */}
      <Section
        icon={GlobeIcon}
        title="Production Deployment">
        <div className="space-y-4">
          <h3 className="font-semibold">Environment Variables</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            <li>
              Set <code>NODE_ENV=production</code>
            </li>
            <li>
              Generate strong random strings for <code>SECRET_KEY</code>,{" "}
              <code>JWT_SECRET</code>, <code>SESSION_SECRET</code>
            </li>
            <li>
              Update <code>NEXT_PUBLIC_APP_URL</code> to your domain
            </li>
            <li>
              Update <code>DISCORD_REDIRECT_URI</code> for production
            </li>
          </ul>

          <h3 className="font-semibold">Build & Deploy</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`# Production build
bun run build

# Or full production check
bun run prod

# The output will be in the .next folder
# Deploy using: next start`}</code>
          </pre>

          <div className="bg-muted rounded-lg border-l-4 border-yellow-500 p-4">
            <p className="text-sm font-medium">⚠️ Security Notes</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-xs">
              <li>
                Never commit <code>.env</code> file to version control
              </li>
              <li>Use strong, unique passwords for admin account</li>
              <li>Enable HTTPS in production</li>
              <li>Regularly rotate JWT and session secrets</li>
              <li>Monitor audit logs for suspicious activity</li>
              <li>Set rate limiting on API endpoints for production</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Links */}
      <Section
        icon={FileTextIcon}
        title="Useful Links">
        <div className="space-y-2">
          <Link
            href="https://github.com/official-jahid/regix-auth"
            className="text-primary flex items-center gap-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer">
            GitHub Repository
          </Link>
          <Link
            href="https://regix-auth.onrender.com"
            className="text-primary flex items-center gap-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer">
            Live Demo
          </Link>
          <Link
            href="https://github.com/official-jahid/regix-auth/issues"
            className="text-primary flex items-center gap-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer">
            Report an Issue
          </Link>
        </div>
      </Section>
    </div>
  );
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Icon className="h-5 w-5" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ApiEndpoint({
  method,
  path,
  description,
  auth,
  body,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
}) {
  const colorMap = {
    GET: "text-blue-500",
    POST: "text-green-500",
    PATCH: "text-yellow-500",
    DELETE: "text-red-500",
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm font-bold ${colorMap[method]}`}>
          {method}
        </span>
        <span className="font-mono text-sm">{path}</span>
        {auth && (
          <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-500">
            AUTH
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      {body && (
        <pre className="bg-background mt-2 overflow-x-auto rounded p-2 text-xs">
          <code>Body: {body}</code>
        </pre>
      )}
    </div>
  );
}

export default DocsPage;
