import { GuildMember } from "discord.js";
import prisma from "../../lib/database/dbClient";
import { serverEnv } from "../../lib/env/serverEnv";

export const SUPER_ADMIN_IDS = ["1076183559796183242", "1258090732263182386"];

/**
 * Returns the list of super admin IDs from env plus hardcoded ones.
 */
function getSuperAdminIds(): string[] {
  const env = serverEnv.SUPER_ADMIN_IDS;
  if (env) {
    const envIds = env
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return [...new Set([...SUPER_ADMIN_IDS, ...envIds])];
  }
  return SUPER_ADMIN_IDS;
}

export function isSuperAdmin(member: GuildMember): boolean {
  return getSuperAdminIds().includes(member.id);
}

/**
 * Check if the user is a super admin (bypasses all checks).
 */
export async function isSuperAdminById(userId: string): Promise<boolean> {
  return getSuperAdminIds().includes(userId);
}

/**
 * Check if the user is whitelisted in the database.
 */
async function isWhitelisted(discordId: string): Promise<boolean> {
  if (getSuperAdminIds().includes(discordId)) return true;
  const entry = await prisma.botWhitelist.findUnique({
    where: { discordId },
  });
  return !!entry;
}

/**
 * Check if a member has admin access (super admins + admin role + whitelisted).
 */
export async function isAdmin(member: GuildMember): Promise<boolean> {
  if (isSuperAdmin(member)) return true;

  // Check admin role from env
  const adminRoleId = serverEnv.DISCORD_ADMIN_ROLE_ID;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;

  // Check if whitelisted (whitelisted users get admin access)
  const whitelisted = await isWhitelisted(member.id);
  if (whitelisted) return true;

  return member.permissions.has("Administrator");
}

/**
 * Check if a member has mod access (super admins + admin + mod role + whitelisted).
 */
export async function isMod(member: GuildMember): Promise<boolean> {
  if (await isAdmin(member)) return true;

  const modRoleId = serverEnv.DISCORD_MOD_ROLE_ID;
  if (modRoleId && member.roles.cache.has(modRoleId)) return true;

  // Whitelisted users also get mod access
  const whitelisted = await isWhitelisted(member.id);
  if (whitelisted) return true;

  return member.permissions.has("ModerateMembers");
}

/**
 * Check if a member has basic bot access (any whitelisted user).
 * All users can use basic commands like /help, /stats
 * Admin/mod commands require admin/mod permissions.
 */
export async function canUseBasicCommands(
  member: GuildMember,
): Promise<boolean> {
  // Super admins always can
  if (getSuperAdminIds().includes(member.id)) return true;

  // Whitelisted users can use basic commands
  const whitelisted = await isWhitelisted(member.id);
  if (whitelisted) return true;

  // Users with admin role can use basic commands
  const adminRoleId = serverEnv.DISCORD_ADMIN_ROLE_ID;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;

  // Users with mod role can use basic commands
  const modRoleId = serverEnv.DISCORD_MOD_ROLE_ID;
  if (modRoleId && member.roles.cache.has(modRoleId)) return true;

  return false;
}
