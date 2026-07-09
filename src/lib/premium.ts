export interface PremiumStatus {
  isValid: boolean;
  reason: "active" | "expired" | "missing" | "inactive";
  expiresAt: Date | null;
}

interface PremiumLike {
  isRedeemed: boolean;
  isActive: boolean;
  expiresAt: Date | null;
  isLifetime: boolean;
}

export function getPremiumStatus(premium: PremiumLike | null): PremiumStatus {
  if (!premium) {
    return { isValid: false, reason: "missing", expiresAt: null };
  }

  if (!premium.isActive) {
    return { isValid: false, reason: "inactive", expiresAt: premium.expiresAt };
  }

  if (!premium.isRedeemed) {
    return { isValid: false, reason: "missing", expiresAt: premium.expiresAt };
  }

  if (premium.isLifetime) {
    return { isValid: true, reason: "active", expiresAt: null };
  }

  if (!premium.expiresAt) {
    return { isValid: false, reason: "expired", expiresAt: null };
  }

  return premium.expiresAt.getTime() > Date.now() ?
      { isValid: true, reason: "active", expiresAt: premium.expiresAt }
    : { isValid: false, reason: "expired", expiresAt: premium.expiresAt };
}
