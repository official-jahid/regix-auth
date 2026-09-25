<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Stack

| Pkg           | Ver                | Note                                                                                                                                                                 |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js       | ^16.3              | `reactCompiler: true`, `typedRoutes: true`                                                                                                                           |
| React         | ^19.2              |                                                                                                                                                                      |
| TypeScript    | ^5.9               | strict, ESNext module, bundler resolution                                                                                                                            |
| Prisma        | ^7.10              | Uses `prisma-client` generator (not `prisma-client-js`). Output: `generated/prisma`. Driver adapter: `@prisma/adapter-libsql` for SQLite. Config: `prisma.config.ts` |
| shadcn/ui     | base-vega style    | Components in `src/components/shadcnui/`. Aliased as `@/components/shadcnui`                                                                                         |
| Base UI React | ^1.7               | Primitive provider for shadcn components (e.g., `@base-ui/react/button`)                                                                                             |
| Tailwind CSS  | ^4.3               | `@tailwindcss/postcss` plugin, `tw-animate-css`, `shadcn/tailwind.css`                                                                                               |
| Zod           | ^4.5               | Schema validation                                                                                                                                                    |
| env           | @t3-oss/env-nextjs | Split: `src/lib/env/serverEnv.ts` + `clientEnv.ts`                                                                                                                   |

Path aliases: `@/*` → `./src/*`, `@generated/*` → `./generated/*`.

Engines: Node >= 24, npm >= 11.

## Scripts

| Script       | Runs                                     |
| ------------ | ---------------------------------------- |
| `dev`        | `next dev`                               |
| `build`      | `prisma generate && next build`          |
| `start`      | `next start`                             |
| `lint`       | `eslint` only                            |
| `lint:check` | `next typegen && tsc --noEmit && eslint` |
| `migrate`    | `prisma migrate dev && prisma generate`  |
| `studio`     | `prisma studio --browser none`           |

## Agent behavior

- **Ask questions** when ambiguous or before destructive actions. Ask one question at a time through the question tool. Ask a single question per call because an earlier answer can change what the remaining questions should be. Wait for the answer before asking the next question.
- **Use your full toolkit**: Reach for `websearch`, `webfetch`, and any other available tools whenever they improve correctness. Do not answer from memory what a live tool can verify. Use `rg` (ripgrep) for file and content searches in the shell when it is installed.
- **Decisions between options**: When a choice exists, evaluate all options first, pick the best one, then ask the user with every option listed (chosen one included and marked) before proceeding. Never silently pick one.
- **Update this file** when you discover non-obvious gotchas, fixes, or conventions.
- **Use skills + MCPs** before writing code matching `prisma-*`, `next-*`, `better-auth-*`, `zod`, etc. Use `shadcn` MCP for component add/search/audit. Use `better-auth` MCP for auth docs.

## Verification

- **Primary**: `bun run lint`, eslint only. This is the default check.
- **Heavy gates**: `bun lint:check` runs `next typegen`, `tsc --noEmit`, and `eslint`. `bun run build` runs `prisma generate && next build`. Use these only when requested or when playwright-cli testing fails, since the dev server already runs typegen and typechecks during browser verification.
- **Browser**: Use `playwright-cli` for UI verification, via `bunx playwright-cli` if it is not installed. Enumerate capabilities with `playwright-cli --help` before first use.
- **Headed mode**: Always run visible with `--headed`, e.g. `playwright-cli open --headed ...`. Never use headless for verification.
- **Look at the page**: The agent has vision. Use `playwright-cli screenshot` and actually inspect layout, badges, dialogs, and styling. Do not rely on accessibility snapshots alone.
- **Click-testing**: Prefer CLI-driven click-testing against the running dev server.
- **Artifacts**: Snapshots, console logs, and screenshots land in `.playwright-cli/`, which is gitignored.
- **Seed logins**: Use login info from `prisma/seed.ts` for `playwright-cli` auth flows. Seed provides admin and user accounts with known credentials for headed verification.
- **Cheat-sheet**: Maintain `playwright-cli.md` at the repo root, a running record of UI element names, routes, form shapes, and flow gotchas discovered while testing. Consult it before scanning snapshots, and append new learnings as they are discovered. Add all `playwright-cli` findings from each session to `playwright-cli.md`.

## Project structure

