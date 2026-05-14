export const BRAND_NAME = "뭐갖고싶어";

export const HOME_COPY = {
  headline: BRAND_NAME,
  eyebrow: "생일 위시리스트",
  description: "받고 싶은 선물을 링크 하나로 모아 친구들에게 공유해요.",
  cta: "내 위시리스트 만들기",
  previewSlug: "birthday-wish",
} as const;

export const PUBLIC_WISHLIST_COPY = {
  description:
    "친구가 받고 싶은 선물을 모아둔 공개 위시리스트예요. 마음에 드는 선물을 확인하고 상품 링크로 바로 이동할 수 있어요.",
  summaryWishLabel: "선물",
  summaryFundedLabel: "모인 마음",
  emptyTitle: "아직 공개된 선물이 없어요",
  emptyDescription: "생일자가 선물을 추가하면 이 페이지에 표시됩니다.",
  createMineCta: HOME_COPY.cta,
  productLinkCta: "상품 보기",
  noTargetAmount: "목표 금액 없음",
  progressSuffix: "달성",
  completeLabel: "완료",
  notFoundTitle: "위시리스트를 찾을 수 없어요",
  notFoundDescription:
    "주소가 잘못되었거나 아직 공개되지 않은 위시리스트입니다.",
  homeCta: "처음으로",
} as const;

export function formatWishCount(count: number): string {
  return `${count}개`;
}
