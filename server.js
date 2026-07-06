// ============================================================
// REGIX AUTH SYSTEM - Complete Backend Server (SECURE)
// ============================================================

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || "RegixSecretKey2024!@#$%^";
const JWT_SECRET = process.env.JWT_SECRET || "RegixJwtSecret2024!@#$";

// ------------------------------------------------------------
// PRISMA SETUP
// ------------------------------------------------------------
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------
// SECURITY MIDDLEWARE
// ------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static("public", { maxAge: "1h" }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/panel/login", authLimiter);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "RegixSessionSecret2024!@#$",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket.remoteAddress ||
  "0.0.0.0";

function generateKey(prefix = "REGIX") {
  return prefix + "-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

function generateLicense(prefix = "LIC") {
  const seg1 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const seg2 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const seg3 = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${seg1}-${seg2}-${seg3}`;
}

async function logAudit(
  action,
  details,
  ip = null,
  userId = null,
  apiId = null,
  keyId = null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        ip,
        user_id: userId,
        api_id: apiId,
        key_id: keyId,
      },
    });
  } catch (e) {
    /* silent */
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );
}

function sanitize(str) {
  if (!str) return "";
  return String(str).replace(/[<>&"']/g, function (c) {
    return "&#" + c.charCodeAt(0) + ";";
  });
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
      return next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }
  if (req.path.startsWith("/api/"))
    return res.status(401).json({ error: "Unauthorized" });
  return res.redirect("/login");
}

function requireRole(...roles) {
  return async (req, res, next) => {
    const userId = req.session?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await prisma.panelUser.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!roles.includes(user.role))
      return res.status(403).json({ error: "Insufficient permissions" });
    req.panelUser = user;
    next();
  };
}

const verifySecret = (req, res, next) => {
  const requestSecret = req.query.secret || req.body.secret;
  if (!requestSecret || requestSecret !== SECRET)
    return res.status(401).json({ error: "Unauthorized: Invalid Secret Key" });
  next();
};

// ============================================================
// PAGES
// ============================================================
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html")),
);
app.get("/docs", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "docs.html")),
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")),
);
app.get("/user-dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "user-dashboard.html")),
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "register.html")),
);

// ============================================================
// PHASE 1: KEY-GATED REGISTRATION
// ============================================================
app.post("/api/auth/register", async (req, res) => {
  const { licenseKey, username, password, fullName, email, discordId } =
    req.body;
  const ip = getClientIp(req);

  if (!licenseKey || !username || !password) {
    return res.status(400).json({
      success: false,
      message: "License key, username, and password are required.",
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters.",
    });
  }

  try {
    // 1. Validate the license key exists and is active
    const key = await prisma.key.findUnique({
      where: { key_code: licenseKey },
    });
    if (!key) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid license key." });
    }
    if (key.status === "redeemed") {
      return res.status(400).json({
        success: false,
        message: "This license key has already been redeemed.",
      });
    }
    if (key.status === "banned" || key.status === "frozen") {
      return res.status(400).json({
        success: false,
        message: `This license key is ${key.status}.`,
      });
    }
    if (key.status === "expired") {
      return res
        .status(400)
        .json({ success: false, message: "This license key has expired." });
    }
    if (key.expiry_date && new Date(key.expiry_date) < new Date()) {
      await prisma.key.update({
        where: { id: key.id },
        data: { status: "expired" },
      });
      return res
        .status(400)
        .json({ success: false, message: "This license key has expired." });
    }

    // 2. Check username uniqueness
    const existingUser = await prisma.appUser.findUnique({
      where: { username },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username already taken." });
    }

    // 3. Check email uniqueness if provided
    if (email) {
      const existingEmail = await prisma.appUser.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use." });
      }
    }

    // 4. Create the user account with all profile fields
    const hours = key.duration || 720;
    const expiryDate =
      hours > 800000 ?
        new Date("2099-12-31T23:59:59")
      : new Date(Date.now() + hours * 60 * 60 * 1000);

    const user = await prisma.appUser.create({
      data: {
        username,
        password,
        fullName: fullName || null,
        email: email || null,
        discordId: discordId || null,
        duration: hours,
        max_devices: key.max_devices || 1,
        status: "active",
        expiry_date: expiryDate,
        ip_address: ip,
        redeemed_key: licenseKey,
      },
    });

    // 5. Mark the key as redeemed and link to user
    await prisma.key.update({
      where: { id: key.id },
      data: {
        status: "redeemed",
        redeemed_by: user.id,
        redeemed_at: new Date(),
        used_devices: "",
        ip_address: ip,
      },
    });

    await logAudit(
      "user_registered",
      `User "${username}" registered with key ${licenseKey}`,
      ip,
      user.id,
      null,
      key.id,
    );

    return res.json({
      success: true,
      message: "Account created successfully! License key has been redeemed.",
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        discordId: user.discordId,
        expiry: expiryDate,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// ============================================================
// PHASE 1: USER DASHBOARD API (for end-users)
// ============================================================
app.post("/api/user/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = getClientIp(req);
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Username and password required." });

  try {
    const user = await prisma.appUser.findUnique({ where: { username } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    if (user.password !== password)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    if (user.status === "banned")
      return res
        .status(403)
        .json({ success: false, message: "Account is banned." });
    if (user.status === "frozen")
      return res
        .status(403)
        .json({ success: false, message: "Account is frozen." });

    // Check expiry
    if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
      await prisma.appUser.update({
        where: { id: user.id },
        data: { status: "expired" },
      });
      return res
        .status(403)
        .json({ success: false, message: "Subscription has expired." });
    }

    // Update last login and IP
    await prisma.appUser.update({
      where: { id: user.id },
      data: { last_login: new Date(), ip_address: ip },
    });

    // Generate a user token (not the same as panel JWT)
    const userToken = jwt.sign(
      { id: user.id, username: user.username, type: "appuser" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    await logAudit("user_login", `User "${username}" logged in`, ip, user.id);

    return res.json({
      success: true,
      token: userToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        discordId: user.discordId,
        status: user.status,
        expiry_date: user.expiry_date,
        max_devices: user.max_devices,
        used_devices: user.used_devices,
        ip_address: user.ip_address,
        redeemed_key: user.redeemed_key,
        last_hwid_reset: user.last_hwid_reset,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("User login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Middleware for app user auth
function requireAppUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    if (decoded.type !== "appuser") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token type." });
    }
    req.appUserId = decoded.id;
    req.appUsername = decoded.username;
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
}

// Get user profile data
app.get("/api/user/profile", requireAppUser, async (req, res) => {
  try {
    const user = await prisma.appUser.findUnique({
      where: { id: req.appUserId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        discordId: true,
        status: true,
        expiry_date: true,
        max_devices: true,
        used_devices: true,
        ip_address: true,
        redeemed_key: true,
        last_hwid_reset: true,
        created_at: true,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Get the redeemed key info
    let keyInfo = null;
    if (user.redeemed_key) {
      const key = await prisma.key.findUnique({
        where: { key_code: user.redeemed_key },
      });
      if (key) {
        keyInfo = {
          key_code: key.key_code,
          duration: key.duration,
          max_devices: key.max_devices,
          status: key.status,
          created_at: key.created_at,
        };
      }
    }

    // Get HWID devices
    const devices =
      user.used_devices ? user.used_devices.split(",").filter(Boolean) : [];

    return res.json({
      success: true,
      user: {
        ...user,
        devices,
        keyInfo,
        isExpired:
          user.expiry_date ? new Date(user.expiry_date) < new Date() : false,
        isLifetime:
          user.expiry_date ? user.expiry_date > new Date("2099-01-01") : false,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Update SID (HWID) with 24-hour rate limit
app.post("/api/user/update-sid", requireAppUser, async (req, res) => {
  const { newSid } = req.body;
  if (!newSid)
    return res
      .status(400)
      .json({ success: false, message: "New SID/HWID is required." });

  try {
    const user = await prisma.appUser.findUnique({
      where: { id: req.appUserId },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Check 24-hour cooldown
    if (user.last_hwid_reset) {
      const hoursSinceReset =
        (Date.now() - new Date(user.last_hwid_reset).getTime()) /
        (1000 * 60 * 60);
      if (hoursSinceReset < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceReset);
        const minutesLeft = Math.ceil((24 - hoursSinceReset) * 60);
        return res.status(429).json({
          success: false,
          message: `SID update is on cooldown. Available in ${hoursLeft}h ${minutesLeft % 60}m.`,
          cooldownMinutes: Math.ceil((24 - hoursSinceReset) * 60),
          cooldownEnds: new Date(
            new Date(user.last_hwid_reset).getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
      }
    }

    // Update the HWID in used_devices
    const currentDevices =
      user.used_devices ? user.used_devices.split(",").filter(Boolean) : [];
    // Replace the first device or add new one
    let newDevices;
    if (currentDevices.length > 0) {
      newDevices = [newSid, ...currentDevices.slice(1)];
    } else {
      newDevices = [newSid];
    }

    await prisma.appUser.update({
      where: { id: user.id },
      data: {
        used_devices: newDevices.join(","),
        last_hwid_reset: new Date(),
      },
    });

    await logAudit(
      "user_update_sid",
      `User "${user.username}" updated SID to ${newSid}`,
      null,
      user.id,
    );

    return res.json({
      success: true,
      message: "SID updated successfully. Next update available in 24 hours.",
      cooldownEnds: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("Update SID error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Get SID cooldown status
app.get("/api/user/sid-cooldown", requireAppUser, async (req, res) => {
  try {
    const user = await prisma.appUser.findUnique({
      where: { id: req.appUserId },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (!user.last_hwid_reset) {
      return res.json({ success: true, onCooldown: false, minutesLeft: 0 });
    }

    const hoursSinceReset =
      (Date.now() - new Date(user.last_hwid_reset).getTime()) /
      (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      return res.json({ success: true, onCooldown: false, minutesLeft: 0 });
    }

    const minutesLeft = Math.ceil((24 - hoursSinceReset) * 60);
    return res.json({
      success: true,
      onCooldown: true,
      minutesLeft,
      hoursLeft: Math.floor(minutesLeft / 60),
      cooldownEnds: new Date(
        new Date(user.last_hwid_reset).getTime() + 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Update IP address (auto-detect)
app.post("/api/user/update-ip", requireAppUser, async (req, res) => {
  const ip = getClientIp(req);
  try {
    await prisma.appUser.update({
      where: { id: req.appUserId },
      data: { ip_address: ip },
    });
    return res.json({ success: true, message: "IP address updated.", ip });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Update Discord ID
app.post("/api/user/update-discord", requireAppUser, async (req, res) => {
  const { discordId } = req.body;
  if (!discordId)
    return res
      .status(400)
      .json({ success: false, message: "Discord ID is required." });

  try {
    await prisma.appUser.update({
      where: { id: req.appUserId },
      data: { discordId },
    });
    await logAudit(
      "user_update_discord",
      `User updated Discord ID to ${discordId}`,
      null,
      req.appUserId,
    );
    return res.json({
      success: true,
      message: "Discord ID updated.",
      discordId,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// ============================================================
// PHASE 4: EXTERNAL SESSION VERIFICATION ENDPOINT
// ============================================================
app.get("/api/verify", async (req, res) => {
  const { sid, key } = req.query;
  const ip = getClientIp(req);

  if (!sid || !key) {
    return res.json({
      authorized: false,
      message: "Missing required parameters: sid and key.",
      code: "MISSING_PARAMS",
    });
  }

  try {
    // Check blacklist first
    const isBlacklisted = await prisma.blacklist.findUnique({
      where: { hwid: sid },
    });
    if (isBlacklisted) {
      await logAudit(
        "verify_blocked",
        `Blacklisted SID attempted verification: ${sid}`,
        ip,
      );
      return res.json({
        authorized: false,
        message: "Device is blacklisted.",
        code: "BLACKLISTED",
      });
    }

    // Try to find by key (license key)
    let target = await prisma.key.findUnique({ where: { key_code: key } });
    let targetType = "key";

    if (!target) {
      target = await prisma.license.findUnique({ where: { license_key: key } });
      targetType = "license";
    }

    if (!target) {
      // Try app user by username
      target = await prisma.appUser.findUnique({ where: { username: key } });
      targetType = "appUser";
    }

    if (!target) {
      return res.json({
        authorized: false,
        message: "Invalid credentials.",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Check status
    if (target.status === "banned") {
      return res.json({
        authorized: false,
        message: "Account/key is banned.",
        code: "BANNED",
      });
    }
    if (target.status === "frozen") {
      return res.json({
        authorized: false,
        message: "Account/key is frozen.",
        code: "FROZEN",
      });
    }
    if (
      target.status === "expired" ||
      (target.status === "redeemed" && targetType === "key")
    ) {
      // For keys that are redeemed, check the user's status
      if (targetType === "key" && target.redeemed_by) {
        const user = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (user) {
          if (user.status === "banned")
            return res.json({
              authorized: false,
              message: "Account is banned.",
              code: "BANNED",
            });
          if (user.status === "frozen")
            return res.json({
              authorized: false,
              message: "Account is frozen.",
              code: "FROZEN",
            });
          if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
            return res.json({
              authorized: false,
              message: "Subscription expired.",
              code: "EXPIRED",
            });
          }
          // Check SID match against user
          const userDevices =
            user.used_devices ?
              user.used_devices.split(",").filter(Boolean)
            : [];
          if (userDevices.length > 0 && !userDevices.includes(sid)) {
            return res.json({
              authorized: false,
              message: "SID not registered to this account.",
              code: "SID_MISMATCH",
            });
          }
          const expTimestamp =
            user.expiry_date ?
              Math.floor(new Date(user.expiry_date).getTime() / 1000)
            : 4102444799;
          await prisma.appUser.update({
            where: { id: user.id },
            data: { last_login: new Date(), ip_address: ip },
          });
          return res.json({
            authorized: true,
            message: "Verification successful.",
            code: "AUTHORIZED",
            expiry: expTimestamp,
            username: user.username,
            plan: "premium",
            product: "REGIX-Auth",
          });
        }
      }
      return res.json({
        authorized: false,
        message: "Credentials expired.",
        code: "EXPIRED",
      });
    }

    // Check expiry
    if (target.expiry_date && new Date(target.expiry_date) < new Date()) {
      const updateData = {};
      if (targetType === "key") updateData.status = "expired";
      else if (targetType === "license") updateData.status = "expired";
      else if (targetType === "appUser") updateData.status = "expired";
      await prisma[
        targetType === "key" ? "key"
        : targetType === "license" ? "license"
        : "appUser"
      ].update({
        where: { id: target.id },
        data: updateData,
      });
      return res.json({
        authorized: false,
        message: "Subscription expired.",
        code: "EXPIRED",
      });
    }

    // Check SID match
    let devices =
      target.used_devices ? target.used_devices.split(",").filter(Boolean) : [];

    // For keys that are redeemed, check the user's devices
    if (targetType === "key" && target.redeemed_by) {
      const user = await prisma.appUser.findUnique({
        where: { id: target.redeemed_by },
      });
      if (user) {
        devices =
          user.used_devices ? user.used_devices.split(",").filter(Boolean) : [];
      }
    }

    if (devices.length > 0 && !devices.includes(sid)) {
      return res.json({
        authorized: false,
        message: "SID not registered to this account.",
        code: "SID_MISMATCH",
      });
    }

    // Update last used
    const now = new Date();
    if (targetType === "key")
      await prisma.key.update({
        where: { id: target.id },
        data: { last_used_at: now, ip_address: ip },
      });
    else if (targetType === "license")
      await prisma.license.update({
        where: { id: target.id },
        data: { last_used_at: now, ip_address: ip },
      });
    else if (targetType === "appUser")
      await prisma.appUser.update({
        where: { id: target.id },
        data: { last_login: now, ip_address: ip },
      });

    const expTimestamp =
      target.expiry_date ?
        Math.floor(new Date(target.expiry_date).getTime() / 1000)
      : 4102444799;

    await logAudit(
      "verify_success",
      `Verification successful for ${key} with SID ${sid}`,
      ip,
    );

    return res.json({
      authorized: true,
      message: "Verification successful.",
      code: "AUTHORIZED",
      expiry: expTimestamp,
      plan: targetType === "license" ? target.plan : "premium",
      product: targetType === "license" ? target.product : "REGIX-Auth",
      username: targetType === "appUser" ? target.username : undefined,
    });
  } catch (err) {
    console.error("Verify error:", err);
    return res
      .status(500)
      .json({ authorized: false, message: "System error.", code: "ERROR" });
  }
});

// ============================================================
// PANEL AUTH
// ============================================================
app.post("/api/panel/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const user = await prisma.panelUser.findUnique({
      where: { username: sanitize(username) },
    });
    if (!user || !user.isActive)
      return res.status(401).json({ error: "Invalid credentials" });
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user.id;
    req.session.role = user.role;
    const token = generateToken(user);
    await logAudit(
      "panel_login",
      `Panel login: ${username}`,
      getClientIp(req),
      user.id,
    );
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/panel/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/panel/me", requireAuth, async (req, res) => {
  const userId = req.session?.userId || req.user?.id;
  const user = await prisma.panelUser.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true, email: true, avatar: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
});

app.post(
  "/api/panel/users",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email)
      return res.status(400).json({ error: "All fields required" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    try {
      const exists = await prisma.panelUser.findUnique({
        where: { username: sanitize(username) },
      });
      if (exists) return res.status(400).json({ error: "Username exists" });
      const emailExists = await prisma.panelUser.findUnique({
        where: { email },
      });
      if (emailExists) return res.status(400).json({ error: "Email exists" });
      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.panelUser.create({
        data: {
          username: sanitize(username),
          password: hashed,
          email,
          role: role || "user",
        },
      });
      await logAudit(
        "panel_create_user",
        `Created panel user: ${username}`,
        getClientIp(req),
        req.panelUser.id,
      );
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.get(
  "/api/panel/users",
  requireAuth,
  requireRole("owner", "developer", "moderator"),
  async (req, res) => {
    const users = await prisma.panelUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        discordId: true,
      },
      orderBy: { id: "desc" },
    });
    return res.json({ users });
  },
);

app.delete(
  "/api/panel/users/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      if (id === req.panelUser.id)
        return res.status(400).json({ error: "Cannot delete yourself" });
      await prisma.panelUser.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ============================================================
// DISCORD BOT
// ============================================================
let discordClient = null;

async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || token === "YOUR_DISCORD_BOT_TOKEN_HERE") {
    console.log("[DISCORD] No bot token configured.");
    return;
  }
  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ],
    });
    discordClient.once("ready", async () => {
      console.log(`[DISCORD] Bot logged in as ${discordClient.user.tag}`);
      await registerCommands();
    });
    discordClient.on("interactionCreate", handleInteraction);
    discordClient.on("messageCreate", handleMessage);
    discordClient.on("guildMemberAdd", handleGuildMemberAdd);
    discordClient.on("guildMemberRemove", handleGuildMemberRemove);
    discordClient.on("presenceUpdate", handlePresenceUpdate);
    await discordClient.login(token);
  } catch (err) {
    console.error("[DISCORD] Failed to start bot:", err.message);
  }
}

// Helper: Check if a Discord user has an account in the system
async function getAppUserByDiscordId(discordId) {
  return await prisma.appUser.findFirst({ where: { discordId } });
}

// Helper: Check if user is in the guild and get their presence
async function getDiscordMember(guildId, userId) {
  if (!discordClient) return null;
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) return null;
    const member = await guild.members.fetch(userId).catch(() => null);
    return member;
  } catch (e) {
    return null;
  }
}

// Helper: Send DM to a Discord user
async function sendDiscordDM(userId, content, embed = null) {
  if (!discordClient) return;
  try {
    const user = await discordClient.users.fetch(userId);
    if (!user) return;
    const dmChannel = await user.createDM();
    if (embed) {
      await dmChannel.send({ content, embeds: [embed] });
    } else {
      await dmChannel.send(content);
    }
  } catch (e) {
    console.error("[DISCORD DM] Failed to send DM:", e.message);
  }
}

// Helper: Require account registration before using bot commands
async function requireBotAccount(interaction) {
  const discordId = interaction.user.id;
  const user = await getAppUserByDiscordId(discordId);
  if (!user) {
    await interaction.editReply({
      content: `❌ **Account Required**\nYou must first create an account at ${process.env.SITE_URL || "https://regix-auth.onrender.com"}/register\nLink your Discord ID during registration to use bot commands.`,
    });
    return null;
  }
  if (user.status === "banned") {
    await interaction.editReply({
      content: "❌ Your account has been banned. Contact support.",
    });
    return null;
  }
  return user;
}

// Guild member events
async function handleGuildMemberAdd(member) {
  const discordId = member.user.id;
  const user = await getAppUserByDiscordId(discordId);
  if (user) {
    await logAudit(
      "discord_server_join",
      `User ${user.username} joined the Discord server`,
      null,
      user.id,
    );
    await sendDiscordDM(
      discordId,
      "✅ **REGIX Auth**\nYour Discord account has been linked. You can now use bot commands!\nUse `/help` to see available commands.",
    );
  }
}

async function handleGuildMemberRemove(member) {
  const discordId = member.user.id;
  const user = await getAppUserByDiscordId(discordId);
  if (user) {
    await logAudit(
      "discord_server_leave",
      `User ${user.username} left the Discord server`,
      null,
      user.id,
    );
  }
}

async function handlePresenceUpdate(oldPresence, newPresence) {
  const discordId = newPresence.userId;
  const user = await getAppUserByDiscordId(discordId);
  if (user) {
    const status = newPresence.status || "offline";
    // Update user metadata with online status
    await prisma.appUser
      .update({
        where: { id: user.id },
        data: {
          metadata: JSON.stringify({
            discordOnline: status === "online",
            discordStatus: status,
            lastSeen: new Date().toISOString(),
          }),
        },
      })
      .catch(() => {});
  }
}

async function registerCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !clientId) return;
  const commands = [
    new SlashCommandBuilder()
      .setName("genkey")
      .setDescription("Generate license keys")
      .addIntegerOption((o) =>
        o
          .setName("amount")
          .setDescription("Number of keys")
          .setMinValue(1)
          .setMaxValue(50),
      )
      .addStringOption((o) =>
        o
          .setName("duration")
          .setDescription("Duration (e.g., 30d, 24h, lifetime)")
          .setRequired(false),
      )
      .addIntegerOption((o) =>
        o
          .setName("maxdev")
          .setDescription("Max devices")
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("genuser")
      .setDescription("Create an app user")
      .addStringOption((o) =>
        o.setName("username").setDescription("Username").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("password").setDescription("Password").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("duration").setDescription("Duration").setRequired(false),
      )
      .addIntegerOption((o) =>
        o
          .setName("maxdev")
          .setDescription("Max devices")
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("genlicense")
      .setDescription("Generate a plan license")
      .addStringOption((o) =>
        o.setName("plan").setDescription("Plan type").setRequired(true),
      )
      .addIntegerOption((o) =>
        o
          .setName("days")
          .setDescription("Duration in days")
          .setMinValue(1)
          .setMaxValue(3650)
          .setRequired(false),
      )
      .addIntegerOption((o) =>
        o
          .setName("amount")
          .setDescription("Number of licenses")
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("blacklist")
      .setDescription("Blacklist a HWID")
      .addStringOption((o) =>
        o.setName("hwid").setDescription("HWID to blacklist").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("reason").setDescription("Reason").setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName("unblacklist")
      .setDescription("Remove HWID from blacklist")
      .addStringOption((o) =>
        o
          .setName("hwid")
          .setDescription("HWID to unblacklist")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Get user info")
      .addStringOption((o) =>
        o.setName("username").setDescription("Username").setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("keyinfo")
      .setDescription("Get key info")
      .addStringOption((o) =>
        o.setName("key").setDescription("Key code").setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("licenseinfo")
      .setDescription("Get license info")
      .addStringOption((o) =>
        o.setName("license").setDescription("License key").setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("reset")
      .setDescription("Reset user HWID")
      .addStringOption((o) =>
        o.setName("username").setDescription("Username").setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Show system statistics"),
    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Show bot commands"),
  ];
  try {
    const rest = new REST({ version: "10" }).setToken(token);
    if (guildId)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
    else
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("[DISCORD] Commands registered");
  } catch (err) {
    console.error("[DISCORD] Failed to register commands:", err.message);
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isCommand()) return;
  const { commandName, options, user } = interaction;
  const hasAdminRole =
    process.env.DISCORD_ADMIN_ROLE_ID ?
      interaction.member?.roles?.cache?.has(process.env.DISCORD_ADMIN_ROLE_ID)
    : false;
  const hasModRole =
    process.env.DISCORD_MOD_ROLE_ID ?
      interaction.member?.roles?.cache?.has(process.env.DISCORD_MOD_ROLE_ID)
    : false;
  const needsRole = [
    "genkey",
    "genuser",
    "genlicense",
    "blacklist",
    "unblacklist",
    "reset",
  ];
  if (needsRole.includes(commandName) && !hasAdminRole && !hasModRole)
    return interaction.reply({
      content: "❌ Only admins/moderators can use this command.",
      ephemeral: true,
    });

  // Check if user is in the Discord server
  const guildId = process.env.DISCORD_GUILD_ID;
  if (guildId && interaction.guild) {
    const member = await getDiscordMember(guildId, user.id);
    if (!member) {
      return interaction.reply({
        content: `❌ You must be a member of our Discord server to use commands.\nJoin: https://discord.gg/zZwDv7ks5W`,
        ephemeral: true,
      });
    }
  }

  await interaction.deferReply({
    ephemeral: commandName !== "stats" && commandName !== "help",
  });

  // Require website account for all commands
  const appUser = await requireBotAccount(interaction);
  if (!appUser) return;
  try {
    switch (commandName) {
      case "genkey": {
        const amount = options.getInteger("amount") || 1;
        const durStr = options.getString("duration") || "30d";
        const maxDev = options.getInteger("maxdev") || 1;
        let hours = 720;
        const match = durStr.match(/^(\d+)([hdwml])$/i);
        if (match) {
          const val = parseInt(match[1]),
            unit = match[2].toLowerCase();
          if (unit === "h") hours = val;
          else if (unit === "d") hours = val * 24;
          else if (unit === "w") hours = val * 24 * 7;
          else if (unit === "m") hours = val * 24 * 30;
          else if (unit === "l") hours = 876000;
        } else if (durStr.toLowerCase() === "lifetime") hours = 876000;
        let keys = [];
        for (let i = 0; i < amount; i++) {
          const keyCode = generateKey("REGIX");
          await prisma.key.create({
            data: {
              key_code: keyCode,
              duration: hours,
              max_devices: maxDev,
              note: `Discord Bot - ${user.username}`,
            },
          });
          keys.push(keyCode);
        }
        await logAudit(
          "discord_genkey",
          `Bot ${user.username} generated ${amount} keys`,
          null,
        );
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle("🔑 Keys Generated")
          .setDescription(`\`\`\`\n${keys.join("\n")}\n\`\`\``)
          .setFooter({
            text: `Amount: ${amount} | Duration: ${durStr} | Max Devices: ${maxDev}`,
          });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "genuser": {
        const username = options.getString("username"),
          password = options.getString("password"),
          durStr = options.getString("duration") || "30d",
          maxDev = options.getInteger("maxdev") || 1;
        let hours = 720;
        const match = durStr.match(/^(\d+)([hdwml])$/i);
        if (match) {
          const val = parseInt(match[1]),
            unit = match[2].toLowerCase();
          if (unit === "h") hours = val;
          else if (unit === "d") hours = val * 24;
          else if (unit === "w") hours = val * 24 * 7;
          else if (unit === "m") hours = val * 24 * 30;
          else if (unit === "l") hours = 876000;
        } else if (durStr.toLowerCase() === "lifetime") hours = 876000;
        const existing = await prisma.appUser.findUnique({
          where: { username },
        });
        if (existing)
          return interaction.editReply({
            content: `❌ User \`${username}\` already exists!`,
          });
        await prisma.appUser.create({
          data: { username, password, duration: hours, max_devices: maxDev },
        });
        await logAudit(
          "discord_genuser",
          `Bot ${user.username} created user: ${username}`,
          null,
        );
        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("✅ User Created")
          .addFields(
            { name: "Username", value: `\`${username}\``, inline: true },
            { name: "Password", value: `\`${password}\``, inline: true },
            { name: "Duration", value: durStr, inline: true },
            { name: "Max Devices", value: `${maxDev}`, inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "genlicense": {
        const plan = options.getString("plan"),
          days = options.getInteger("days") || 30,
          amount = options.getInteger("amount") || 1;
        let licenses = [];
        for (let i = 0; i < amount; i++) {
          const licKey = generateLicense("REGIX");
          const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          await prisma.license.create({
            data: {
              license_key: licKey,
              plan,
              duration_days: days,
              max_devices: 1,
              expiry_date: expiry,
            },
          });
          licenses.push(licKey);
        }
        await logAudit(
          "discord_genlicense",
          `Bot ${user.username} generated ${amount} licenses`,
          null,
        );
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle("📜 Licenses Generated")
          .setDescription(`\`\`\`\n${licenses.join("\n")}\n\`\`\``)
          .setFooter({
            text: `Plan: ${plan} | Days: ${days} | Amount: ${amount}`,
          });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "blacklist": {
        const hwid = options.getString("hwid"),
          reason = options.getString("reason") || "Blacklisted by Discord Bot";
        await prisma.blacklist.upsert({
          where: { hwid },
          update: { reason },
          create: { hwid, reason },
        });
        await logAudit(
          "discord_blacklist",
          `Bot ${user.username} blacklisted ${hwid}`,
          null,
        );
        await interaction.editReply({
          content: `⛔ HWID \`${hwid}\` blacklisted.`,
        });
        break;
      }
      case "unblacklist": {
        const hwidU = options.getString("hwid");
        await prisma.blacklist
          .delete({ where: { hwid: hwidU } })
          .catch(() => {});
        await logAudit(
          "discord_unblacklist",
          `Bot ${user.username} unblacklisted ${hwidU}`,
          null,
        );
        await interaction.editReply({
          content: `✅ HWID \`${hwidU}\` removed from blacklist.`,
        });
        break;
      }
      case "userinfo": {
        const usr = options.getString("username");
        const appUser = await prisma.appUser.findUnique({
          where: { username: usr },
        });
        if (!appUser)
          return interaction.editReply({
            content: `❌ User \`${usr}\` not found.`,
          });
        const devices =
          appUser.used_devices ?
            appUser.used_devices.split(",").filter(Boolean)
          : [];
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle(`👤 User: ${appUser.username}`)
          .addFields(
            { name: "ID", value: `${appUser.id}`, inline: true },
            { name: "Status", value: appUser.status, inline: true },
            {
              name: "Devices",
              value: `${devices.length}/${appUser.max_devices}`,
              inline: true,
            },
            { name: "Duration", value: `${appUser.duration}h`, inline: true },
            {
              name: "Expiry",
              value:
                appUser.expiry_date ?
                  new Date(appUser.expiry_date).toLocaleString()
                : "Lifetime",
              inline: true,
            },
            {
              name: "Created",
              value: new Date(appUser.created_at).toLocaleString(),
              inline: true,
            },
          );
        if (devices.length > 0)
          embed.addFields({
            name: "HWIDs",
            value: `\`${devices.join("`, `")}\``,
          });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "keyinfo": {
        const keyCode = options.getString("key");
        const key = await prisma.key.findUnique({
          where: { key_code: keyCode },
        });
        if (!key)
          return interaction.editReply({
            content: `❌ Key \`${keyCode}\` not found.`,
          });
        const devices =
          key.used_devices ? key.used_devices.split(",").filter(Boolean) : [];
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle(`🔑 Key: ${key.key_code}`)
          .addFields(
            { name: "ID", value: `${key.id}`, inline: true },
            { name: "Status", value: key.status, inline: true },
            { name: "Duration", value: `${key.duration}h`, inline: true },
            {
              name: "Devices",
              value: `${devices.length}/${key.max_devices}`,
              inline: true,
            },
            { name: "Note", value: key.note || "—", inline: true },
            {
              name: "Expiry",
              value:
                key.expiry_date ?
                  new Date(key.expiry_date).toLocaleString()
                : "N/A",
              inline: true,
            },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "licenseinfo": {
        const licKey = options.getString("license");
        const lic = await prisma.license.findUnique({
          where: { license_key: licKey },
        });
        if (!lic)
          return interaction.editReply({
            content: `❌ License \`${licKey}\` not found.`,
          });
        const devices =
          lic.used_devices ? lic.used_devices.split(",").filter(Boolean) : [];
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle(`📜 License: ${lic.license_key}`)
          .addFields(
            { name: "ID", value: `${lic.id}`, inline: true },
            { name: "Plan", value: lic.plan, inline: true },
            { name: "Product", value: lic.product, inline: true },
            { name: "Status", value: lic.status, inline: true },
            { name: "Days", value: `${lic.duration_days}`, inline: true },
            {
              name: "Devices",
              value: `${devices.length}/${lic.max_devices}`,
              inline: true,
            },
            {
              name: "Expiry",
              value:
                lic.expiry_date ?
                  new Date(lic.expiry_date).toLocaleString()
                : "N/A",
              inline: true,
            },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "reset": {
        const usrR = options.getString("username");
        const appUserR = await prisma.appUser.findUnique({
          where: { username: usrR },
        });
        if (!appUserR)
          return interaction.editReply({
            content: `❌ User \`${usrR}\` not found.`,
          });
        await prisma.appUser.update({
          where: { id: appUserR.id },
          data: { used_devices: "", last_hwid_reset: null },
        });
        await logAudit(
          "discord_reset_hwid",
          `Bot ${user.username} reset HWID for ${usrR}`,
          null,
        );
        await interaction.editReply({
          content: `✅ HWID for \`${usrR}\` reset.`,
        });
        break;
      }
      case "stats": {
        const totalKeys = await prisma.key.count(),
          activeKeys = await prisma.key.count({ where: { status: "active" } }),
          totalUsers = await prisma.appUser.count(),
          activeUsers = await prisma.appUser.count({
            where: { status: "active" },
          }),
          totalLicenses = await prisma.license.count(),
          activeLicenses = await prisma.license.count({
            where: { status: "active" },
          }),
          blacklisted = await prisma.blacklist.count(),
          totalPanel = await prisma.panelUser.count();
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle("📊 REGIX Statistics")
          .addFields(
            {
              name: "🔑 Keys",
              value: `${activeKeys}/${totalKeys} active`,
              inline: true,
            },
            {
              name: "👤 Users",
              value: `${activeUsers}/${totalUsers} active`,
              inline: true,
            },
            {
              name: "📜 Licenses",
              value: `${activeLicenses}/${totalLicenses} active`,
              inline: true,
            },
            { name: "⛔ Blacklisted", value: `${blacklisted}`, inline: true },
            { name: "👥 Panel", value: `${totalPanel}`, inline: true },
            { name: "🤖 Bot", value: "✅ Online", inline: true },
          )
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
      case "help": {
        const embed = new EmbedBuilder()
          .setColor(0x00f0ff)
          .setTitle("🤖 REGIX Bot Commands")
          .setDescription(
            "**Admin/Mod:**\n`/genkey` `/genuser` `/genlicense` `/blacklist` `/unblacklist` `/reset`\n\n**Everyone:**\n`/userinfo` `/keyinfo` `/licenseinfo` `/stats` `/help`",
          )
          .setFooter({ text: "REGIX Auth v3.0" });
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  } catch (err) {
    console.error("[DISCORD] Command error:", err);
    await interaction
      .editReply({ content: `❌ Error: ${err.message}` })
      .catch(() => {});
  }
}

async function handleMessage(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;
  const cmd = message.content.slice(1).trim().split(/ +/)[0].toLowerCase();
  if (cmd === "ping")
    await message.reply(`🏓 Pong! ${discordClient?.ws?.ping || 0}ms`);
}

startDiscordBot();

// ============================================================
// BOT HTTP API
// ============================================================
app.get("/api/bot", verifySecret, async (req, res) => {
  const { action } = req.query;
  try {
    if (action === "genkey") {
      const amount = Math.min(parseInt(req.query.amount) || 1, 100);
      const dur_val = parseInt(req.query.dur_val) || 1,
        dur_unit = req.query.dur_unit || "d",
        max_dev = Math.min(parseInt(req.query.max_dev) || 1, 10),
        note = req.query.note || "Web Store Auto";
      let hours = 24;
      if (dur_unit === "h") hours = dur_val;
      else if (dur_unit === "d") hours = dur_val * 24;
      else if (dur_unit === "w") hours = dur_val * 24 * 7;
      else if (dur_unit === "m") hours = dur_val * 24 * 30;
      else if (dur_unit === "l") hours = 876000;
      let keys = [];
      for (let i = 0; i < amount; i++) {
        const k = generateKey("REGIX");
        await prisma.key.create({
          data: { key_code: k, duration: hours, max_devices: max_dev, note },
        });
        keys.push(k);
      }
      await logAudit(
        "bot_genkey",
        `Generated ${amount} keys`,
        getClientIp(req),
      );
      return res.send(keys.join("\n"));
    }
    if (action === "genuser") {
      const { u, p } = req.query;
      const h = parseInt(req.query.hours) || 24,
        m = Math.min(parseInt(req.query.max_dev) || 1, 10);
      if (!u || !p) return res.status(400).send("Missing User or Pass");
      await prisma.appUser.create({
        data: { username: u, password: p, duration: h, max_devices: m },
      });
      await logAudit("bot_genuser", `Created user: ${u}`, getClientIp(req));
      return res.send("Success");
    }
    if (action === "genlicense") {
      const amount = Math.min(parseInt(req.query.amount) || 1, 50),
        days = parseInt(req.query.days) || 30,
        plan = req.query.plan || "basic",
        product = req.query.product || "REGIX-Auth",
        maxDev = Math.min(parseInt(req.query.max_dev) || 1, 10);
      let licenses = [];
      for (let i = 0; i < amount; i++) {
        const licKey = generateLicense("REGIX");
        const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await prisma.license.create({
          data: {
            license_key: licKey,
            product,
            plan,
            duration_days: days,
            max_devices: maxDev,
            expiry_date: expiry,
          },
        });
        licenses.push(licKey);
      }
      await logAudit(
        "bot_genlicense",
        `Generated ${amount} licenses`,
        getClientIp(req),
      );
      return res.send(licenses.join("\n"));
    }
    if (action === "blacklist") {
      const { hwid, reason } = req.query;
      if (!hwid) return res.status(400).send("Missing HWID");
      await prisma.blacklist.upsert({
        where: { hwid },
        update: { reason: reason || "Blacklisted by bot" },
        create: { hwid, reason: reason || "Blacklisted by bot" },
      });
      await logAudit(
        "bot_blacklist",
        `Blacklisted HWID: ${hwid}`,
        getClientIp(req),
      );
      return res.send("Blacklisted");
    }
    if (action === "unblacklist") {
      const { hwid } = req.query;
      if (!hwid) return res.status(400).send("Missing HWID");
      await prisma.blacklist.delete({ where: { hwid } }).catch(() => {});
      await logAudit(
        "bot_unblacklist",
        `Unblacklisted HWID: ${hwid}`,
        getClientIp(req),
      );
      return res.send("Unblacklisted");
    }
    if (action === "setstatus") {
      const { type, value, status } = req.query;
      if (!type || !value || !status)
        return res.status(400).send("Missing params");
      if (type === "key")
        await prisma.key.update({
          where: { key_code: value },
          data: { status },
        });
      else if (type === "user")
        await prisma.appUser.update({
          where: { username: value },
          data: { status },
        });
      else if (type === "license")
        await prisma.license.update({
          where: { license_key: value },
          data: { status },
        });
      else return res.status(400).send("Invalid type");
      await logAudit(
        "bot_setstatus",
        `${type} ${value} -> ${status}`,
        getClientIp(req),
      );
      return res.send("Status updated");
    }
    if (action === "delete") {
      const { type, value } = req.query;
      if (!type || !value) return res.status(400).send("Missing params");
      if (type === "key")
        await prisma.key.delete({ where: { key_code: value } }).catch(() => {});
      else if (type === "user")
        await prisma.appUser
          .delete({ where: { username: value } })
          .catch(() => {});
      else if (type === "license")
        await prisma.license
          .delete({ where: { license_key: value } })
          .catch(() => {});
      else return res.status(400).send("Invalid type");
      await logAudit(
        "bot_delete",
        `Deleted ${type}: ${value}`,
        getClientIp(req),
      );
      return res.send("Deleted");
    }
    if (action === "list") {
      const { type } = req.query;
      if (type === "keys")
        return res.json({
          keys: await prisma.key.findMany({
            take: 500,
            orderBy: { id: "desc" },
          }),
        });
      if (type === "users")
        return res.json({
          users: await prisma.appUser.findMany({
            take: 500,
            orderBy: { id: "desc" },
          }),
        });
      if (type === "licenses")
        return res.json({
          licenses: await prisma.license.findMany({
            take: 500,
            orderBy: { id: "desc" },
          }),
        });
      if (type === "blacklist")
        return res.json({
          list: await prisma.blacklist.findMany({ orderBy: { id: "desc" } }),
        });
      if (type === "apis")
        return res.json({
          apis: await prisma.userApi.findMany({ orderBy: { id: "desc" } }),
        });
      if (type === "logs")
        return res.json({
          logs: await prisma.auditLog.findMany({
            take: 100,
            orderBy: { id: "desc" },
          }),
        });
      return res.status(400).send("Unknown list type");
    }
    if (action === "reset_hwid") {
      const { username } = req.query;
      if (!username) return res.status(400).send("Missing username");
      const user = await prisma.appUser.findUnique({ where: { username } });
      if (!user) return res.status(404).send("User not found");
      await prisma.appUser.update({
        where: { id: user.id },
        data: { used_devices: "", last_hwid_reset: null },
      });
      await logAudit(
        "bot_reset_hwid",
        `Reset HWID for ${username}`,
        getClientIp(req),
      );
      return res.send("HWID reset successful");
    }
    if (action === "forgot_password") {
      const { username, newpass } = req.query;
      if (!username || !newpass) return res.status(400).send("Missing params");
      const user = await prisma.appUser.findUnique({ where: { username } });
      if (!user) return res.status(404).send("User not found");
      await prisma.appUser.update({
        where: { id: user.id },
        data: { password: newpass },
      });
      await logAudit(
        "bot_forgot_password",
        `Password reset for ${username}`,
        getClientIp(req),
      );
      return res.send("Password updated");
    }
    return res.status(400).send("Unknown Bot Action");
  } catch (err) {
    return res.status(500).send("Database Error: " + err.message);
  }
});

// ============================================================
// DASHBOARD API
// ============================================================
app.get("/api/dashboard", verifySecret, async (req, res) => {
  const { action } = req.query;
  try {
    if (action === "stats") {
      const [
        total_keys,
        active_keys,
        total_users,
        active_users,
        total_licenses,
        active_licenses,
        total_apis,
        blacklist,
      ] = await Promise.all([
        prisma.key.count(),
        prisma.key.count({ where: { status: "active" } }),
        prisma.appUser.count(),
        prisma.appUser.count({ where: { status: "active" } }),
        prisma.license.count(),
        prisma.license.count({ where: { status: "active" } }),
        prisma.userApi.count(),
        prisma.blacklist.count(),
      ]);
      const [recent_keys, recent_licenses] = await Promise.all([
        prisma.key.findMany({ take: 10, orderBy: { id: "desc" } }),
        prisma.license.findMany({ take: 10, orderBy: { id: "desc" } }),
      ]);
      return res.json({
        total_keys,
        active_keys,
        total_users,
        active_users,
        total_licenses,
        active_licenses,
        total_apis,
        blacklist,
        notification: "REGIX Security Service Online",
        recent_keys,
        recent_licenses,
      });
    }
    if (action === "list_keys")
      return res.json({
        keys: await prisma.key.findMany({ take: 500, orderBy: { id: "desc" } }),
      });
    if (action === "list_users")
      return res.json({
        users: await prisma.appUser.findMany({
          take: 500,
          orderBy: { id: "desc" },
        }),
      });
    if (action === "list_licenses")
      return res.json({
        licenses: await prisma.license.findMany({
          take: 500,
          orderBy: { id: "desc" },
        }),
      });
    if (action === "list_apis")
      return res.json({
        apis: await prisma.userApi.findMany({ orderBy: { id: "desc" } }),
      });
    if (action === "list_blacklist")
      return res.json({
        list: await prisma.blacklist.findMany({ orderBy: { id: "desc" } }),
      });
    if (action === "list_logs")
      return res.json({
        logs: await prisma.auditLog.findMany({
          take: 100,
          orderBy: { id: "desc" },
        }),
      });
    return res.status(400).json({ error: "Unknown Action" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CLIENT AUTH API
// ============================================================
app.post("/api/auth/login", async (req, res) => {
  const { hwid, key, user, pass } = req.body;
  const ip = getClientIp(req);
  if (!hwid) return res.json({ valid: false, message: "HWID is required!" });
  try {
    const isBlacklisted = await prisma.blacklist.findUnique({
      where: { hwid },
    });
    if (isBlacklisted) {
      await logAudit("auth_blocked", `Blacklisted HWID: ${hwid}`, ip);
      return res.json({ valid: false, message: "Device is blacklisted!" });
    }
    let targetData = null,
      targetTable = "";
    if (key && req.body.type !== "license") {
      targetData = await prisma.key.findUnique({ where: { key_code: key } });
      targetTable = "key";
      if (!targetData)
        return res.json({ valid: false, message: "Key does not exist!" });
      // If key is redeemed, check the user's status
      if (targetData.status === "redeemed" && targetData.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: targetData.redeemed_by },
        });
        if (userData) {
          targetData = userData;
          targetTable = "appUser";
        }
      }
    } else if (user && pass) {
      targetData = await prisma.appUser.findUnique({
        where: { username: user },
      });
      targetTable = "appUser";
      if (!targetData || targetData.password !== pass) {
        await logAudit("auth_failed", `Failed login for user: ${user}`, ip);
        return res.json({
          valid: false,
          message: "Invalid username or password!",
        });
      }
    } else if (key && req.body.type === "license") {
      targetData = await prisma.license.findUnique({
        where: { license_key: key },
      });
      targetTable = "license";
      if (!targetData)
        return res.json({
          valid: false,
          message: "License key does not exist!",
        });
    } else
      return res.json({
        valid: false,
        message: "Missing authentication info!",
      });
    if (targetData.status === "banned")
      return res.json({
        valid: false,
        message: "This account/key has been BANNED!",
      });
    if (targetData.status === "frozen")
      return res.json({ valid: false, message: "This account/key is FROZEN!" });
    if (targetData.status === "expired")
      return res.json({
        valid: false,
        message: "This account/key has EXPIRED!",
      });
    if (
      targetData.expiry_date &&
      new Date(targetData.expiry_date) < new Date()
    ) {
      await prisma[
        targetTable === "key" ? "key"
        : targetTable === "appUser" ? "appUser"
        : "license"
      ].update({ where: { id: targetData.id }, data: { status: "expired" } });
      return res.json({ valid: false, message: "Subscription has ended!" });
    }
    let currentDevices =
      targetData.used_devices ?
        targetData.used_devices.split(",").filter(Boolean)
      : [];
    if (currentDevices.includes(hwid)) {
      const expTimestamp =
        targetData.expiry_date ?
          Math.floor(new Date(targetData.expiry_date).getTime() / 1000)
        : 4102444799;
      if (targetTable === "key")
        await prisma.key.update({
          where: { id: targetData.id },
          data: { last_used_at: new Date(), ip_address: ip },
        });
      else if (targetTable === "appUser")
        await prisma.appUser.update({
          where: { id: targetData.id },
          data: { last_login: new Date(), ip_address: ip },
        });
      else if (targetTable === "license")
        await prisma.license.update({
          where: { id: targetData.id },
          data: { last_used_at: new Date(), ip_address: ip },
        });
      await logAudit(
        "auth_success",
        `${targetTable} login: ${key || user}`,
        ip,
        targetData.owner_id,
      );
      return res.json({
        valid: true,
        message: "Login successful!",
        expiry: expTimestamp,
        plan: targetTable === "license" ? targetData.plan : undefined,
        product: targetTable === "license" ? targetData.product : undefined,
      });
    }
    if (currentDevices.length < targetData.max_devices) {
      currentDevices.push(hwid);
      let updatePayload = {
        used_devices: currentDevices.join(","),
        last_used_at: new Date(),
        ip_address: ip,
      };
      if (!targetData.used_devices) {
        let hours = targetData.duration || 720;
        if (targetTable === "license") {
          const days = targetData.duration_days || 30;
          updatePayload.expiry_date = new Date(
            Date.now() + days * 24 * 60 * 60 * 1000,
          );
        } else
          updatePayload.expiry_date =
            hours > 800000 ?
              new Date("2099-12-31T23:59:59")
            : new Date(Date.now() + hours * 60 * 60 * 1000);
      }
      if (targetTable === "key")
        await prisma.key.update({
          where: { id: targetData.id },
          data: updatePayload,
        });
      else if (targetTable === "appUser")
        await prisma.appUser.update({
          where: { id: targetData.id },
          data: {
            used_devices: updatePayload.used_devices,
            ip_address: updatePayload.ip_address,
            expiry_date: updatePayload.expiry_date,
            last_login: new Date(),
          },
        });
      else if (targetTable === "license")
        await prisma.license.update({
          where: { id: targetData.id },
          data: updatePayload,
        });
      const finalExpiry =
        updatePayload.expiry_date ?
          Math.floor(updatePayload.expiry_date.getTime() / 1000)
        : 4102444799;
      await logAudit(
        "auth_device_activated",
        `New device activated for ${key || user}`,
        ip,
      );
      return res.json({
        valid: true,
        message: "Device activated successfully!",
        expiry: finalExpiry,
        plan: targetTable === "license" ? targetData.plan : undefined,
      });
    } else
      return res.json({
        valid: false,
        message: "Device limit exceeded! Maximum: " + targetData.max_devices,
      });
  } catch (err) {
    return res.status(500).json({ valid: false, message: "System error" });
  }
});

app.post("/api/auth/verify", async (req, res) => {
  const { hwid, key, user, pass } = req.body;
  if (!hwid) return res.json({ valid: false, message: "HWID required" });
  try {
    if (await prisma.blacklist.findUnique({ where: { hwid } }))
      return res.json({ valid: false, message: "Blacklisted" });
    let target = null;
    if (key) {
      target = await prisma.key.findUnique({ where: { key_code: key } });
      if (target && target.status === "redeemed" && target.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (userData) target = userData;
      }
    } else if (user && pass) {
      target = await prisma.appUser.findUnique({ where: { username: user } });
      if (target && target.password !== pass) target = null;
    }
    if (!target)
      return res.json({ valid: false, message: "Invalid credentials" });
    if (target.status !== "active")
      return res.json({ valid: false, message: "Not active" });
    if (target.expiry_date && new Date(target.expiry_date) < new Date())
      return res.json({ valid: false, message: "Expired" });
    const devices =
      target.used_devices ? target.used_devices.split(",").filter(Boolean) : [];
    if (!devices.includes(hwid))
      return res.json({ valid: false, message: "HWID not registered" });
    return res.json({ valid: true, message: "Verified" });
  } catch (err) {
    return res.status(500).json({ valid: false, message: err.message });
  }
});

app.post("/api/auth/check", async (req, res) => {
  const { key, user, pass, type } = req.body;
  try {
    let target = null;
    if (type === "license")
      target = await prisma.license.findUnique({ where: { license_key: key } });
    else if (key) {
      target = await prisma.key.findUnique({ where: { key_code: key } });
      if (target && target.status === "redeemed" && target.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (userData) target = userData;
      }
    } else if (user && pass) {
      target = await prisma.appUser.findUnique({ where: { username: user } });
      if (target && target.password !== pass) target = null;
    }
    if (!target) return res.json({ valid: false, message: "Not found" });
    const expired =
      target.expiry_date && new Date(target.expiry_date) < new Date();
    return res.json({
      valid: target.status === "active" && !expired,
      status: target.status,
      expired,
      expiry: target.expiry_date,
      max_devices: target.max_devices,
      used_devices:
        target.used_devices ?
          target.used_devices.split(",").filter(Boolean).length
        : 0,
      plan: target.plan,
      product: target.product,
    });
  } catch (err) {
    return res.status(500).json({ valid: false, message: err.message });
  }
});

app.post("/api/auth/register-device", async (req, res) => {
  const { hwid, key, user, pass } = req.body;
  if (!hwid) return res.json({ success: false, message: "HWID required" });
  try {
    let target = null,
      table = "";
    if (key) {
      target = await prisma.key.findUnique({ where: { key_code: key } });
      table = "key";
      if (target && target.status === "redeemed" && target.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (userData) {
          target = userData;
          table = "appUser";
        }
      }
    } else if (user && pass) {
      target = await prisma.appUser.findUnique({ where: { username: user } });
      if (target && target.password !== pass) target = null;
      table = "appUser";
    }
    if (!target) return res.json({ success: false, message: "Invalid" });
    if (target.status !== "active")
      return res.json({ success: false, message: "Not active" });
    let devices =
      target.used_devices ? target.used_devices.split(",").filter(Boolean) : [];
    if (devices.includes(hwid))
      return res.json({ success: true, message: "Already registered" });
    if (devices.length >= target.max_devices)
      return res.json({ success: false, message: "Device limit reached" });
    devices.push(hwid);
    if (table === "key")
      await prisma.key.update({
        where: { id: target.id },
        data: { used_devices: devices.join(",") },
      });
    else
      await prisma.appUser.update({
        where: { id: target.id },
        data: { used_devices: devices.join(",") },
      });
    return res.json({ success: true, message: "Device registered" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/auth/remove-device", async (req, res) => {
  const { hwid, key, user, pass } = req.body;
  if (!hwid) return res.json({ success: false, message: "HWID required" });
  try {
    let target = null,
      table = "";
    if (key) {
      target = await prisma.key.findUnique({ where: { key_code: key } });
      table = "key";
      if (target && target.status === "redeemed" && target.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (userData) {
          target = userData;
          table = "appUser";
        }
      }
    } else if (user && pass) {
      target = await prisma.appUser.findUnique({ where: { username: user } });
      if (target && target.password !== pass) target = null;
      table = "appUser";
    }
    if (!target) return res.json({ success: false, message: "Invalid" });
    let devices =
      target.used_devices ? target.used_devices.split(",").filter(Boolean) : [];
    devices = devices.filter((d) => d !== hwid);
    if (table === "key")
      await prisma.key.update({
        where: { id: target.id },
        data: { used_devices: devices.join(",") },
      });
    else
      await prisma.appUser.update({
        where: { id: target.id },
        data: { used_devices: devices.join(",") },
      });
    return res.json({ success: true, message: "Device removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/auth/expiry", async (req, res) => {
  const { key, user, pass } = req.body;
  try {
    let target = null;
    if (key) {
      target = await prisma.key.findUnique({ where: { key_code: key } });
      if (target && target.status === "redeemed" && target.redeemed_by) {
        const userData = await prisma.appUser.findUnique({
          where: { id: target.redeemed_by },
        });
        if (userData) target = userData;
      }
    } else if (user && pass) {
      target = await prisma.appUser.findUnique({ where: { username: user } });
      if (target && target.password !== pass) target = null;
    }
    if (!target) return res.json({ found: false });
    const exp =
      target.expiry_date ?
        Math.floor(new Date(target.expiry_date).getTime() / 1000)
      : 4102444799;
    return res.json({ found: true, expiry: exp, status: target.status });
  } catch (err) {
    return res.status(500).json({ found: false, message: err.message });
  }
});

// ============================================================
// LICENSE API
// ============================================================
app.post("/api/license/activate", async (req, res) => {
  const { license_key, hwid } = req.body;
  const ip = getClientIp(req);
  if (!license_key || !hwid)
    return res.json({
      success: false,
      message: "License key and HWID required",
    });
  try {
    const lic = await prisma.license.findUnique({ where: { license_key } });
    if (!lic) return res.json({ success: false, message: "License not found" });
    if (lic.status !== "active")
      return res.json({ success: false, message: "License is " + lic.status });
    if (lic.expiry_date && new Date(lic.expiry_date) < new Date()) {
      await prisma.license.update({
        where: { id: lic.id },
        data: { status: "expired" },
      });
      return res.json({ success: false, message: "License expired" });
    }
    let devices =
      lic.used_devices ? lic.used_devices.split(",").filter(Boolean) : [];
    if (devices.includes(hwid))
      return res.json({
        success: true,
        message: "Already activated",
        expiry: Math.floor(new Date(lic.expiry_date).getTime() / 1000),
        plan: lic.plan,
      });
    if (devices.length >= lic.max_devices)
      return res.json({ success: false, message: "Device limit reached" });
    devices.push(hwid);
    await prisma.license.update({
      where: { id: lic.id },
      data: { used_devices: devices.join(","), hwid, last_used_at: new Date() },
    });
    await logAudit(
      "license_activate",
      `License ${license_key} activated on ${hwid}`,
      ip,
    );
    return res.json({
      success: true,
      message: "License activated",
      expiry: Math.floor(new Date(lic.expiry_date).getTime() / 1000),
      plan: lic.plan,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/license/validate", async (req, res) => {
  const { license_key, hwid } = req.body;
  try {
    const lic = await prisma.license.findUnique({ where: { license_key } });
    if (!lic) return res.json({ valid: false, message: "Not found" });
    const expired = lic.expiry_date && new Date(lic.expiry_date) < new Date();
    if (expired)
      await prisma.license.update({
        where: { id: lic.id },
        data: { status: "expired" },
      });
    const devices =
      lic.used_devices ? lic.used_devices.split(",").filter(Boolean) : [];
    const hwidMatch = hwid ? devices.includes(hwid) : true;
    return res.json({
      valid: lic.status === "active" && !expired && hwidMatch,
      status: lic.status,
      expired,
      plan: lic.plan,
      product: lic.product,
      expiry: lic.expiry_date,
      devices: devices.length,
      max_devices: lic.max_devices,
    });
  } catch (err) {
    return res.status(500).json({ valid: false, message: err.message });
  }
});

// ============================================================
// ADMIN API
// ============================================================
app.post("/api/admin/create-user", verifySecret, async (req, res) => {
  const { username, password, email, duration, max_devices } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const existing = await prisma.appUser.findUnique({ where: { username } });
    if (existing)
      return res.status(400).json({ error: "Username already exists" });
    const user = await prisma.appUser.create({
      data: {
        username,
        password,
        email: email || null,
        duration: Math.min(parseInt(duration) || 720, 876000),
        max_devices: Math.min(parseInt(max_devices) || 1, 10),
      },
    });
    await logAudit(
      "admin_create_user",
      `Created user: ${username}`,
      getClientIp(req),
    );
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/create-key", verifySecret, async (req, res) => {
  const { duration, max_devices, note } = req.body;
  try {
    const key_code = generateKey("REGIX");
    const key = await prisma.key.create({
      data: {
        key_code,
        duration: Math.min(parseInt(duration) || 24, 876000),
        max_devices: Math.min(parseInt(max_devices) || 1, 10),
        note: note || "",
      },
    });
    await logAudit(
      "admin_create_key",
      `Created key: ${key_code}`,
      getClientIp(req),
    );
    return res.json({ success: true, key });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/create-license", verifySecret, async (req, res) => {
  const { plan, product, duration_days, max_devices } = req.body;
  try {
    const license_key = generateLicense("REGIX");
    const expiry = new Date(
      Date.now() +
        Math.min(parseInt(duration_days) || 30, 3650) * 24 * 60 * 60 * 1000,
    );
    const lic = await prisma.license.create({
      data: {
        license_key,
        plan: plan || "basic",
        product: product || "REGIX-Auth",
        duration_days: Math.min(parseInt(duration_days) || 30, 3650),
        max_devices: Math.min(parseInt(max_devices) || 1, 10),
        expiry_date: expiry,
      },
    });
    await logAudit(
      "admin_create_license",
      `Created license: ${license_key}`,
      getClientIp(req),
    );
    return res.json({ success: true, license: lic });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/update-status", verifySecret, async (req, res) => {
  const { type, id, status } = req.body;
  if (!["active", "banned", "frozen", "expired"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  try {
    let result;
    if (type === "key")
      result = await prisma.key.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    else if (type === "user")
      result = await prisma.appUser.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    else if (type === "license")
      result = await prisma.license.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    else return res.status(400).json({ error: "Invalid type" });
    await logAudit(
      "admin_update_status",
      `${type} ${id} -> ${status}`,
      getClientIp(req),
    );
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/delete", verifySecret, async (req, res) => {
  const { type, id } = req.body;
  try {
    const numId = parseInt(id);
    if (type === "key") await prisma.key.delete({ where: { id: numId } });
    else if (type === "user")
      await prisma.appUser.delete({ where: { id: numId } });
    else if (type === "license")
      await prisma.license.delete({ where: { id: numId } });
    else if (type === "blacklist")
      await prisma.blacklist.delete({ where: { id: numId } });
    else return res.status(400).json({ error: "Invalid type" });
    await logAudit("admin_delete", `Deleted ${type} ${id}`, getClientIp(req));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/blacklist", verifySecret, async (req, res) => {
  const { hwid, reason } = req.body;
  if (!hwid) return res.status(400).json({ error: "HWID required" });
  try {
    await prisma.blacklist.upsert({
      where: { hwid },
      update: { reason: reason || "" },
      create: { hwid, reason: reason || "" },
    });
    await logAudit("admin_blacklist", `Blacklisted ${hwid}`, getClientIp(req));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PHASE 3: ADMIN OVERRIDE ENDPOINTS
// ============================================================

// Admin: Reset user SID (bypasses 24h cooldown)
app.post("/api/admin/reset-sid", verifySecret, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });
  try {
    const user = await prisma.appUser.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    await prisma.appUser.update({
      where: { id: user.id },
      data: { used_devices: "", last_hwid_reset: null },
    });
    await logAudit(
      "admin_reset_sid",
      `Admin reset SID for user ${user.username} (ID: ${user.id})`,
      getClientIp(req),
    );
    return res.json({
      success: true,
      message: `SID reset for ${user.username}`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Bulk key generation
app.post("/api/admin/bulk-gen-keys", verifySecret, async (req, res) => {
  const { amount, duration, max_devices, note, prefix } = req.body;
  const count = Math.min(parseInt(amount) || 1, 100);
  const dur = Math.min(parseInt(duration) || 720, 876000);
  const maxDev = Math.min(parseInt(max_devices) || 1, 10);
  const keyPrefix = prefix || "REGIX";
  try {
    const keys = [];
    for (let i = 0; i < count; i++) {
      const keyCode = generateKey(keyPrefix);
      await prisma.key.create({
        data: {
          key_code: keyCode,
          duration: dur,
          max_devices: maxDev,
          note: note || "Bulk generated",
        },
      });
      keys.push(keyCode);
    }
    await logAudit(
      "admin_bulk_gen_keys",
      `Admin generated ${count} keys`,
      getClientIp(req),
    );
    return res.json({ success: true, keys, count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TICKET SYSTEM
// ============================================================
app.post("/api/tickets", requireAuth, async (req, res) => {
  const { title, category, priority, message } = req.body;
  const userId = req.session?.userId || req.user?.id;
  if (!title) return res.status(400).json({ error: "Title required" });
  try {
    const ticket = await prisma.ticket.create({
      data: {
        title: sanitize(title),
        category: category || "general",
        priority: priority || "medium",
        createdBy: userId,
      },
    });
    if (message)
      await prisma.ticketReply.create({
        data: {
          ticketId: ticket.id,
          userId,
          message: sanitize(message),
          isStaff: false,
        },
      });
    await logAudit(
      "ticket_create",
      `Ticket #${ticket.id}: ${title}`,
      getClientIp(req),
      userId,
    );
    return res.json({ success: true, ticket });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/tickets", requireAuth, async (req, res) => {
  const userId = req.session?.userId || req.user?.id;
  const user = await prisma.panelUser.findUnique({ where: { id: userId } });
  const isStaff = ["owner", "developer", "moderator", "supporter"].includes(
    user.role,
  );
  const where = isStaff ? {} : { createdBy: userId };
  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      creator: { select: { id: true, username: true, role: true } },
      assignee: { select: { id: true, username: true } },
      replies: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return res.json({ tickets });
});

app.get("/api/tickets/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  const userId = req.session?.userId || req.user?.id;
  const user = await prisma.panelUser.findUnique({ where: { id: userId } });
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true, role: true } },
      assignee: { select: { id: true, username: true } },
      replies: {
        include: { user: { select: { id: true, username: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  const isStaff = ["owner", "developer", "moderator", "supporter"].includes(
    user.role,
  );
  if (ticket.createdBy !== userId && !isStaff)
    return res.status(403).json({ error: "Access denied" });
  return res.json({ ticket });
});

app.post("/api/tickets/:id/reply", requireAuth, async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  const userId = req.session?.userId || req.user?.id;
  const user = await prisma.panelUser.findUnique({ where: { id: userId } });
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  if (ticket.status === "resolved" || ticket.status === "closed")
    return res.status(400).json({ error: "Ticket is closed" });
  const isStaff = ["owner", "developer", "moderator", "supporter"].includes(
    user.role,
  );
  if (ticket.createdBy !== userId && !isStaff)
    return res.status(403).json({ error: "Access denied" });
  const reply = await prisma.ticketReply.create({
    data: { ticketId, userId, message: sanitize(message), isStaff },
  });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "in_progress" },
  });
  return res.json({ success: true, reply });
});

app.patch(
  "/api/tickets/:id/status",
  requireAuth,
  requireRole("owner", "developer", "moderator", "supporter"),
  async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { status, assignedTo } = req.body;
    try {
      const data = {};
      if (status) data.status = status;
      if (assignedTo) data.assignedTo = assignedTo;
      const ticket = await prisma.ticket.update({ where: { id }, data });
      return res.json({ success: true, ticket });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

// ============================================================
// HWID RESET
// ============================================================
app.post("/api/hwid/reset-request", async (req, res) => {
  const { username, hwid, reason } = req.body;
  if (!username || !hwid)
    return res.json({ success: false, message: "Username and HWID required" });
  try {
    const user = await prisma.appUser.findUnique({ where: { username } });
    if (!user) return res.json({ success: false, message: "User not found" });
    const devices =
      user.used_devices ? user.used_devices.split(",").filter(Boolean) : [];
    if (!devices.includes(hwid) && devices.length > 0)
      return res.json({
        success: false,
        message: "HWID not registered to this user",
      });
    const reset = await prisma.hwidReset.create({
      data: { userId: user.id, oldHwid: hwid, reason: reason || "" },
    });
    const newDevices = devices.filter((d) => d !== hwid);
    await prisma.appUser.update({
      where: { id: user.id },
      data: { used_devices: newDevices.join(","), last_hwid_reset: new Date() },
    });
    await prisma.hwidReset.update({
      where: { id: reset.id },
      data: { status: "approved" },
    });
    await logAudit(
      "hwid_reset",
      `HWID reset for ${username}: ${hwid}`,
      getClientIp(req),
    );
    return res.json({
      success: true,
      message: "HWID has been reset. You can now log in from your new device.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/hwid/resets", verifySecret, async (req, res) => {
  const resets = await prisma.hwidReset.findMany({
    include: { user: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ resets });
});

app.post("/api/auth/forgot-password", verifySecret, async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword)
    return res.json({
      success: false,
      message: "Username and new password required",
    });
  try {
    const user = await prisma.appUser.findUnique({ where: { username } });
    if (!user) return res.json({ success: false, message: "User not found" });
    await prisma.appUser.update({
      where: { id: user.id },
      data: { password: newPassword },
    });
    await logAudit(
      "forgot_password",
      `Password reset for ${username}`,
      getClientIp(req),
    );
    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// USAGE TRACKING
// ============================================================
app.all("/api/usage", verifySecret, async (req, res) => {
  try {
    const stats = await prisma.apiUsage.groupBy({
      by: ["endpoint"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    return res.json({ stats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SEED ADMIN
// ============================================================
async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "owner";
  const password = process.env.ADMIN_PASSWORD || "RegixAdmin123!";
  const email = process.env.ADMIN_EMAIL || "admin@regix-auth.com";
  const existing = await prisma.panelUser.findUnique({ where: { username } });
  if (!existing) {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.panelUser.create({
      data: { username, password: hashed, email, role: "owner" },
    });
    console.log(`[SEED] Default admin created: ${username} / ${password}`);
  }
}

// ============================================================
// START
// ============================================================
async function main() {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`[REGIX ENGINE]: http://localhost:${PORT}`);
    console.log(`[REGIX LOGIN]: http://localhost:${PORT}/login`);
    console.log(`[REGIX DOCS]: http://localhost:${PORT}/docs`);
    console.log(`[REGIX REGISTER]: http://localhost:${PORT}/register`);
  });
}

main().catch(console.error);
