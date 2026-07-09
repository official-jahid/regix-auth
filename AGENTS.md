<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:form-patterns -->

# Form Patterns

Schemas in `src/lib/zodSchema.ts` — export both schema and `type X = z.infer<typeof xSchema>`.

Components use `"use client"`, `react-hook-form` + `@hookform/resolvers/zod`, and shadcn primitives:

```typescript
const { handleSubmit, control, formState: { isSubmitting } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
  mode: "all",
});
```

Each field goes through `Controller`:

```typescript
<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Label</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} autoComplete="..." />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Submit: `<form onSubmit={handleSubmit(handler)} noValidate>`. Button disabled while submitting with icon toggle.

See existing examples under `src/components/Auth/`.

<!-- END:form-patterns -->

## Agent behavior

- **Ask questions.** When the request is ambiguous, when there are real implementation choices with tradeoffs, or before any non-obvious / destructive action, use the `question` tool to confirm. Prefer one short batched question over back-and-forth guessing.
- **Remember new learning.** When you discover something non-obvious about this repo — a gotcha, a convention, a fix, a command that wasn't documented — add it back to this file (or a clearly-scoped section) so future sessions benefit. Keep entries concise and high-signal; delete stale ones.
- **Use available skills and MCPs.** Before writing code for a task that matches a listed skill (e.g. `shadcn`, `prisma-*`, `next-*`, `better-auth-*`, `vercel-react-*`, `zod`, etc.), load it with the `skill` tool. And MCPs that are directly relevant to this stack e.g. **`shadcn`** (local; component registry / audit) and **`better-auth`** (remote; auth setup). Use them when the task fits instead of guessing from training data.

## Discord Bot Architecture

- Entry: `src/bot/start.ts` → `src/bot/index.ts` (`startBot()`). The bot runs as a separate process via `concurrently` in `dev`, `start`, and `prod` scripts.
- Command auto-discovery: `src/bot/index.ts` recursively loads all `.ts`/`.js` files from `src/bot/commands/`. Supports two formats:
  - **Single-command files** (e.g., `genkey.ts`, `help.ts`): export `data` (SlashCommandBuilder) + `execute` function.
  - **Multi-command files** (e.g., `admin.ts`): export named pairs like `genuserData`/`genuserExecute`, `blacklistData`/`blacklistExecute`, etc. The auto-loader discovers any export ending in `Data` that is a `SlashCommandBuilder`, then looks for the matching `${baseName}Execute` function.
- Commands are registered globally on `clientReady` via REST API (`Routes.applicationCommands`).
- Bot commands call internal API endpoints under `/api/bot/*` using `SECRET_KEY` as Bearer token auth.
- **Super Admin:** User ID `1076183559796183242` is hardcoded in `src/bot/utils/permissions.ts` as `SUPER_ADMIN_USER_ID`. This user bypasses all role checks and can run any command. Managed by `isSuperAdmin()`, integrated into `isAdmin()` and `isMod()`.
- **Bot API endpoints:**
  - `POST /api/bot/keys/generate` — Generate premium license keys (auth: Bearer `SECRET_KEY`)
  - `POST /api/bot/keys/info` — Get key/license info
  - `POST /api/bot/users/manage` — CRUD: `find`, `create`, `blacklist`, `unblacklist`, `reset` (sessions), `resetPassword`, `resetUsername`, `list`
  - `POST /api/bot/whitelist/modify` — `add`/`remove` whitelist entries
  - `POST /api/bot/whitelist/check` — Check whitelist status
- `src/bot/utils/api.ts` wraps all API calls — import functions from here in command files, never call `fetch` directly.

## Stack at a glance

- Next.js 16.2 + React 19.2 (App Router, Turbopack default, React Compiler on, `typedRoutes` on)
- Prisma 7 with `@prisma/adapter-libsql` (SQLite, file-backed)
- Tailwind CSS v4 (CSS-only config in `globals.css`; no `tailwind.config.ts`)
- shadcn/ui with the `base-luma` style preset; primitives from `@base-ui/react` (not Radix)
- `next-themes` (default `dark`, `enableSystem={false}`), `react-toastify`, `lucide-react`
- `@t3-oss/env-nextjs` + Zod for env validation

## Verification

- **Primary check**: `bun lint` — runs `eslint` with `eslint-config-next` core-web-vitals + typescript.
- **Secondary / type gate**: `bun run build`. There is no separate `typecheck` script and no test framework; TypeScript errors surface only during the build.
- **Full prod check**: `bun prod` — `prisma generate && eslint && next build && next start`. Use before schema or env changes.

## Prisma (Prisma 7, custom output)

- Generator: `provider = "prisma-client"`, `output = "../generated/prisma"`. This is the Prisma 7 generator, **not** `prisma-client-js`.
- Import the client as `import { PrismaClient } from "@generated/prisma/client"`. There is no `@prisma/client` import surface in this repo.
- `prisma/schema.prisma` has **no** `datasource.url` line. The URL comes from `prisma.config.ts` via `env("DATABASE_URL")` (loaded with `dotenv/config`). Do not add it back inline.
- `src/lib/database/dbClient.ts` is a `globalThis` singleton (HMR-safe) wired to `PrismaLibSql`. Do not instantiate `PrismaClient` elsewhere; import from this file.
- `serverEnv.DATABASE_URL` is Zod-validated to start with `file:./` (`src/lib/env/serverEnv.ts`). A non-`file:./` URL throws at boot.
- No migrations exist yet — `bun migrate` (`prisma migrate dev && prisma generate`) creates `prisma/migrations/`. Schema edits go through that command, not `prisma db push`.
- `bun studio` runs headless (`--browser none`); open the printed URL in a browser manually.
- `generated/**` is gitignored and excluded from ESLint. Do not hand-edit generated files.
- `build` and `prod` scripts prepend `prisma generate` — running raw `next build` will fail with missing types if the client is stale.

## Database

- **Seed script:** `prisma/seed.ts` (run with `bun run prisma/seed.ts`). Creates default admin account from `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` env vars. Also configured in `prisma.config.ts` as `migrations.seed`.
- **Reset DB workflow:** Delete `prisma/dev.db`, run `prisma db push`, then `bun run prisma/seed.ts`.
- **Current default admin:** `ceojahid` / `jahidekbalmallick@gmail.com` / `RegixAdmin123!` (role: ADMIN)

## .env Gotchas

- **NEVER wrap values in quotes.** `dotenv` treats `"value"` as literal quotes in the value. This caused the admin login bug (username stored as `"ceojahid"` instead of `ceojahid`). Always use `KEY=value` format, no quotes.
- `SECRET_KEY` is used both as the bot API Bearer token and as a general server secret.
- `RESEND_API_KEY` is required by Zod validation in `serverEnv.ts` (`z.string().min(1)`). If missing, the dev server will throw at startup.
- `DISCORD_BOT_TOKEN` is optional; if not set, the bot process logs a warning and skips startup gracefully.

## Env validation (T3 env)

- `src/lib/env/clientEnv.ts` and `src/lib/env/serverEnv.ts` define Zod schemas via `@t3-oss/env-nextjs`.
- `serverEnv.ts` uses `experimental__runtimeEnv: process.env`. The `experimental__` prefix is required for non-Next-runtime access — keep it verbatim.
- `next.config.ts` imports both env files **as side effects** at the top of the module to trigger validation at load time. Do not remove those imports; the rest of the app reads `serverEnv` / `clientEnv` from those modules.
- New vars: add to `serverEnv.ts` (server) or `clientEnv.ts` (must be `NEXT_PUBLIC_*`) and mirror in `.env.example`.

## Styling

- Tailwind v4: all config lives in `src/app/globals.css` via `@theme` and `@custom-variant`. PostCSS plugin is `@tailwindcss/postcss`. There is no `tailwind.config.ts` — do not create one.
- `globals.css` imports `shadcn/tailwind.css`; removing it breaks the Base Luma design tokens.
- Prettier: `singleAttributePerLine: true`, `bracketSameLine: true`, `experimentalTernaries: true`, and `prettier-plugin-tailwindcss` is enabled. New code matches (one prop per line; JSX closing bracket on the same line as the tag).

## shadcn / Base UI

- `components.json` sets `ui` → `@/components/shadcnui` (not the default `@/components/ui`). Add components with `bunx shadcn add ...`; they land in `src/components/shadcnui/`.
- The shipped `Button` wraps `Button as ButtonPrimitive` from `@base-ui/react/button`. Do not introduce Radix or `react-aria` primitives — they don't share the Base Luma styling.

## Path aliases (`tsconfig.json`)

- `@/*` → `./src/*`
- `@generated/*` → `./generated/*` (Prisma client only)

## Reserved directories

- `src/server/` — server-only modules (server actions, anything importing `server-only`). Currently a `.gitkeep`.
- `src/hooks/` — custom React hooks. Currently a `.gitkeep`.

## Package manager

- `bun.lock` is committed; Bun is the primary workflow (`bun install`, `bun <script>`). npm works (engines pin `node >=24`, `npm >=11`) but the scripts and README are written around `bun`.

## Security Architecture

- **Rate Limiting**: `src/lib/security/rateLimiter.ts` — in-memory sliding window per-IP. Three tiers: `STRICT_LIMIT` (5/min for auth), `MODERATE_LIMIT` (20/min for API), `BOT_LIMIT` (60/min for internal). Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
- **Brute Force Protection**: `src/lib/security/bruteForceProtection.ts` — tracks failed attempts per IP and per user with exponential backoff (30s → 2m → 5m → 15m → 1h → 2h). Blocks after 5 failed attempts. Cleared on successful login.
- **CSRF Protection**: `src/lib/security/csrf.ts` — double-submit cookie pattern. Token set as non-httpOnly cookie on login/register, validated via `x-csrf-token` header on state-changing requests. Constant-time comparison.
- **Security Middleware**: `src/lib/security/securityMiddleware.ts` — combines all protections. `applySecurity()` for route-level checks, `checkLoginBruteForce()` for login endpoints, `securityHeaders()` for response headers (HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, etc.).
- **Password Policy**: Min 8 chars, requires uppercase, lowercase, and number. Enforced in register route.
- **Session Security**: Sessions auto-expire after 7 days. Password reset destroys all sessions. HttpOnly auth cookies.

## New Modules Added

- `src/lib/security/` — Complete security layer (rate limiter, brute force, CSRF, middleware)
- `src/lib/roles.ts` — Hierarchical role system (OWNER > ADMIN > MODERATOR > DISTRIBUTOR > RESELLER > USER)
- `src/lib/notifications.ts` — Notification helper (create, list, mark read, bulk, cleanup)
- `src/bot/utils/logger.ts` — Discord bot log service (sends embeds to configured log channel)
- `src/app/api/bot/log-config/route.ts` — Bot log channel configuration API
- `src/app/api/notifications/mark-read/route.ts` — Mark single notification as read
- `src/app/api/notifications/mark-all-read/route.ts` — Mark all notifications as read
- `src/components/Notifications/NotificationCenter.tsx` — Notification center UI component
- `src/app/notifications/page.tsx` — Notification center page

## Fixed Bugs

- **OTP Email Bug**: Removed broken `message.replace()` regex that was corrupting the email template. OTP now renders correctly in the email body.
- **IP Detection**: `detectUserIp()` in dashboard now properly falls back through multiple providers (ipify, ipify v6) before using local fallback.

## Misc

- ESLint ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `generated/**`.
- `.env` is gitignored; `.env.example` is the committed template. Do not commit secrets.
- `CHECKPOINT_DISABLE=1` is set to silence Prisma telemetry.
- No CI workflows or pre-commit hooks exist. Pre-PR verification is `bun lint` then `bun run build` (see Verification above).
- Build command on Windows: `bun run build --webpack` (Turbopack native bindings unavailable on win32/x64).

## Git commits

Use PowerShell here-strings:

```powershell
git commit -m @"
commit message here
"@
```

## Project Plan

### Phase 1 — Foundation (Complete ✅)

- [x] Next.js 16 + React 19 App Router with shadcn/Base UI
- [x] Prisma 7 + libSQL (SQLite) database schema with User, Session, Device, DiscordAccount, PremiumKey, LoginHistory, BlacklistEntry, AuditLog, OtpCode
- [x] Authentication (email/password login, Discord OAuth, session management)
- [x] Admin seed and panel basics

### Phase 2 — Discord Bot (In Progress 🔄)

- [x] Bot auto-discovery command loader
- [x] Bot API endpoints with SECRET_KEY auth
- [x] Admin commands: /genkey, /genuser, /genlicense, /blacklist, /unblacklist, /whitelist, /unwhitelist, /reset, /resetpassword, /resetusername
- [x] Everyone commands: /userinfo, /keyinfo, /licenseinfo, /stats, /help
- [x] Super admin hardcoded user ID bypass (1076183559796183242)
- [ ] Verification system (/verification enable, setup_role, setup_channel, type, set_verified, disable, reset)
- [ ] Anti-nuke system (/settings anti nuke, /setlimit, /setpunishment, /enable, /disable)
- [ ] Anti-raid and anti-spam dashboard configuration

### Phase 3 — License & HWID System (Partial 🟡)

- [x] Premium key generation, redemption, expiry, lifetime keys
- [x] Device (HWID/SID) tracking with IP lock support
- [x] Device verification API endpoint
- [ ] C++/client-side integration for HWID extraction
- [ ] License key redemption flow on web dashboard

### Phase 4 — Dashboard & Admin Panel (Partial 🟡)

- [x] Login/Register/Forgot Password pages
- [x] User dashboard (session info, devices, premium status)
- [x] Admin user management page
- [ ] Admin key management page
- [ ] Analytics/stats dashboard
- [ ] Discord bot settings dashboard (anti-nuke, anti-raid config)

### Phase 5 — Security Hardening (Not Started ⬜)

- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] 2FA via TOTP/OTP
- [ ] IP allowlisting for admin panel
- [ ] Audit log viewer in dashboard

### Phase 6 — Production Readiness (Not Started ⬜)

- [ ] Migrations (currently using `prisma db push`; need proper `prisma migrate dev`)
- [ ] CI/CD pipeline
- [ ] Production deployment (Vercel/Render)
- [ ] Monitoring and error tracking
