const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const CLEANUP_INTERVAL = 50;
const MAX_BUCKETS = 10_000;
const MAX_USER_AGENT_KEY_LENGTH = 256;

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
    evictOldestBucketsOverCap();
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

export function readPublicParticipationRateLimitVisitor(headers: Headers): {
  clientIp: string | null;
  userAgent: string | null;
} {
  return {
    clientIp: getClientIp(headers),
    userAgent: headers.get("user-agent"),
  };
}

export function __resetPublicParticipationRateLimitForTests(): void {
  buckets.clear();
  checksSinceCleanup = 0;
}

function buildRateLimitKey(input: PublicParticipationRateLimitInput): string {
  return [
    input.slug,
    input.clientIp ?? "unknown",
    (input.userAgent ?? "unknown").slice(0, MAX_USER_AGENT_KEY_LENGTH),
  ].join("\0");
}

function getClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  if (firstForwardedIp) {
    return firstForwardedIp;
  }

  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip");
}

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

// Map iteration order is insertion order, so dropping the first key is FIFO.
function evictOldestBucketsOverCap(): void {
  while (buckets.size > MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;

    if (oldestKey === undefined) {
      return;
    }

    buckets.delete(oldestKey);
  }
}
