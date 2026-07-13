# Regix Auth - Project Documentation

## Overview

Regix Auth is a comprehensive authentication and authorization system designed for web applications, desktop applications, and Windows Forms. It features a Next.js 16 frontend with a Discord bot backend, providing role-based access control, premium license key management, and hardware-based (HWID/SID) authentication.

## Tech Stack

### Core Technologies
- **Framework**: Next.js 16.2 + React 19.2 (App Router)
- **Database**: Prisma 7 with `@prisma/adapter-libsql` (SQLite file-backed)
- **Package Manager**: Bun (npm >= 11 compatible)
- **Styling**: Tailwind CSS v4 (CSS-only config in `globals.css`)
- **UI Components**: shadcn/ui with `base-luma` style preset, primitives from `@base-ui/react`
- **Icons**: Lucide React
- **Toasts**: React Toastify
- **Notifications**: Sonner
- **Charts**: Recharts
- **Themes**: next-themes (default: dark, enableSystem: false)

### Authentication & Security
- **Password Hashing**: bcryptjs (12 salt rounds)
- **JWT**: jsonwebtoken (7-day expiry)
- **OAuth**: Discord OAuth2 integration
- **Email**: Resend API for OTP emails

### Discord Bot
- **Library**: discord.js v14
- **Architecture**: Auto-discovery command loader
- **Process Manager**: concurrently (web + bot in parallel)

## Project Structure

```
regix-auth/
├── prisma/
│   ├── schema.prisma          # Database schema (12 models)
│   ├── seed.ts               # Admin seed script
│   └── migrations/           # Database migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # Auth endpoints (login, register, OTP, session)
│   │   │   ├── admin/        # Admin endpoints (users, keys)
│   │   │   ├── bot/          # Bot API endpoints (keys, users, whitelist)
│   │   │   ├── device/       # HWID/SID endpoints (verify, register)
│   │   │   ├── keys/         # Key endpoints (generate, redeem, manage)
│   │   │   ├── chat/         # Direct messaging endpoints
│   │   │   └── notifications/# Notification endpoints
│   │   ├── auth/             # Auth pages (login, register, forgot-password)
│   │   ├── dashboard/        # User dashboard (/dashboard) + admin (/dashboard/admin)
│   │   ├── chat/             # Direct chat page
│   │   ├── notifications/    # Notification center page
│   │   ├── layout.tsx        # Root layout with sidebar + theme provider
│   │   └── page.tsx          # Landing page
│   ├── bot/
│   │   ├── commands/         # Slash command files
│   │   │   ├── admin.ts         # Multi-command: genuser, blacklist, unblacklist, whitelist, unwhitelist, reset, genlicense, resetpassword, resetusername
│   │   │   ├── userinfo.ts      # Single command: get user info
│   │   │   ├── keyinfo.ts       # Single command: get key info
│   │   │   ├── licenseinfo.ts   # Single command: get license info
│   │   │   ├── stats.ts         # Single command: system stats
│   │   │   ├── help.ts          # Single command: help menu
│   │   │   ├── verification.ts    # Multi-command: verification system
│   │   │   ├── settings.ts        # Multi-command: anti-nuke/anti-raid config
│   │   │   ├── enable.ts          # Multi-command: enable features
│   │   │   ├── disable.ts         # Multi-command: disable features
│   │   │   ├── setlimit.ts        # Multi-command: set limits
│   │   │   └── setpunishment.ts    # Multi-command: set punishment
│   │   ├── utils/
│   │   │   ├── api.ts             # Bot-to-API client wrapper
│   │   │   ├── permissions.ts     # Role-based permission helpers
│   │   │   └── logger.ts          # Discord log service
│   │   └── index.ts             # Bot entry point (auto-discovery loader)
│   ├── components/
│   │   ├── shadcnui/          # shadcn UI components (base-ui primitives)
│   │   ├── Navigation/
│   │   │   └── AppSidebar.tsx # Main sidebar navigation
│   │   ├── Providers/         # Context providers
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ToastProvider.tsx
│   │   ├── Notifications/
│   │   │   └── NotificationCenter.tsx
│   │   └── Buttons/           # Reusable button components
│   ├── lib/
│   │   ├── auth.ts            # Core auth logic (password, JWT, sessions, OTP)
│   │   ├── database/
│   │   │   └── dbClient.ts    # Prisma singleton (HMR-safe)
│   │   ├── security/
│   │   │   ├── rateLimiter.ts # In-memory sliding window rate limiter
│   │   │   ├── bruteForceProtection.ts # Exponential backoff brute force protection
│   │   │   ├── csrf.ts        # Double-submit cookie CSRF protection
│   │   │   └── securityMiddleware.ts # Combined security middleware
│   │   ├── env/
│   │   │   ├── serverEnv.ts   # Server env validation (T3 env)
│   │   │   └── clientEnv.ts   # Client env validation
│   │   ├── roles.ts           # Hierarchical role system (OWNER > ADMIN > MOD > DISTRIBUTOR > RESELLER > USER)
│   │   ├── premium.ts         # Premium status helper
│   │   ├── email.ts           # Resend email service
│   │   ├── apiKeyAuth.ts      # API key authentication helper
│   │   ├── notifications.ts   # Notification helper
│   │   ├── zodSchema.ts       # Form validation schemas
│   │   ├── utils.ts           # cn() helper
│   │   └── fonts.ts           # Font definitions (Nunito Sans, Noto Sans Heading)
│   └── hooks/
│       └── useAuth.ts         # Auth hook (currently minimal)
```

