import {
  ArrowLeftIcon,
  BookOpenIcon,
  BotIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  KeyIcon,
  SettingsIcon,
  TerminalIcon,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation - Regix Auth",
  description: "Complete documentation for Regix Auth authentication system",
};

const DocsPage = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6 pt-24">
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

      <Section
        icon={BookOpenIcon}
        title="Quick Start">
        <div className="space-y-4">
          <h3 className="font-semibold">Prerequisites</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>Node.js 24+ and Bun</li>
            <li>SQLite (included)</li>
            <li>Discord Application (optional)</li>
          </ul>
          <h3 className="font-semibold">Installation</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`git clone https://github.com/official-jahid/regix-auth.git
cd regix-auth
bun install
cp .env.example .env
bun run migrate
bun run db:seed
bun run dev  # Starts web + Discord bot`}</code>
          </pre>
          <h3 className="font-semibold">Default Admin</h3>
          <div className="bg-muted rounded-lg p-4">
            <p>
              <strong>Email:</strong> jahidekbalmallick@gmail.com
            </p>
            <p>
              <strong>Username:</strong> ceojahid
            </p>
            <p className="text-destructive mt-2 text-sm">
              ⚠️ Change password on first login!
            </p>
          </div>
        </div>
      </Section>

      <Section
        icon={TerminalIcon}
        title="Service API (Automation)">
        <p className="text-muted-foreground mb-4 text-sm">
          Use this endpoint for PowerShell scripts, Cloudflare Workers, CI/CD
          pipelines, or any CLI-automation. Requires <code>SECRET_KEY</code> for
          server-to-server authentication.
        </p>

        <div className="space-y-4">
          <div className="bg-muted border-primary rounded-lg border-l-4 p-4">
            <h3 className="mb-2 font-semibold">PowerShell Example</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`$secretKey = "RegixSecretKey2024!@#$%^"
$body = @{
  action = "verify"
  secretKey = $secretKey
  username = "ceojahid"
  password = "RegixAdmin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/service/auth" \\
  -Method POST -Body $body -ContentType "application/json"`}</code>
            </pre>
          </div>

          <div className="bg-muted rounded-lg border-l-4 border-orange-500 p-4">
            <h3 className="mb-2 font-semibold">Cloudflare Worker Example</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`export default {
  async fetch(request, env) {
    const auth = await fetch("https://yourdomain.com/api/service/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkLicense",
        secretKey: env.SECRET_KEY,
        licenseKey: request.headers.get("X-License-Key")
      })
    });
    const result = await auth.json();
    if (!result.valid) return Response.json({ error: "Invalid license" }, { status: 403 });
    // Proceed with your worker logic...
  }
}`}</code>
            </pre>
          </div>

          <div className="bg-muted rounded-lg border-l-4 border-green-500 p-4">
            <h3 className="mb-2 font-semibold">cURL Example</h3>
            <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
              <code>{`curl -X POST http://localhost:3000/api/service/auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "verify",
    "secretKey": "RegixSecretKey2024!@#$%^",
    "username": "ceojahid",
    "password": "RegixAdmin123!",
    "licenseKey": "ABCDE-12345-FGHIJ-67890"
  }'`}</code>
            </pre>
          </div>
        </div>

        <h3 className="mt-6 mb-2 font-semibold">Available Actions</h3>
        <div className="space-y-3">
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "verify", "secretKey": "...", "username": "...", "password": "...", "licenseKey"?: "..." }`}
            description="Verify user credentials and optionally validate a license key. Auto-redeems unredeemed keys."
          />
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "registerDevice", "secretKey": "...", "username": "...", "password": "...", "hwid": "...", "sid"?: "..." }`}
            description="Register or update a device by HWID for the authenticated user."
          />
          <ApiEndpoint
            method="POST"
            path="/api/service/auth"
            body={`{ "action": "checkLicense", "secretKey": "...", "licenseKey": "..." }`}
            description="Check the validity and status of a license key without authentication."
          />
        </div>
      </Section>

      <Section
        icon={CodeIcon}
        title="REST API Reference">
        <p className="text-muted-foreground mb-4 text-sm">
          Session-based API endpoints for web integration.
        </p>
        <div className="space-y-3">
          <ApiEndpoint
            method="POST"
            path="/api/auth/login"
            description="Login with email/username + password"
            body={`{ "email": "...", "username": "...", "password": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/register"
            description="Create a new account"
            body={`{ "email": "...", "username": "...", "password": "...", "displayName": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/send-otp"
            description="Send email OTP for verification or password reset"
            body={`{ "email": "...", "type": "EMAIL_VERIFICATION"|"PASSWORD_RESET" }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/verify-otp"
            description="Verify an OTP code"
            body={`{ "email": "...", "code": "123456", "type": "EMAIL_VERIFICATION"|"PASSWORD_RESET" }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/forgot-password"
            description="Send password reset OTP"
            body={`{ "email": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/reset-password"
            description="Reset password with OTP"
            body={`{ "email": "...", "code": "123456", "newPassword": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/auth/logout"
            description="Destroy session"
            auth
          />
          <ApiEndpoint
            method="GET"
            path="/api/auth/session"
            description="Get current user session"
            auth
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/register"
            description="Register a device (HWID/SID)"
            auth
            body={`{ "hwid": "...", "sid": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/device/verify"
            description="Verify HWID/SID for external app auth"
            body={`{ "username": "...", "hwid": "...", "sid": "...", "licenseKey": "..." }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/keys/generate"
            description="Generate premium keys (Admin)"
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
          <ApiEndpoint
            method="PATCH"
            path="/api/user/update-profile"
            description="Update display name, avatar, username"
            auth
            body={`{ "displayName": "...", "avatarUrl": "...", "username": "..." }`}
          />
          <ApiEndpoint
            method="PATCH"
            path="/api/user/update-credentials"
            description="Change password"
            auth
            body={`{ "currentPassword": "...", "newPassword": "..." }`}
          />
        </div>
      </Section>

      <Section
        icon={BotIcon}
        title="Discord Bot">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Built-in Discord bot runs together with the web server.
          </p>
          <h3 className="font-semibold">Start</h3>
          <pre className="bg-muted overflow-x-auto rounded-lg p-4">
            <code>{`bun run dev     # Web + Bot together
bun run bot     # Bot only`}</code>
          </pre>
          <h3 className="font-semibold">Admin Commands</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "/genkey",
              "/genlicense",
              "/genuser",
              "/blacklist",
              "/unblacklist",
              "/whitelist",
              "/unwhitelist",
              "/reset",
            ].map((cmd) => (
              <div
                key={cmd}
                className="bg-muted rounded-lg p-2 font-mono text-xs">
                {cmd}
              </div>
            ))}
          </div>
          <h3 className="font-semibold">User Commands</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {["/userinfo", "/keyinfo", "/licenseinfo", "/stats", "/ping"].map(
              (cmd) => (
                <div
                  key={cmd}
                  className="bg-muted rounded-lg p-2 font-mono text-xs">
                  {cmd}
                </div>
              ),
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={KeyIcon}
        title="Premium License Keys">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            Configurable durations: 1 Day, 7 Days, 30 Days, 90 Days, 1 Year,
            Lifetime
          </li>
          <li>Bulk generation (up to 100 keys at once)</li>
          <li>IP-locking to prevent sharing</li>
          <li>
            Key format: <code>XXXXX-XXXXX-XXXXX-XXXXX</code>
          </li>
          <li>
            Admin panel at <code>/dashboard/admin</code>
          </li>
        </ul>
      </Section>

      <Section
        icon={SettingsIcon}
        title="Admin Guide">
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>User Management:</strong> View, blacklist, activate, change
            roles, delete
          </li>
          <li>
            <strong>Key Management:</strong> Generate, view, activate/deactivate
            keys
          </li>
          <li>
            <strong>Dashboard Stats:</strong> Total users, active, blacklisted,
            keys
          </li>
          <li>
            Access at <code>/dashboard/admin</code>
          </li>
        </ul>
      </Section>

      <Section
        icon={GlobeIcon}
        title="Production Deployment">
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
            <code>bun run build && next start</code>
          </li>
          <li>Enable HTTPS and rate limiting for production</li>
        </ul>
      </Section>

      <Section
        icon={FileTextIcon}
        title="Links">
        <div className="space-y-2">
          <Link
            href="https://github.com/official-jahid/regix-auth"
            className="text-primary block hover:underline"
            target="_blank">
            GitHub Repository
          </Link>
          <Link
            href="https://github.com/official-jahid/regix-auth/issues"
            className="text-primary block hover:underline"
            target="_blank">
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
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
}) {
  const colorMap: Record<string, string> = {
    GET: "text-blue-500",
    POST: "text-green-500",
    PATCH: "text-yellow-500",
    DELETE: "text-red-500",
  };
  return (
    <div className="bg-muted rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-mono text-xs font-bold ${colorMap[method] || "text-gray-500"}`}>
          {method}
        </span>
        <span className="font-mono text-xs">{path}</span>
        {auth && (
          <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
            AUTH
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      {body && (
        <pre className="bg-background mt-1 overflow-x-auto rounded p-2 text-[10px]">
          <code>Body: {body}</code>
        </pre>
      )}
    </div>
  );
}

export default DocsPage;