```
src/
  app/              # App Router (layout.tsx, globals.css, api/auth/[...all]/route.ts)
                    # (public)/ landing, login, register, posts, categories, tags with shared header footer layout
                    # (private)/ session guarded layout, dashboard, admin role guarded layout with taxonomy and posts
                    # (private)/admin also hosts licensing: licenses, products, activations. Admin layout allows admin plus reseller. Taxonomy and posts stay admin only
  components/
    Layout/         # Header with minimal public variant and toggle at far right, ThemeToggleButton, UserMenu with hideRegister, Footer
    Content/        # PostCard shared public card
    Providers/      # ThemeProvider (next-themes)
    shadcnui/       # full @shadcn set, 60 items plus toast.tsx. Legacy `form` item produces no file, use `field` primitives instead
  hooks/            # use-mobile.ts from shadcn registry
  lib/
    dbClient/       # Prisma singleton with libSQL adapter
    env/            # serverEnv.ts, clientEnv.ts (t3-env)
    auth.ts         # Better Auth server instance, username plus admin plugins, Prisma SQLite adapter
    auth-client.ts  # Better Auth React client with usernameClient plus adminClient
    zodSchema.ts    # loginSchema identifier plus password, registerSchema name username email password licenseKey. Registration requires a valid unused key with atomic claim
    fonts.ts        # next/font (Geist, Inter)
    types.ts        # LayoutProps
    utils.ts        # cn() helper (clsx + tailwind-merge)
  server/           # categories.ts, tags.ts, posts.ts admin CRUD with global slug check and cycle guard. public.ts published only reads
                    # products.ts admin write plus reseller read, product scoped slugs. licenses.ts key CRUD with provider scoping and ownership gated actions. activations.ts log plus revoke with provider scoping. client.ts redeem, devices, renewals. users.ts admin bans, reseller CRUD, reseller clients with device reset. announcements.ts plus resources.ts admin CRUD with member acknowledge and dashboard display. Roles are admin, reseller, user as plain strings enforced app side. Reseller scope is provider matched
  proxy.ts          # optimistic getSessionCookie guard for dashboard and admin, redirects to login
generated/prisma/   # Prisma client output (gitignored)
public/uploads/     # User uploads (all files ignored except .gitkeep)
```

## Gitignore pattern: uploads

`public/uploads/*` + `!public/uploads/.gitkeep` ignores all uploaded files but keeps the empty dir tracked via `.gitkeep`. Do not add `public/uploads/` itself to gitignore.

## Code style

- **Functions**: Always use arrow functions (`const foo = () => {}`), never `function` declarations. Exception: `src/components/shadcnui/` keeps its generated style.
- **No em dashes**: Never use em dashes in prose, comments, or docs. Use periods or commas instead. Also avoid parentheses, en dashes, and hyphens as dash substitutes.
- **Link styled as button**: When a button must look like a link action, use `Link` with `buttonVariants`. Example: `<Link href="#" className={buttonVariants({ variant: "secondary", size: "sm" })}>Login</Link>`. Do not wrap a native button in a link for this case.

## Key restrictions

- **ESLint**: Locked at eslint@9.x until `eslint-plugin-react` ships v10 support. Do NOT bump.
- **TypeScript**: Currently ^5.9. TS 7.0 (Go-native compiler) blocked until typescript-eslint API stabilizes (~Oct 2026). Do not migrate.

## Form patterns

Schemas live in `src/lib/zodSchema.ts`. Export both the schema and `type X = z.infer<typeof xSchema>`.

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

## Gotchas

- shadcn v4 registry imports `cn` from the `cn` package, not from `@/lib/utils`. The CLI installs it automatically. Keep `src/lib/utils.ts` for app code only.
- Generated `src/components/shadcnui/**` and `src/hooks/**` are exempt from `react-hooks/set-state-in-effect` in `eslint.config.mjs`. Do not hand edit registry files to satisfy that rule.
- `bun run migrate -- --name x` does not forward the name. Run `bunx prisma migrate dev --name x` directly.
- Never re-run `auth generate` after adding app models. It overwrites `prisma/schema.prisma` with auth tables only. Merge plugin schema changes by hand.
- SQLite cascade delete on the category tree verified working. Deleting a parent removes all descendants.
- Base UI triggers render their own button element. Style `AlertDialogTrigger` with `buttonVariants` instead of wrapping a `Button` with `asChild`.
- Base UI `Select` trigger is a combobox button. Test it with combobox click plus option click.
- Restart the dev server after `prisma generate` so the new client loads.
- Rate limit on `/api/verify` is in memory per process. Fine for single instance dev. Needs shared storage before horizontal scale.
- Confirm dialogs stay open after success. Every row action resets its busy flag after `router.refresh()` so the button never sticks disabled.
- Better Auth admin plugin accepts freeform role strings. Slice 1A skips custom access control and enforces admin, reseller, user app side. Reseller scope is provider matched. Taxonomy and posts server actions stay admin only.
- Never call `signUpEmail` inside an admin server action. It hijacks the admin session. Use `auth.api.createUser` with request headers instead.
- `scripts/verify-license.ps1` must run under Windows PowerShell 5.1 with `-UseBasicParsing` on every web call. Without it the IE DOM parser throws and masks real errors. Full SID/HWID matrix lives there, 12 checks, self seeding and cleanup.

## Git commits

Use PowerShell here-strings:

```powershell
git commit -m @"
<commit message here>
"@
```
