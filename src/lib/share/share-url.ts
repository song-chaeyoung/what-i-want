/**
 * 공유 루프의 유입 채널을 측정하기 위한 UTM 태깅 헬퍼.
 * - 생일자(owner)와 방문한 친구(visitor)가 공유한 링크를 구분한다.
 * - 참여 직후 "나도 만들기" 전환을 별도 소스로 추적한다.
 */

export type WishlistShareSource = "owner" | "visitor";

export function buildWishlistShareUrl(
  origin: string,
  slug: string,
  source: WishlistShareSource,
): string {
  const url = new URL(`/wishlist/${slug}`, origin);
  url.searchParams.set("utm_source", `${source}_share`);
  url.searchParams.set("utm_medium", "share");
  return url.toString();
}

export function buildCreateCtaHref(source: string): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: "cta",
  });
  return `/login?${params.toString()}`;
}
