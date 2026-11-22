import { createHmac } from "node:crypto";
import { normalizeWishlistSlug } from "./slug";

// 탈퇴한 공개 주소가 바로 다른 사람에게 넘어가면, 예전에 공유된 링크가
// 새 위시리스트로 열릴 수 있다. 채영님 결정으로 30일만 재사용을 막는다.
// 평문 slug는 남기지 않고 HMAC만 저장한다.
export const WITHDRAWN_SLUG_BLOCK_DAYS = 30;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getSlugBlockSecret(): string | undefined {
  const dedicated = process.env.SLUG_BLOCK_SECRET?.trim();

  if (dedicated) {
    return dedicated;
  }

  // ACCOUNT_ENCRYPTION_SECRET이 없을 때 AUTH_SECRET을 쓰는 것과 같다.
  // 전용 키가 있으면 AUTH_SECRET을 바꿔도 차단 해시가 끊기지 않는다.
  const fallback = process.env.AUTH_SECRET?.trim();
  return fallback || undefined;
}

export function hashWithdrawnSlug(slug: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(normalizeWishlistSlug(slug))
    .digest("hex");
}

export function withdrawnSlugBlockedUntil(withdrawnAt: Date): Date {
  return new Date(withdrawnAt.getTime() + WITHDRAWN_SLUG_BLOCK_DAYS * DAY_IN_MS);
}

export function isWithdrawnSlugBlockActive(
  blockedUntil: Date,
  now: Date,
): boolean {
  return blockedUntil.getTime() > now.getTime();
}