## Database Schema

### User Model
```prisma
model User {
  id            String
  email         String @unique
  username      String @unique
  passwordHash  String
  displayName   String?
  avatarUrl     String?
  role          String @default("USER") // OWNER, ADMIN, MODERATOR, DISTRIBUTOR, RESELLER, USER
  isActive      Boolean @default(true)
  isBlacklisted Boolean @default(false)
  status        String @default("offline")
  lastSeenAt    DateTime
  createdAt     DateTime
  updatedAt     DateTime
  // Relations: sessions, devices, discordAccount, premiumKeys, loginHistory, blacklistHistory, otps, notifications, sentMessages, receivedMessages, chatReactions, conversations1, conversations2, apiKeys
}
```

### Session Model
- JWT-like token with 7-day expiry
- Tracks IP and userAgent
- HTTP-only cookie in browser

### Device Model (HWID/SID)
- Hardware ID (hwid) + Security Identifier (sid)
- IP tracking and lockdown
- 24-hour cooldown for SID changes (enforced in UI)

### PremiumKey Model
- Format: `XXXXX-XXXXX-XXXXX-XXXXX` (20 chars, uppercase alphanumeric)
- Duration in days (0 = lifetime)
- IP locking support
- Created by admin or bot

### DiscordAccount Model
- OAuth2 linked accounts
- Stores discordId, username, discriminator, avatarUrl

### Other Models
- `LoginHistory` - Track login attempts
- `BlacklistEntry` - Ban records
- `AuditLog` - Admin action logging
- `Notification` - User notifications
- `Whitelist` - Whitelisted users
- `ApiKey` - External API keys (read/write/admin permissions)
- `Conversation`, `ChatMessage`, `ChatReaction` - Direct messaging

## Environment Variables (.env)

**Required (no quotes):**
```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-min-10-chars
SESSION_SECRET=your-secret-key-min-10-chars
SECRET_KEY=your-secret-for-bot-api-min-5-chars
RESEND_API_KEY=re_your_resend_api_key
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin_username
ADMIN_PASSWORD=admin_password
```

**Optional:**
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_ADMIN_ROLE_ID=role_id_for_admin
DISCORD_MOD_ROLE_ID=role_id_for_mod
APP_URL=https://your-app.com
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id  # For frontend
```

## Scripts

```json
{
  "dev": "concurrently -n web,bot -c cyan,magenta \"bun run dev:web\" \"bun run dev:bot\"",
  "dev:web": "prisma generate && next dev --webpack -H 0.0.0.0",
  "dev:bot": "bun run src/bot/start.ts",
  "build": "prisma generate && next build",
  "start": "concurrently -n web,bot -c cyan,magenta \"next start -p $PORT -H 0.0.0.0\" \"bun run src/bot/start.ts\"",
  "lint": "eslint",
  "prod": "prisma generate && eslint && next build && concurrently -n web,bot \"next start -p $PORT -H 0.0.0.0\" \"bun run src/bot/start.ts\"",
  "migrate": "prisma migrate deploy && prisma generate",
  "migrate:dev": "prisma migrate dev && prisma generate",
  "seed": "bun run prisma/seed.ts",
  "studio": "prisma studio --browser none"
}
```

**Windows Build Note**: Use `bun run build --webpack` (Turbopack native bindings unavailable on win32)

## Discord Bot Commands

### Everyone Commands
| Command | Description |
|---------|-------------|
| `/help` | Show help menu |
| `/stats` | View system statistics |
| `/userinfo [user]` | Get user information |
| `/keyinfo [key]` | Get license key info |
| `/licenseinfo [key]` | Alias for keyinfo |

### Admin/Mod Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `/genuser email username password [role]` | Admin | Create user account |
| `/blacklist user [reason]` | Admin/Mod | Blacklist user |
| `/unblacklist user` | Admin/Mod | Unblacklist user |
| `/whitelist user` | Admin/Mod | Add to whitelist |
| `/unwhitelist user` | Admin/Mod | Remove from whitelist |
| `/reset user` | Admin/Mod | Reset user sessions |
| `/genlicense count duration [lifetime]` | Admin | Generate license keys |
| `/resetpassword user newPassword` | Admin | Reset user password |
| `/resetusername user newUsername` | Admin | Reset user username |

### Verification System (WIP)
Commands in `src/bot/commands/verification.ts`:
- `setup_role [role]` - Set verified role
- `setup_channel [channel]` - Set verification channel
- `enable` - Enable verification
- `disable` - Disable verification
- `type [type]` - Set verification type
- `reset` - Reset verification settings

### Anti-Nuke/Anti-Raid System (WIP)
Commands in `src/bot/commands/settings.ts`:
- `antinuke enable/disable/view`
- `antiraid enable/disable`
- `antispam enable/disable`

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register with license key |
| POST | `/api/auth/login` | None | Email/username + password |
| POST | `/api/auth/logout` | Session | Destroy session |
| GET | `/api/auth/session` | Session | Get current session |
| POST | `/api/auth/send-otp` | Session | Send OTP (email verification/password reset) |
| POST | `/api/auth/verify-otp` | Session | Verify OTP |
| POST | `/api/auth/forgot-password` | None | Request password reset |
| POST | `/api/auth/reset-password` | None | Reset password with OTP |

### Device (HWID/SID)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/device/verify` | License Key | Verify device for desktop apps |
| POST | `/api/device/register` | Session | Register/Update device |

