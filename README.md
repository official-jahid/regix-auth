# REGIX Auth System v3.0

A complete **licensing & authentication server** with HWID-based device locking, Discord bot integration, and a beautiful Tailwind CSS dashboard.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Integration Guides](#integration-guides)
  - [Website (HTML/JS Client)](#website-htmljs-client)
  - [EXE Application (C#/.NET)](#exe-application-cnet)
  - [Command Line (PowerShell)](#command-line-powershell)
  - [C++ DLL Injection](#c-dll-library)
  - [Python Script](#python-script)
- [Dashboard Routes](#dashboard-routes)
- [Discord Bot](#discord-bot)
- [Deployment (Render.com)](#deployment-rendercom)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features

- **Key-Gated Registration** - Users must enter a valid admin-generated license key
- **HWID Device Locking** - Locks accounts to specific hardware IDs
- **Dual Authentication** - Admin Panel + End-User logins
- **24h SID Cooldown** - Users can change HWID once every 24 hours
- **Admin Overrides** - Owners bypass cooldowns instantly
- **Bulk Key Generation** - Create multiple keys with duration presets
- **External Verification** - `GET /api/verify?sid=&key=` for any client app
- **Discord Bot** - Slash commands, DM notifications, presence tracking, server membership checks
- **Toast Notifications** - Zero-dependency animated toast system
- **Tailwind CSS v4** - No inline styles, fully responsive

## Tech Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| **Backend**  | Express.js v4                    |
| **ORM**      | Prisma v7 (LibSQL adapter)       |
| **Database** | SQLite (local) / Turso (cloud)   |
| **Frontend** | Tailwind CSS v4 + vanilla JS     |
| **Auth**     | JWT + bcryptjs + express-session |
| **Bot**      | Discord.js v14                   |
| **Runtime**  | Node.js 18+ / Bun                |

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd regix-auth
bun install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Discord bot token and secrets

# 3. Set up database and build CSS
bunx prisma db push
npm run build:css

# 4. Start server
bun run dev
```

Access:

- **Login**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/dashboard
- **User Dashboard**: http://localhost:3000/user-dashboard
- **Register**: http://localhost:3000/register
- **Docs**: http://localhost:3000/docs

Default admin credentials: `owner` / `RegixAdmin123!`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                    │
│  Website │ Desktop EXE │ PowerShell Script │ DLL Injector   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    Express.js Server (server.js)             │
│  ┌─────────────┬──────────────┬───────────────────────────┐  │
│  │ HTML Pages  │ REST APIs    │ Discord Bot Integration   │  │
│  │ (Tailwind)  │ (JWT/Secret) │ (slash commands + DMs)    │  │
│  └─────────────┴──────────────┴───────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Prisma ORM (LibSQL)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Keys    │AppUsers  │Licenses  │Blacklist │AuditLogs │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Verification Endpoint

**GET** `/api/verify?sid={HWID}&key={LICENSE_KEY}`

This is the endpoint your client applications call to verify credentials.

**Parameters:**
| Parameter | Description |
|---|---|
| `sid` | Hardware ID (SID) of the user's machine |
| `key` | License key or username |

**Success Response:**

```json
{
  "authorized": true,
  "message": "Verification successful.",
  "code": "AUTHORIZED",
  "expiry": 4102444799,
  "plan": "premium",
  "product": "REGIX-Auth",
  "username": "user123"
}
```

**Error Codes:**
| Code | Meaning |
|---|---|
| `MISSING_PARAMS` | sid or key is missing |
| `BLACKLISTED` | Device is blacklisted |
| `INVALID_CREDENTIALS` | Key not found |
| `BANNED` | Account/key is banned |
| `FROZEN` | Account/key is frozen |
| `EXPIRED` | Subscription expired |
| `SID_MISMATCH` | HWID not registered to account |
| `AUTHORIZED` | Successful verification |

---

## Integration Guides

### Website (HTML/JS Client)

```javascript
async function verifyLicense(sid, licenseKey) {
  const res = await fetch(
    `/api/verify?sid=${encodeURIComponent(sid)}&key=${encodeURIComponent(licenseKey)}`,
  );
  const data = await res.json();

  if (data.authorized && data.code === "AUTHORIZED") {
    console.log("Access granted! Expires:", new Date(data.expiry * 1000));
    return true;
  } else {
    console.log("Access denied:", data.message);
    return false;
  }
}
```

### EXE Application (C#/.NET)

```csharp
using System.Net.Http;
using Newtonsoft.Json.Linq;

public class RegixAuth
{
    private static readonly HttpClient client = new HttpClient();
    private const string SERVER_URL = "http://localhost:3000";

    public static async Task<bool> Verify(string sid, string key)
    {
        try
        {
            string url = $"{SERVER_URL}/api/verify?sid={Uri.EscapeDataString(sid)}&key={Uri.EscapeDataString(key)}";
            var response = await client.GetStringAsync(url);
            var json = JObject.Parse(response);

            bool authorized = json["authorized"]?.Value<bool>() ?? false;
            if (authorized)
            {
                long expiry = json["expiry"]?.Value<long>() ?? 0;
                Console.WriteLine($"Authorized! Expires: {DateTimeOffset.FromUnixTimeSeconds(expiry)}");
                return true;
            }

            Console.WriteLine($"Denied: {json["message"]}");
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine("Connection error: " + ex.Message);
            return false;
        }
    }
}
```

### Command Line (PowerShell)

```powershell
# Define REGIX auth function
function Invoke-RegixVerify {
    param(
        [string]$Sid,
        [string]$Key,
        [string]$ServerUrl = "http://localhost:3000"
    )

    try {
        $encodedSid = [Uri]::EscapeDataString($Sid)
        $encodedKey = [Uri]::EscapeDataString($Key)
        $url = "$ServerUrl/api/verify?sid=$encodedSid&key=$encodedKey"

        $response = Invoke-RestMethod -Uri $url -Method Get
        return $response
    }
    catch {
        return @{ authorized = $false; message = "Connection error: $_" }
    }
}

# Usage
$result = Invoke-RegixVerify -Sid "ABC123-HWID" -Key "REGIX-1A2B3C4D"
if ($result.authorized) {
    Write-Host "Access granted! Expiry: $($result.expiry)" -ForegroundColor Green
} else {
    Write-Host "Access denied: $($result.message)" -ForegroundColor Red
}
```

### C++ / DLL Library

```cpp
#include <windows.h>
#include <wininet.h>
#include <string>
#include <nlohmann/json.hpp> // Include nlohmann/json

#pragma comment(lib, "wininet.lib")

using json = nlohmann::json;

bool RegixVerify(const std::string& sid, const std::string& key, const std::string& serverUrl) {
    HINTERNET hInternet = InternetOpenA("REGIX-Auth/1.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return false;

    std::string url = serverUrl + "/api/verify?sid=" + sid + "&key=" + key;

    HINTERNET hConnect = InternetOpenUrlA(hInternet, url.c_str(), NULL, 0,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return false;
    }

    char buffer[4096] = {0};
    DWORD bytesRead = 0;
    std::string response;

    while (InternetReadFile(hConnect, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
        buffer[bytesRead] = 0;
        response += buffer;
    }

    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);

    try {
        json result = json::parse(response);
        return result["authorized"].get<bool>();
    } catch (...) {
        return false;
    }
}

// Usage in DLL entry point:
BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID lpReserved) {
    if (reason == DLL_PROCESS_ATTACH) {
        if (!RegixVerify("ABC123-HWID", "REGIX-1A2B3C4D", "http://localhost:3000")) {
            MessageBoxA(NULL, "License verification failed!", "REGIX Auth", MB_ICONERROR);
            ExitProcess(1);
        }
    }
    return TRUE;
}
```

### Python Script

```python
import requests
import urllib.parse

def verify_regix(sid, key, server_url="http://localhost:3000"):
    """Verify license with REGIX Auth Server."""
    url = f"{server_url}/api/verify"
    params = {
        "sid": sid,
        "key": key
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if data.get("authorized"):
            print(f"Authorized! Plan: {data.get('plan')}, Product: {data.get('product')}")
            return True, data
        else:
            print(f"Denied: {data.get('message')} (Code: {data.get('code')})")
            return False, data
    except requests.RequestException as e:
        print(f"Connection error: {e}")
        return False, {"authorized": False, "message": str(e)}

# Usage
success, result = verify_regix("ABC123-HWID", "REGIX-1A2B3C4D")
```

---

## Dashboard Routes

| Route             | Description                   |
| ----------------- | ----------------------------- |
| `/login`          | Dual-tab login (Panel + User) |
| `/register`       | Key-gated account creation    |
| `/dashboard`      | Admin command center          |
| `/user-dashboard` | End-user profile & settings   |
| `/docs`           | API documentation             |

## Discord Bot

### Commands

| Command        | Access    | Description                                |
| -------------- | --------- | ------------------------------------------ |
| `/genkey`      | Admin/Mod | Generate license keys with custom duration |
| `/genuser`     | Admin/Mod | Create app user accounts                   |
| `/genlicense`  | Admin/Mod | Generate plan-based licenses               |
| `/blacklist`   | Admin/Mod | Blacklist a HWID                           |
| `/unblacklist` | Admin/Mod | Remove HWID from blacklist                 |
| `/reset`       | Admin/Mod | Reset user's HWID                          |
| `/userinfo`    | Everyone  | View user details                          |
| `/keyinfo`     | Everyone  | View key details                           |
| `/licenseinfo` | Everyone  | View license details                       |
| `/stats`       | Everyone  | System statistics                          |
| `/help`        | Everyone  | List all commands                          |

### Bot Behavior

- **Account Required**: Users must register at the website before using any command
- **Server Membership**: Users must join your Discord server to use commands
- **DM Notifications**: Bot sends welcome DM when user joins the server
- **Online Tracking**: Bot tracks user online/offline status via presence events

## Deployment (Render.com)

### Step 1: Create a Web Service

- Select **Node.js** as runtime
- Set **Build Command**: `npm run build`
- Set **Start Command**: `npm start`

### Step 2: Environment Variables

Add these in Render's Environment tab:

```
DATABASE_URL=libsql://your-turso-db-url?authToken=your-token
NODE_ENV=production
PORT=3000
SECRET_KEY=RegixSecretKey2024!@#$%^
JWT_SECRET=RegixJwtSecretForTokenGeneration2024!@#$
SESSION_SECRET=RegixSessionSecretForWebDashboard2024!@#$
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_GUILD_ID=your-discord-guild-id
DISCORD_ADMIN_ROLE_ID=your-discord-admin-role-id
DISCORD_MOD_ROLE_ID=your-discord-mod-role-id
ADMIN_USERNAME=owner
ADMIN_PASSWORD=RegixAdmin123!
ADMIN_EMAIL=admin@regix-auth.com
```

### Step 3: Database

For production, use **Turso** (LibSQL cloud):

1. Create a database at [turso.tech](https://turso.tech)
2. Get the connection URL and auth token
3. Set `DATABASE_URL` in Render environment variables

---

## Environment Variables

| Variable            | Description                     | Default                      |
| ------------------- | ------------------------------- | ---------------------------- |
| `DATABASE_URL`      | LibSQL/SQLite connection string | `file:./prisma/dev.db`       |
| `PORT`              | Server port                     | `3000`                       |
| `NODE_ENV`          | Environment mode                | `development`                |
| `SECRET_KEY`        | Admin API secret key            | `RegixSecretKey2024!@#$%^`   |
| `JWT_SECRET`        | JWT signing secret              | `RegixJwtSecret2024!@#$`     |
| `SESSION_SECRET`    | Session cookie secret           | `RegixSessionSecret2024!@#$` |
| `DISCORD_BOT_TOKEN` | Discord bot token               | Required                     |
| `DISCORD_CLIENT_ID` | Discord application ID          | Required                     |
| `DISCORD_GUILD_ID`  | Discord server ID               | Required                     |
| `ADMIN_USERNAME`    | Default admin username          | `owner`                      |
| `ADMIN_PASSWORD`    | Default admin password          | `RegixAdmin123!`             |
| `ADMIN_EMAIL`       | Default admin email             | `admin@regix-auth.com`       |

## License

REGIX Auth System v3.0 - Proprietary. All rights reserved.
