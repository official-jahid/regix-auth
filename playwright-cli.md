# playwright-cli cheat-sheet

Running record of UI element names, routes, form shapes, and flow gotchas discovered while testing with `playwright-cli`. Consult before scanning snapshots. Append new learnings as they are discovered.

## Routes

Page paths and their purpose.

- `/api/auth/ok` returns `{ ok: true }` on Better Auth 1.7. Verified against local dev server.
- `/api/auth/sign-in/email` accepts email plus password, returns 200 with session cookie on success.
- `/api/auth/sign-in/username` accepts username plus password, returns 200 with session cookie on success.
- Seed logins live in `prisma/seed.ts`. Admin uses `ADMIN_*` env vars. User defaults to `user@regix.studio` and `regixuser`, overridable with `USER_*` env vars. Reseller defaults to `reseller@regix.studio` and `regixreseller` with provider `REGIX`, overridable with `RESELLER_*` env vars. Passwords stay in `.env`, never in this file.
- `/` public landing with Get started and Login actions.
- `/login` public login with identifier plus password. Accepts email or username.
- `/register` public registration with name, username, email, password.
- `/dashboard` private, redirects to `/login` without session. Shows account card. Admin role also sees admin card. Reseller sees reseller card. User role shows My license card. No license shows redeem form with key plus device ID. Bound license shows status badge, renewal pending badge, device list with remove, request renewal button, reseller contact. Redeem binds owner, sets expiry from duration, adopts provider, creates activation. Approve renewal extends expiry by duration. Delete key cascades activations and renewals.
- `/admin` admin only, redirects to `/login` for guests and users. Sidebar has Overview, Taxonomy, Dashboard.
- `/admin` allows admin plus reseller. Admin sidebar has Overview, Taxonomy, Posts, Licenses, Products, Activations, Dashboard. Reseller sidebar hides Taxonomy and Posts. Admin overview shows taxonomy and posts cards for admin only, plus licenses and products cards for both. User role redirects to `/login` for `/admin` and `/admin/licenses`.
- `/admin/activations` list with device, key, provider, IP, status, first seen. Search device IP key, status filter, pagination. Revoke and restore with confirm. Reseller sees provider matched rows and manages own keys rows only.
- `/admin/products` list with name, slug, version, expiry, status, license count. New and edit share one form. Admin writes, reseller reads only with no New button and no Actions column. New and edit pages redirect reseller to the list.
- `/admin/licenses` list with key, provider, product, derived status available bound expired banned, bound user, expiry. Search key provider user, status filter, usage filter, pagination. Admin manages all. Reseller sees provider matched keys, manages only own created keys, others show View only. New license form has provider editable for admin and locked for reseller, optional product picker, duration days with product default fallback, notes. Created key shows once with copy text plus list link. Toggle, reset, delete each confirm. Delete keeps the bound account.
- Renewal queue lives on `/admin/licenses` above the list. Pending only. Approve extends expiry by key duration and reactivates. Reject closes the request. Reseller manages own keys rows only.
- `/admin/users` list with username, email, role, provider, status, license count, excluding self. Search plus role filter plus pagination. Ban signs out everywhere, unban restores. Admin rows show Protected. Self ban and admin ban blocked server side.
- `/admin/resellers` list with provider and key count. New reseller form with username, email, password, provider. Ban plus delete with confirm. Created keys survive reseller delete.
- `/admin/taxonomy` redirects to `/admin/taxonomy/categories`.
- `/admin/clients` reseller plus admin page with provider matched user clients, license key plus active device count, ban and unban, reset devices with confirm. Reset revokes all active devices, client re-registers on next validation. License count shows active devices only via filtered relation count.
- `/admin/announcements` list with title, urgency, status, seen count. New form with title, message, urgency, active flag. Hide plus show toggle and delete with confirm. Dashboard shows unacknowledged cards with acknowledge action for every logged in member.
- `/admin/resources` list with title, type, content. New form with type picker command file video link note, title, content. Delete with confirm. Dashboard shows resources grid for licensed users plus admin and reseller roles.
- Categories list supports `q`, `status`, `sort` manual name newest, `dir`, `page`. Table shows name, parent, slug, status, order, post count, Edit and Delete actions.
- Category new and edit pages share one form. Slug is auto generated on create and stays stable on edit.
- `/admin/taxonomy/tags` list mirrors categories without parent column. Tag new and edit pages share one form. Verified global slug rule. Category `Tutorial` received `tutorial-2` while tag `tutorial` existed.
- `/admin/posts` list with title, slug, status, category names, tag names. Post new and edit pages share one form with multi category and tag checkboxes. Publishing sets `publishedAt` on first publish.
- Public top level `/posts`, `/posts/[slug]`, `/categories`, `/categories/[slug]`, `/tags`, `/tags/[slug]`. Only published posts and active taxonomy show. Drafts and inactive slugs return 404. Category pages use SEO title and description with fallbacks.
- `/api/verify?key=&device=` returns active with provider, username, expiresAt, or inactive with message. Missing key, unknown or banned key, expired license, revoked device each return inactive. First validate per device creates the activation row. Open endpoint with in memory rate limit of 60 per minute per IP.

