# 🔐 Regix Auth - Universal Authentication & Authorization System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

> **Enterprise-grade authentication system for web apps, desktop applications, Windows Forms, DLLs, terminal apps, and more.**

**Live Demo:** [https://regix-auth.onrender.com](https://regix-auth.onrender.com)  
**GitHub:** [https://github.com/official-jahid/regix-auth](https://github.com/official-jahid/regix-auth)

---

## ✨ Features

### Authentication Methods

- 📧 **Email & Password** - Traditional auth with bcryptjs password hashing (12 salt rounds)
- 💬 **Discord OAuth2** - Full Discord login integration with account linking
- 💻 **HWID / SID Authentication** - Hardware-based auth for desktop apps, WinForms, DLLs
- 🌐 **IP Authentication & Locking** - Auto-detect IP, optional IP-locking for premium keys

### Admin Panel

- 📊 **Dashboard** - Stats overview (users, keys, blacklist)
- 👥 **User Management** - View all users, roles, devices, premium status
- ⚡ **User Actions** - Blacklist/unblacklist, activate/deactivate, change roles, delete
- 🔑 **Key Management** - Generate single/bulk premium keys, activate/deactivate/delete
- 📝 **Audit Logging** - Full activity tracking

### User Dashboard

- 👤 **Profile** - Avatar, display name, role, premium status
- 📋 **Info Cards** - Provider, access status, premium, current IP
- 🔗 **Discord Integration** - Linked account display with ID copy button
- 🔄 **SID Management** - Update with 24-hour cooldown countdown
- 🌍 **IP Management** - Manual or auto-detect IP updates
- 🆔 **Discord Linking** - Link/change Discord user ID
- 📖 **API Documentation** - Built-in endpoint reference

### Premium License Keys

- 🎯 **Configurable Durations**: 1 Day, 7 Days, 30 Days, 90 Days, 1 Year, Lifetime
- 📦 **Bulk Generation**: Up to 100 keys at once
- 🔒 **IP-Locking**: Optional restriction to single IP
- ✅ **Full Management**: Activate, deactivate, delete from admin panel

### Discord Bot

- 🤖 **Built-in Bot** - discord.js v14 with hybrid commands
- 👤 **`/auth link <email>`** - Link Discord to Regix Auth
- 📊 **`/auth status`** - Check account & premium status
- 💎 **`/auth premium`** - View premium subscription details
- 🏓 **`/ping`** - Check bot latency

### Security

- 🔐 **Password Hashing**: bcryptjs with 12 rounds
- 🍪 **HTTP-Only Cookies**: Secure session management
- 🔑 **JWT Tokens**: For API authentication
- 🛡️ **Session Management**: Server-side sessions with expiry
- 📋 **Audit Logging**: All admin actions logged
- 🚫 **Blacklist System**: Instantly block malicious users

---

## 🚀 Quick Start

### Prerequisites

- Node.js 24+ (LTS recommended)
- [Bun](https://bun.sh) (recommended package manager)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/official-jahid/regix-auth.git
cd regix-auth

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your settings (see Configuration section below)

# Setup database and seed admin account
bun run migrate
bun run prisma/seed.ts

# Start development server
bun run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

### Default Admin Account

| Credential   | Value                  |
| ------------ | ---------------------- |
| **Email**    | `admin@regix-auth.com` |
| **Username** | `owner`                |
| **Password** | `RegixAdmin123!`       |

> ⚠️ **IMPORTANT**: Change the default password immediately after first login!

---

## 📋 Configuration

### Environment Variables (.env)

```env
# ============================================================
# DATABASE
# ============================================================
DATABASE_URL=file:./prisma/dev.db
CHECKPOINT_DISABLE=1

# ============================================================
# SECURITY (Generate strong random strings for production)
# ============================================================
SECRET_KEY="your-secret-key"
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"

# ============================================================
# DISCORD OAUTH2 (Optional - for Discord login)
# ============================================================
# Create app at https://discord.com/developers/applications
# Add redirect: https://yourdomain.com/api/auth/discord/callback
NEXT_PUBLIC_DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"

# ============================================================
# DISCORD BOT (Optional - for Discord Bot)
# ============================================================
DISCORD_BOT_TOKEN=""
DISCORD_GUILD_ID=""
DISCORD_ADMIN_ROLE_ID=""
DISCORD_MOD_ROLE_ID=""

# ============================================================
# ADMIN CREDENTIALS (Seeded on first run)
# ============================================================
ADMIN_USERNAME="owner"
ADMIN_PASSWORD="RegixAdmin123!"
ADMIN_EMAIL="admin@regix-auth.com"

# ============================================================
# APPLICATION
# ============================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🛠 Available Scripts

### Using Bun (recommended)

| Script          | Command                  | Description                                  |
| --------------- | ------------------------ | -------------------------------------------- |
| **Development** | `bun dev`                | Start dev server with Turbopack              |
| **Build**       | `bun run build`          | Production build with Prisma generation      |
| **Production**  | `bun run prod`           | Full production check (lint + build + start) |
| **Start**       | `bun start`              | Start production server                      |
| **Lint**        | `bun lint`               | Run ESLint                                   |
| **Migrate**     | `bun run migrate`        | Run Prisma migrations + generate client      |
| **Seed**        | `bun run prisma/seed.ts` | Seed admin account                           |
| **Studio**      | `bun run studio`         | Prisma Studio (headless - open printed URL)  |

---

## 📁 Project Structure

```
regix-auth/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── seed.ts                # Admin account seeder
│   └── dev.db                 # SQLite database
├── prisma.config.ts           # Prisma 7 configuration
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Tailwind v4 + theme
│   │   ├── auth/
│   │   │   ├── page.tsx       # Login (email + Discord)
│   │   │   └── register/
│   │   │       └── page.tsx   # Registration
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # User dashboard
│   │   │   └── admin/
│   │   │       └── page.tsx   # Admin panel
│   │   ├── docs/
│   │   │   └── page.tsx       # Documentation
│   │   └── api/
│   │       ├── auth/          # Login, register, logout, session, Discord
│   │       ├── device/        # HWID/SID register & verify
│   │       ├── keys/          # Generate & redeem premium keys
│   │       ├── admin/         # User & key management
│   │       └── user/          # Update credentials, IP, Discord
│   ├── components/
│   │   ├── Header/            # Navigation with auth state
│   │   ├── Buttons/           # Theme toggle, logout
│   │   ├── Providers/         # Theme & Toast providers
│   │   └── shadcnui/          # shadcn/ui components
│   └── lib/
│       ├── auth.ts            # Core auth utilities
│       ├── env/               # Zod-validated env schemas
│       └── database/          # Prisma client singleton
├── bot/
│   ├── package.json           # Discord bot dependencies
│   └── src/
│       ├── index.ts           # Bot entry point
│       ├── commands/          # Slash commands
│       └── events/            # Bot events
├── .env.example               # Environment template
├── next.config.ts             # Next.js configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 🌐 API Reference

### Authentication Endpoints

| Method | Endpoint                     | Description                          | Auth |
| ------ | ---------------------------- | ------------------------------------ | ---- |
| `POST` | `/api/auth/login`            | Login with email/username + password | ❌   |
| `POST` | `/api/auth/register`         | Create new account                   | ❌   |
| `POST` | `/api/auth/logout`           | Destroy current session              | ✅   |
| `GET`  | `/api/auth/session`          | Get current user session             | ✅   |
| `GET`  | `/api/auth/discord/callback` | Discord OAuth2 callback              | ❌   |

### Device & HWID/SID Endpoints

| Method | Endpoint               | Description                         | Auth |
| ------ | ---------------------- | ----------------------------------- | ---- |
| `POST` | `/api/device/register` | Register HWID/SID for current user  | ✅   |
| `POST` | `/api/device/verify`   | Verify HWID/SID (for external apps) | ❌   |

### Premium Key Endpoints

| Method | Endpoint             | Description                        | Auth |
| ------ | -------------------- | ---------------------------------- | ---- |
| `POST` | `/api/keys/generate` | Generate license keys (Admin only) | ✅   |
| `POST` | `/api/keys/redeem`   | Redeem a license key               | ✅   |

### Admin Endpoints

| Method  | Endpoint           | Description                                  | Auth     |
| ------- | ------------------ | -------------------------------------------- | -------- |
| `GET`   | `/api/admin/users` | Get all users with details                   | ✅ Admin |
| `PATCH` | `/api/admin/users` | Manage user (blacklist/activate/role/delete) | ✅ Admin |
| `GET`   | `/api/admin/keys`  | Get all license keys                         | ✅ Admin |
| `PATCH` | `/api/admin/keys`  | Manage keys (activate/deactivate/delete)     | ✅ Admin |

### User Endpoints

| Method  | Endpoint                       | Description                  | Auth |
| ------- | ------------------------------ | ---------------------------- | ---- |
| `PATCH` | `/api/user/update-credentials` | Change password/display name | ✅   |
| `PATCH` | `/api/user/update-ip`          | Update registered IP         | ✅   |
| `PATCH` | `/api/user/update-discord`     | Link Discord ID              | ✅   |

---

## 🚢 Deploy to Render

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deployment

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/regix-auth.git
   git push -u origin main
   ```

2. **Create a Web Service on Render**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click **New +** → **Web Service**
   - Connect your GitHub repository
   - Configure:

   | Setting           | Value                                                                       |
   | ----------------- | --------------------------------------------------------------------------- |
   | **Name**          | `regix-auth`                                                                |
   | **Environment**   | `Node`                                                                      |
   | **Build Command** | `bun install && bun run migrate && bun run prisma/seed.ts && bun run build` |
   | **Start Command** | `bun start`                                                                 |
   | **Plan**          | Free or paid                                                                |

3. **Set Environment Variables**
   Add all variables from `.env.example` in Render's dashboard:

   | Variable               | Value                                                     |
   | ---------------------- | --------------------------------------------------------- |
   | `DATABASE_URL`         | `file:./prisma/dev.db`                                    |
   | `NODE_ENV`             | `production`                                              |
   | `NEXT_PUBLIC_APP_URL`  | `https://your-app.onrender.com`                           |
   | `DISCORD_REDIRECT_URI` | `https://your-app.onrender.com/api/auth/discord/callback` |
   | `SECRET_KEY`           | Generate a random string                                  |
   | `JWT_SECRET`           | Generate a random string                                  |
   | `SESSION_SECRET`       | Generate a random string                                  |

   > Generate secure secrets: `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Deploy!**
   - Click **Create Web Service**
   - Render will automatically build and deploy your app
   - First deployment takes 2-3 minutes

### Important Notes for Render

- **SQLite on Render**: The free plan uses an ephemeral filesystem. Database data will be lost on each redeploy. For production with persistent data, upgrade to a paid plan with a persistent disk or switch to PostgreSQL.
- **Build Failures**: If the build fails, check the logs. Common issues include missing environment variables.
- **Health Check**: The app uses the default Next.js health check endpoints.

---

## 🤖 Discord Bot Setup

The bot lives in the `bot/` directory with its own `package.json`.

```bash
cd bot
bun install
# Set DISCORD_BOT_TOKEN in your .env or bot/.env
bun dev
```

### Commands

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `/auth link <email>` | Link Discord to Regix Auth        |
| `/auth status`       | Check account & premium status    |
| `/auth premium`      | View premium subscription details |
| `/ping`              | Check bot latency                 |

---

## 🧪 Verification

```bash
# Quick lint check
bun lint

# Full production verification
bun run build

# The build must pass with zero errors
```

---

## 🛡️ Security Best Practices

- 🔑 **Change Default Password** immediately after first login
- 🔒 **Use HTTPS** in production
- 🎲 **Generate Strong Secrets** for `SECRET_KEY`, `JWT_SECRET`, `SESSION_SECRET`
- 📝 **Regularly Rotate** JWT and session secrets
- 👁️ **Monitor Audit Logs** for suspicious activity
- 🚫 **Never Commit** `.env` to version control
- ⏱️ **Set Rate Limiting** on API endpoints for production

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [discord.js](https://discord.js.org/)
- [Lucide Icons](https://lucide.dev/)

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/official-jahid">Jahid Ekbal Mallick</a>
</p>

<p align="center">
  <a href="https://github.com/official-jahid/regix-auth/stargazers">
    <img src="https://img.shields.io/github/stars/official-jahid/regix-auth?style=social" alt="GitHub stars" />
  </a>
  <a href="https://github.com/official-jahid/regix-auth/network/members">
    <img src="https://img.shields.io/github/forks/official-jahid/regix-auth?style=social" alt="GitHub forks" />
  </a>
</p>
