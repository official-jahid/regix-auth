import { ChatInputCommandInteraction, GuildMember } from "discord.js";

const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || "";
const MOD_ROLE_ID = process.env.DISCORD_MOD_ROLE_ID || "";

export function isAdmin(member: GuildMember | null): boolean {
  if (!member) return false;
  if (!ADMIN_ROLE_ID) return member.permissions.has("Administrator");
  return member.roles.cache.has(ADMIN_ROLE_ID);
}

export function isMod(member: GuildMember | null): boolean {
  if (!member) return false;
  if (isAdmin(member)) return true;
  if (!MOD_ROLE_ID) return false;
  return member.roles.cache.has(MOD_ROLE_ID);
}

export function isAdminOrMod(member: GuildMember | null): boolean {
  return isAdmin(member) || isMod(member);
}

export async function requireAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const member = interaction.member as GuildMember | null;
  if (!isAdmin(member)) {
    await interaction.reply({
      content: "❌ You need the **Admin** role to use this command.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}

export async function requireAdminOrMod(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const member = interaction.member as GuildMember | null;
  if (!isAdminOrMod(member)) {
    await interaction.reply({
      content: "❌ You need the **Admin** or **Mod** role to use this command.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}