## UI element names

Accessible names, testids, and where they live.

- Public landing `/`: hero `REGIX Studio`, actions `Get started` and `Login`.
- Public landing `/`: badge, hero, single `Get started` action, three highlight cards. Fits exactly one viewport at 390, 768, and 1920 widths with no page scroll. Check with `scrollWidth` vs `innerWidth` and `scrollHeight` vs `innerHeight` eval.
- Shell: brand heading `REGIX Studio`, nav `Home Posts Categories Tags` on app pages only, `User menu` avatar button with initials, dropdown items Dashboard, Admin for admin role, Logout. Public pages use the minimal header with brand, Login only, and toggle at the far right. Sidebar `admin-sidebar` with Overview, Taxonomy, Posts, Dashboard. Auth cards titled Login and Register.

## Form shapes

Fields, schemas, and defaults per form.

- Login: `identifier` email or username min 3, `password` min 8. Wrong credentials show `Invalid credentials. Check your login and try again.` Success goes to `/dashboard`.
- Register: `name` min 2 max 64, `username` 3 to 30 letters numbers `. _ -`, `email`, `password` 8 to 128, `licenseKey` required valid unused key. Invalid key blocks signup with no account created. Used key shows already in use. Valid key auto binds with expiry and provider on signup. Auth failure shows `Could not create the account. Try different details.` Success goes to `/dashboard`.
- Category: `name` required max 100, `description` max 500, `parent` root or category path, `color`, `icon`, `sortOrder` min 0, `status` active inactive, `seoTitle` max 120, `seoDescription` max 200. Delete asks `Delete {name}?` and notes children are removed too.
- Tag: `name` required max 100, `description` max 500, `color`, `sortOrder` min 0, `status` active inactive. Delete asks `Delete {name}?` and notes post links are removed too.
- Product: `name` required max 100, `description` max 500, `version` max 32, `expiryDays` 1 to 36500 or empty for lifetime, `sortOrder` min 0, `status` active inactive. Slug auto generated on create and stable on edit. Delete keeps linked keys with product detached.
- License: `provider` required max 64, `productId` optional active product, `durationDays` 1 to 36500 or empty for lifetime with product default fallback, `notes` max 300. Key uses `RGX-` prefix with 6 hex groups. Delete keeps the bound account, unlike the old app which deleted it.
- Post: `title` required max 150, `excerpt` max 300, `content` required, `coverUrl` valid URL or empty, `status` draft published archived, `categoryIds` and `tagIds` checkbox arrays. Slug auto generated on create and stable on edit. Publishing stamps `publishedAt` once.

## Flow gotchas

Ordering, timing, and state pitfalls found during click-testing.

- Better Auth health check returns `{ ok: true }`, not `{ status: "ok" }`.
- `bun run migrate -- --name x` does not forward the name. Run `bunx prisma migrate dev --name x` directly.
- `eslint` scans `referance/` and `.agents/` unless ignored. Both are now in `globalIgnores` in `eslint.config.mjs`.
- Seed via `bun run seed`. It uses relative imports so `bun prisma/seed.ts` resolves without alias config.
- Restart the dev server after `prisma generate`. The running server keeps the old generated client and new models read as undefined.
- Colocated `_components` imports need the full relative depth. New page uses `../_components`, edit page uses `../../_components`.
- Base UI trigger components render their own button. Style `AlertDialogTrigger` with `buttonVariants` directly instead of `asChild` plus `Button`, which nests buttons.
- Base UI `Select` trigger is a combobox button, not a native select. Drive it in `playwright-cli` with `click` on the combobox plus `click` on the option, not the `select` command.
- `playwright-cli goto` takes no `--headed` flag. Open the browser once with `open --headed`, then use `goto`, `fill`, `click`.
- `fill` and `click` need fresh snapshot refs with the session prefix, e.g. `f4e28`. Capture a new snapshot when refs expire.
- Never create users with `signUpEmail` inside an admin server action. It replaces the admin session cookie and locks the admin out. Use `auth.api.createUser` with headers, then set username, role, provider via prisma.
- Number inputs submit strings. Coerce optional numeric fields with a `Number` preprocess that maps empty to null, e.g. product `expiryDays`. Plain `z.number` rejects the string.
- Verify no-scroll landing with an eval comparing `scrollWidth` to `innerWidth` and `scrollHeight` to `innerHeight` at 390, 768, and 1920 widths.
- Confirm dialogs stay open after a successful action. Reset busy state after `router.refresh()` in every row action, else the button sticks disabled when the row persists. Dismiss stale dialogs with Cancel before the next click.