### Keys
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/keys/generate` | Admin | Generate premium keys |
| POST | `/api/keys/redeem` | Session | Redeem license key |
| POST | `/api/keys/manage` | Admin | List/manage keys |

### Bot API (Bearer: SECRET_KEY)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bot/keys/generate` | Generate keys |
| POST | `/api/bot/keys/info` | Get key info |
| POST | `/api/bot/users/manage` | CRUD: find, create, blacklist, unblacklist, reset, resetPassword, resetUsername, list |
| POST | `/api/bot/whitelist/modify` | Add/remove whitelist |
| POST | `/api/bot/whitelist/check` | Check whitelist status |
| POST | `/api/bot/log-config` | Configure log channel |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| PATCH | `/api/admin/users` | Admin | Update user (blacklist, activate, setRole, delete) |
| GET | `/api/admin/keys` | Admin | List all keys |
| PATCH | `/api/admin/keys` | Admin | Update key (activate, deactivate, delete) |

## Security Architecture

### Rate Limiting (`src/lib/security/rateLimiter.ts`)
- **STRICT_LIMIT**: 5 requests/minute (auth endpoints)
- **MODERATE_LIMIT**: 20 requests/minute (API endpoints)
- **BOT_LIMIT**: 60 requests/minute (internal bot endpoints)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

### Brute Force Protection (`src/lib/security/bruteForceProtection.ts`)
- Tracks failed attempts per IP and per user
- Exponential backoff: 30s → 2min → 5min → 15min → 1h → 2h
- Blocks after 5 failed attempts
- Cleared on successful login

### CSRF Protection (`src/lib/security/csrf.ts`)
- Double-submit cookie pattern
- 32-char cryptographically random token
- Non-httpOnly cookie, validated via `x-csrf-token` header
- Skipped for GET/HEAD/OPTIONS and auth routes

### Security Middleware (`src/lib/security/securityMiddleware.ts`)
- Combines rate limiting + CSRF
- Security headers: HSTS (prod), X-Frame-Options, X-Content-Type-Options, Permissions-Policy

### Password Policy
- Minimum 8 characters
- Requires uppercase, lowercase, and number
- Enforced in register route

## Role Hierarchy

```typescript
ROLES = {
  OWNER: 100,      // Highest - bypasses all checks
  ADMIN: 80,       // Full admin access
  MODERATOR: 60,   // Mod access
  DISTRIBUTOR: 40, // Distributor access
  RESELLER: 20,    // Reseller access
  USER: 0,         // Regular user
}
```

Super Admin User ID: `1076183559796183242` (hardcoded bypass)

## Form Patterns

All forms use:
- `"use client"` directive
- `react-hook-form` + `@hookform/resolvers/zod`
- shadcn primitives from `@base-ui/react`

Pattern:
```typescript
const { handleSubmit, control, formState: { isSubmitting } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
  mode: "all",
});

<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Label</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>

<form onSubmit={handleSubmit(handler)} noValidate>
<Button disabled={isSubmitting || isLoading}>...</Button>
```

## Key Features

### Authentication Flow
1. Register requires valid license key (redeemed on successful registration)
2. License key is IP-locked to registration IP
3. Email verification via OTP (6-digit, 10-minute expiry)
4. Login sets session cookie + CSRF token
5. Sessions expire after 7 days

