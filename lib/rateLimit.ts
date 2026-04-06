/**
 * In-memory rate limiter. Resets on cold start (acceptable for MVP).
 * Two tiers: per-IP (15 sessions/day) and global (500 sessions/day).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
let globalLimit: RateLimitEntry = {
  count: 0,
  resetAt: Date.now() + 86_400_000,
};

const IP_LIMIT = 15; // sessions per IP per day
const GLOBAL_LIMIT = 500; // total sessions per day

function cleanup() {
  const now = Date.now();
  if (globalLimit.resetAt <= now) {
    globalLimit = { count: 0, resetAt: now + 86_400_000 };
  }
  for (const [ip, entry] of ipLimits) {
    if (entry.resetAt <= now) {
      ipLimits.delete(ip);
    }
  }
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
} {
  cleanup();
  const now = Date.now();

  // Global check
  if (globalLimit.count >= GLOBAL_LIMIT) {
    return { allowed: false, reason: "Service is at capacity. Try again later." };
  }

  // IP check
  const entry = ipLimits.get(ip);
  if (entry && entry.count >= IP_LIMIT) {
    return {
      allowed: false,
      reason: "Daily session limit reached. Come back tomorrow.",
    };
  }

  return { allowed: true };
}

export function incrementRateLimit(ip: string) {
  const now = Date.now();
  const resetAt = now + 86_400_000;

  const entry = ipLimits.get(ip);
  if (entry) {
    entry.count++;
  } else {
    ipLimits.set(ip, { count: 1, resetAt });
  }

  globalLimit.count++;
}
