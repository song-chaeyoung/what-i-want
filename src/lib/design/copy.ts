export const BRAND_NAME = "뭐갖고싶어";

export const HOME_COPY = {
  headline: BRAND_NAME,
  eyebrow: "생일 위시리스트",
  description: "받고 싶은 선물을 링크 하나로 모아 친구들에게 공유해요.",
  subDescription: "친구는 로그인 없이 축하 메시지와 마음을 보낼 수 있어요.",
  cta: "내 위시리스트 만들기",
  previewSlug: "birthday-wish",
} as const;

export const FOOTER_COPY = {
  contactLabel: "문의하기",
  supportLabel: "후원하기",
  contactUrl: "https://forms.gle/WYpBboXs3WphC7ai6",
} as const;

export const PUBLIC_WISHLIST_COPY = {
  description: "받고 싶은 선물을 모아둔 위시리스트예요.",
  summaryWishLabel: "선물",
  summaryFundedLabel: "모인 마음",
  emptyTitle: "아직 공개된 선물이 없어요",
  emptyDescription: "생일 주인공이 선물을 추가하면 여기에 나타나요.",
  createMineCta: HOME_COPY.cta,
  productLinkCta: "상품 보기",
  participationTitle: "마음 보내기",
  participationAmountLabel: "보낼 마음",
  participationSenderLabel: "이름",
  participationMessageLabel: "메시지",
  participationSubmitCta: "마음 보내기",
  participationSuccess: "마음이 전해졌어요.",
  fundCta: "이 선물에 마음 보태기",
  fundingSuccessTitle: "마음이 전해졌어요",
  fundingSuccessDescription: "아래 계좌로 보내주시면 전달이 완료돼요.",
  accountModalClose: "닫기",
  accountSectionTitle: "계좌 안내",
  accountSectionNote: "마음은 이 계좌로 전할 수 있어요.",
  shareCta: "공유하기",
  shareCopied: "복사 완료",
  shareSuccess: "위시리스트 링크를 복사했어요.",
  shareError: "링크 복사에 실패했어요. 주소를 직접 복사해주세요.",
  messageFormTitle: "축하 메시지 남기기",
  messageFormNote: "결제 없이 메시지만 전할 수 있어요.",
  messageSuccess: "축하 메시지가 전해졌어요.",
  participationErrors: {
    wishlist_not_found: "위시리스트를 찾을 수 없어요.",
    wish_not_found: "선물을 다시 선택해주세요.",
    message_required: "메시지를 입력해주세요.",
    message_too_long: "메시지는 500자까지 쓸 수 있어요.",
    invalid_amount: "금액은 1원 이상으로 입력해주세요.",
    rate_limited: "지금 이용자가 많아요. 잠시 후 다시 시도해주세요.",
    unexpected: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  },
  noTargetAmount: "목표 금액 없음",
  progressSuffix: "달성",
  completeLabel: "완료",
  notFoundTitle: "위시리스트를 찾을 수 없어요",
  notFoundDescription:
    "주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.",
  errorTitle: "잠시 문제가 생겼어요",
  errorDescription: "일시적인 오류예요. 잠시 후 다시 시도해주세요.",
  homeCta: "처음으로",
  retryCta: "다시 시도",
} as const;

export function formatWishCount(count: number): string {
  return `${count}개`;
}