### Premium System
- License keys required for all registrations
- Lifetime or timed keys (duration in days)
- HWID/SID verification for desktop apps
- IP locking prevents account sharing

### Admin Panel Features
- User management (blacklist, activate, role changes, delete)
- License key generation (1-100 keys, configurable duration)
- System statistics

### Discord Bot Integration
- Commands call internal API endpoints with SECRET_KEY
- Never call fetch directly in commands - use `src/bot/utils/api.ts`
- Super admin bypass for user ID `1076183559796183242`

## Chat System

### Features
- Direct messaging between users
- Real-time polling (3-second intervals)
- Message reactions (emoji picker)
- Edit/delete own messages
- Automatic message expiration (24 hours)
- User search functionality

### Components
- `src/app/chat/page.tsx` - Main chat UI (875 lines)
- `src/components/Chat/UserStatusIndicator.tsx` - Online/offline status indicator

### API Endpoints
- GET `/api/chat/conversations` - List conversations
- GET `/api/chat/messages?conversationId&cursor` - Get messages (paginated)
- GET `/api/chat/users?q=` - Search users
- POST `/api/chat/send` - Send message
- PATCH `/api/chat/edit` - Edit message
- DELETE `/api/chat/delete?messageId` - Delete message
- POST `/api/chat/react` - Add reaction

## Notification System (`src/lib/notifications.ts`)
- `createNotification()` - Create notification for user
- `getUnreadCount()` - Get unread count
- `getUserNotifications()` - Paginated notifications
- `markAsRead()` - Mark single as read
- `markAllAsRead()` - Mark all as read
- `createBulkNotifications()` - Broadcast to multiple users
- `cleanupOldNotifications()` - Delete old notifications (default 30 days)

### Components
- `src/components/Notifications/NotificationCenter.tsx` - Notification UI with pagination
- `src/app/notifications/page.tsx` - Notification page

## Deployment

### Render
- Build command: `bun install && bun run migrate && bun run prisma/seed.ts && bun run build`
- Start command: `bun start`
- Note: Free plan uses ephemeral filesystem - SQLite data lost on redeploy
- For persistent data, upgrade to paid plan or switch to PostgreSQL

### Environment for Production
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
DISCORD_REDIRECT_URI=https://your-app.onrender.com/api/auth/discord/callback
```

## Development Notes

- Prisma 7 generator: `provider = "prisma-client"`, output to `generated/prisma`
- Import client as: `import { PrismaClient } from "@generated/prisma/client"`
- `generated/**` is gitignored - run `prisma generate` before build
- `.env` is gitignored - use `.env.example` as template
- Do NOT wrap env values in quotes (breaks validation)
- Component path alias: `@/components/shadcnui` (not default `@/components/ui`)
- Path alias: `@generated/*` → `./generated/*`
- Windows build: use `--webpack` flag (Turbopack unavailable)
- Default admin: username `owner`, email `admin@regix-auth.com`, password `RegixAdmin123!`

## Files to Review

### Key Source Files
- `src/lib/auth.ts` - Core authentication (password, JWT, sessions, OTP)
- `src/lib/security/securityMiddleware.ts` - Combined security layer
- `src/lib/zodSchema.ts` - Form validation schemas
- `src/bot/index.ts` - Bot auto-discovery loader
- `src/bot/utils/api.ts` - Bot-to-API client (use this, not direct fetch)
- `src/lib/notifications.ts` - Notification helper
- `prisma/schema.prisma` - Complete database schema (331 lines)

### Page Files
- `src/app/page.tsx` - Landing page with features
- `src/app/dashboard/page.tsx` - User dashboard (684 lines)
- `src/app/dashboard/admin/page.tsx` - Admin panel (598 lines)
- `src/app/chat/page.tsx` - Direct messaging (875 lines)
- `src/app/auth/page.tsx` - Login page
- `src/app/auth/register/page.tsx` - Registration with OTP

### API Endpoints (Key)
- `src/app/api/auth/register/route.ts` (200 lines)
- `src/app/api/auth/login/route.ts` (131 lines)
- `src/app/api/device/verify/route.ts` (125 lines)
- `src/app/api/bot/users/manage/route.ts` (315 lines)
- `src/app/api/admin/users/route.ts` (165 lines)
- `src/app/api/chat/send/route.ts` (104 lines)

### Bot Commands
- `src/bot/commands/admin.ts` (550 lines) - Multi-command file
- `src/bot/commands/userinfo.ts` (80 lines)
- `src/bot/commands/stats.ts` (58 lines)
- `src/bot/commands/verification.ts` (209 lines)
- `src/bot/commands/settings.ts` (154 lines)