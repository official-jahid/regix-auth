// ============================================================
// BRUTE FORCE PROTECTION
// ============================================================
// Tracks failed login attempts per IP and per user
// with exponential backoff

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const loginAttempts = new Map<string, AttemptRecord>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    // Remove entries older than 1 hour
    if (now - record.lastAttempt > 3_600_000) {
      loginAttempts.delete(key);
    }
  }
}, 300_000);

function getBlockDuration(attemptCount: number): number {
  // Exponential backoff: 30s, 2min, 5min, 15min, 1hr, 2hr
  const durations = [30_000, 120_000, 300_000, 900_000, 3_600_000, 7_200_000];
  const index = Math.min(attemptCount - 1, durations.length - 1);
  return durations[Math.max(0, index)];
}

export function checkBruteForce(identifier: string): {
  blocked: boolean;
  remainingTime: number;
  attemptCount: number;
} {
  const record = loginAttempts.get(identifier);
  const now = Date.now();

  if (!record) {
    return { blocked: false, remainingTime: 0, attemptCount: 0 };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      blocked: true,
      remainingTime: record.blockedUntil - now,
      attemptCount: record.count,
    };
  }

  // Check if block expired - allow through but keep count
  if (record.blockedUntil && record.blockedUntil <= now) {
    // Allow through, but increment for next block
    return { blocked: false, remainingTime: 0, attemptCount: record.count };
  }

  return { blocked: false, remainingTime: 0, attemptCount: record.count };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.lastAttempt > 3_600_000) {
    // First attempt or record expired - start fresh
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null,
    });
    return;
  }

  record.count += 1;
  record.lastAttempt = now;

  // Block if too many attempts (3+ for strict, 5+ for normal)
  if (record.count >= 5) {
    record.blockedUntil = now + getBlockDuration(record.count);
  }
}

export function recordSuccessfulAttempt(identifier: string): void {
  // Clear failed attempts on successful login
  loginAttempts.delete(identifier);
}

export function isLoginBlocked(identifier: string): boolean {
  const record = loginAttempts.get(identifier);
  if (!record) return false;
  if (record.blockedUntil && record.blockedUntil > Date.now()) return true;
  return false;
}

export function getRemainingBlockTime(identifier: string): number {
  const record = loginAttempts.get(identifier);
  if (!record?.blockedUntil) return 0;
  const remaining = record.blockedUntil - Date.now();
  return Math.max(0, remaining);
}
