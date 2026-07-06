# REGIX Auth System v3.0 - Agent Guide

## Project Overview

REGIX is a complete licensing & authentication server built with:

- **Express.js** backend with Prisma ORM (SQLite/LibSQL)
- **Tailwind CSS v4** frontend (no inline styles, no inline JS)
- **Discord.js** bot with slash commands + DM notifications
- HWID-based device locking, Key/License/User authentication

## File Structure

```
├── server.js              # Main Express server (ALL routes)
├── prisma/schema.prisma   # Database schema
├── prisma.config.js       # Prisma v7 config
├── package.json           # Dependencies & scripts
├── .gitignore             # Git ignore rules
├── .env                   # Environment variables
├── public/
│   ├── index.html         # Admin command center dashboard
│   ├── login.html         # Dual-tab (Panel + User) login page
│   ├── register.html      # Key-gated registration
│   ├── user-dashboard.html# End-user dashboard
│   ├── docs.html          # API documentation
│   ├── css/
│   │   ├── app.css        # Tailwind source (with theme colors)
│   │   └── dist.css       # Built/minified Tailwind output
│   └── js/
│       ├── dashboard.js   # Admin dashboard logic (toast notifications)
│       ├── particles.js   # Particle canvas background engine
│       └── toast.js       # Toast notification system
```

## Code Style Rules

- **NO inline CSS**: All styles use Tailwind classes or custom CSS classes defined in `css/app.css`
- **NO inline JavaScript**: No `onclick=""`, `onsubmit=""`, or `<style>` blocks in HTML
- All JS uses event listeners (`addEventListener`) inside IIFEs
- Toast notifications via `showToast(message, type)` instead of `alert()`
- API secret: `RegixSecretKey2024!@#$%^` (used by dashboard.js to call admin APIs)

## Discord Bot Architecture

- Bot checks for registered website account before allowing any command
- Tracks online/offline status via `presenceUpdate` event
- Sends DM welcome on guild join, logs server join/leave events
- Admin-only commands: `/genkey`, `/genuser`, `/genlicense`, `/blacklist`, `/unblacklist`, `/reset`

## Key API Endpoints

| Endpoint                             | Auth   | Description                         |
| ------------------------------------ | ------ | ----------------------------------- |
| `POST /api/auth/register`            | None   | Key-gated user registration         |
| `POST /api/user/login`               | None   | App user login (returns JWT)        |
| `GET /api/user/profile`              | JWT    | Get user profile data               |
| `POST /api/user/update-sid`          | JWT    | Update HWID (24h cooldown)          |
| `POST /api/user/update-ip`           | JWT    | Auto-detect IP update               |
| `POST /api/user/update-discord`      | JWT    | Link Discord ID                     |
| `GET /api/verify?sid=&key=`          | None   | External client verification        |
| `POST /api/panel/login`              | None   | Panel admin login                   |
| `GET /api/dashboard?secret=&action=` | Secret | Dashboard data API                  |
| `POST /api/admin/bulk-gen-keys`      | Secret | Bulk key generation                 |
| `POST /api/admin/reset-sid`          | Secret | Admin SID reset (bypasses cooldown) |

## Render.com Deployment

1. Set `DATABASE_URL` to a Turso/libsql URL (for persistent storage)
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set all environment variables from `.env`
5. Ensure Node.js >= 18.x

## Development

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
npm run build:css    # Build Tailwind CSS
bunx prisma db push  # Sync database schema
npm run build        # Full build (CSS + Prisma generate + db push)
```
