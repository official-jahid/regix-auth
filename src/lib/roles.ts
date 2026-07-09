// ============================================================
// ROLE PERMISSION SYSTEM
// ============================================================
// Hierarchical role system with permission inheritance.

export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  DISTRIBUTOR: "DISTRIBUTOR",
  RESELLER: "RESELLER",
  USER: "USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 80,
  MODERATOR: 60,
  DISTRIBUTOR: 40,
  RESELLER: 20,
  USER: 0,
};

/**
 * Check if a user has at least the specified role level
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Check if a user is an admin or above
 */
export function isAdminOrAbove(role: string): boolean {
  return hasRole(role, ROLES.ADMIN);
}

/**
 * Check if a user is a moderator or above
 */
export function isModOrAbove(role: string): boolean {
  return hasRole(role, ROLES.MODERATOR);
}

/**
 * Check if a user is a distributor or above
 */
export function isDistributorOrAbove(role: string): boolean {
  return hasRole(role, ROLES.DISTRIBUTOR);
}

/**
 * Check if a user is a reseller or above
 */
export function isResellerOrAbove(role: string): boolean {
  return hasRole(role, ROLES.RESELLER);
}

/**
 * Get all roles that a user can manage (lower than their own)
 */
export function getManageableRoles(userRole: string): Role[] {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  return (Object.keys(ROLES) as Role[]).filter(
    (role) => ROLE_HIERARCHY[role] < userLevel,
  );
}

/**
 * Check if a user can manage another user based on roles
 */
export function canManageUser(actorRole: string, targetRole: string): boolean {
  return ROLE_HIERARCHY[actorRole as Role] > ROLE_HIERARCHY[targetRole as Role];
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string): string {
  const names: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    MODERATOR: "Moderator",
    DISTRIBUTOR: "Distributor",
    RESELLER: "Reseller",
    USER: "User",
  };
  return names[role] || role;
}

/**
 * Get color for a role (for UI badges)
 */
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    OWNER: "text-red-500 border-red-500",
    ADMIN: "text-orange-500 border-orange-500",
    MODERATOR: "text-blue-500 border-blue-500",
    DISTRIBUTOR: "text-purple-500 border-purple-500",
    RESELLER: "text-green-500 border-green-500",
    USER: "text-gray-500 border-gray-500",
  };
  return colors[role] || "text-gray-500 border-gray-500";
}
