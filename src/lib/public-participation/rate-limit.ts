import { createHmac } from "node:crypto";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const CLEANUP_INTERVAL = 50;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type PublicParticipationRateLimitInput = {
  slug: string;
  clientIp: string | null;
  userAgent: string | null;
  now?: number;
};

export type PublicParticipationRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

const buckets = new Map<string, RateLimitBucket>();
let checksSinceCleanup = 0;

// In-memory best-effort limiter for one runtime only; this is not a distributed limit.
export function checkPublicParticipationRateLimit({
  slug,
  clientIp,
  userAgent,
  now = Date.now(),
}: PublicParticipationRateLimitInput): PublicParticipationRateLimitResult {
  checksSinceCleanup += 1;

  if (checksSinceCleanup >= CLEANUP_INTERVAL) {
    cleanupExpiredBuckets(now);
    checksSinceCleanup = 0;
  }

  const key = buildRateLimitKey({ slug, clientIp, userAgent });
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function readPublicParticipationRateLimitVisitor(request: Request): {
  clientIp: string | null;
  userAgent: string | null;
} {
  return {
    clientIp: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  };
}

export function __resetPublicParticipationRateLimitForTests(): void {
  buckets.clear();
  checksSinceCleanup = 0;
}

function buildRateLimitKey(input: PublicParticipationRateLimitInput): string {
  return createHmac("sha256", getRateLimitSecret())
    .update(input.slug)
    .update("\0")
    .update(input.clientIp ?? "unknown")
    .update("\0")
    .update(input.userAgent ?? "unknown")
    .digest("hex");
}

function getRateLimitSecret(): string {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is required for public participation throttling.",
    );
  }

  return "development-public-participation-rate-limit-secret";
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip")
  );
}

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
