/**
 * In-memory rate limiter. Resets on cold start (acceptable for MVP).
 * Three tiers:
 *   - Per-IP sessions (15/day) — checked on turn 1 only
 *   - Per-IP requests (100/day) — checked on every API call
 *   - Global sessions (500/day) — checked on turn 1 only
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipSessionLimits = new Map<string, RateLimitEntry>();
const ipRequestLimits = new Map<string, RateLimitEntry>();
let globalLimit: RateLimitEntry = {
  count: 0,
  resetAt: Date.now() + 86_400_000,
};

const IP_SESSION_LIMIT = 15; // sessions per IP per day
const IP_REQUEST_LIMIT = 100; // API calls per IP per day
const GLOBAL_LIMIT = 500; // total sessions per day

function cleanup() {
  const now = Date.now();
  if (globalLimit.resetAt <= now) {
    globalLimit = { count: 0, resetAt: now + 86_400_000 };
  }
  for (const [ip, entry] of ipSessionLimits) {
    if (entry.resetAt <= now) {
      ipSessionLimits.delete(ip);
    }
  }
  for (const [ip, entry] of ipRequestLimits) {
    if (entry.resetAt <= now) {
      ipRequestLimits.delete(ip);
    }
  }
}

/** Check session-level rate limit (per-IP + global). Called on turn 1. */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
} {
  cleanup();

  // Global check
  if (globalLimit.count >= GLOBAL_LIMIT) {
    return { allowed: false, reason: "Service is at capacity. Try again later." };
  }

  // IP session check
  const entry = ipSessionLimits.get(ip);
  if (entry && entry.count >= IP_SESSION_LIMIT) {
    return {
      allowed: false,
      reason: "Daily session limit reached. Come back tomorrow.",
    };
  }

  return { allowed: true };
}

/** Increment session-level counters. Called on turn 1. */
export function incrementRateLimit(ip: string) {
  const now = Date.now();
  const resetAt = now + 86_400_000;

  const entry = ipSessionLimits.get(ip);
  if (entry) {
    entry.count++;
  } else {
    ipSessionLimits.set(ip, { count: 1, resetAt });
  }

  globalLimit.count++;
}

/** Check per-IP request rate limit. Called on every API request. */
export function checkRequestRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
} {
  cleanup();

  const entry = ipRequestLimits.get(ip);
  if (entry && entry.count >= IP_REQUEST_LIMIT) {
    return {
      allowed: false,
      reason: "Too many requests. Come back tomorrow.",
    };
  }

  return { allowed: true };
}

/** Increment per-IP request counter. Called on every API request. */
export function incrementRequestRateLimit(ip: string) {
  const now = Date.now();
  const resetAt = now + 86_400_000;

  const entry = ipRequestLimits.get(ip);
  if (entry) {
    entry.count++;
  } else {
    ipRequestLimits.set(ip, { count: 1, resetAt });
  }
}
