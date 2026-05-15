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
  participationTitle: "마음 보내기",
  participationDescription: "선물 하나를 고르고 축하 메시지를 남겨주세요.",
  participationWishLabel: "선물",
  participationAmountLabel: "보낼 마음",
  participationSenderLabel: "이름",
  participationMessageLabel: "메시지",
  participationSubmitCta: "마음 보내기",
  participationSuccess: "마음이 전해졌어요.",
  participationErrors: {
    wishlist_not_found: "위시리스트를 찾을 수 없어요.",
    wish_not_found: "선물을 다시 선택해주세요.",
    message_required: "메시지를 입력해주세요.",
    message_too_long: "메시지는 500자 이하여야 합니다.",
    invalid_amount: "금액은 1원 이상으로 입력해주세요.",
  },
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
