import {
  getDisplayedWishStatus,
  type WishStatus,
} from "../wish-item/status";

export const BRAND_NAME = "뭐갖고싶어";

export const HOME_COPY = {
  headline: "친구들과 함께하는 생일 선물 펀딩",
  eyebrow: "뭐갖고싶어 · 생일 위시리스트",
  description:
    "받고 싶은 선물과 목표 금액을 정하고, 링크 하나로 친구들에게 공유해요.",
  subDescription:
    "친구는 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 마음을 보탤 수 있어요.",
  cta: "내 위시리스트 만들기",
  previewSlug: "birthday-wish",
} as const;

export const HOME_FAQ = [
  {
    question: "생일 선물 펀딩이란 무엇인가요?",
    answer:
      "받고 싶은 생일 선물과 목표 금액을 정하고, 친구들이 원하는 만큼 금액을 보태 함께 선물을 준비하는 방식이에요. 뭐갖고싶어에서는 선물 목록을 공개 링크로 공유하고, 친구들이 남긴 금액과 축하 메시지를 확인할 수 있어요.",
  },
  {
    question: "생일 펀딩은 어떻게 시작하나요?",
    answer:
      "먼저 이름과 생일, 간단한 소개를 입력해 나만의 위시리스트를 만들고 받고 싶은 선물과 목표 금액을 추가해요. 그다음 만들어진 공개 링크를 친구들에게 공유하면 돼요. 친구가 마음이나 축하 메시지를 보내면 관리 화면과 메시지함에서 확인할 수 있어요.",
  },
  {
    question: "선물을 주는 친구도 회원가입을 해야 하나요?",
    answer:
      "아니요. 친구는 회원가입이나 로그인 없이 공유받은 링크에서 바로 참여할 수 있어요. 이름과 보낼 마음(금액), 축하 메시지만 적으면 되고, 메시지만 남기는 것도 가능해요.",
  },
  {
    question: "펀딩 금액은 어떻게 전달하나요?",
    answer:
      "친구가 마음 보내기를 누르면 생일 주인공이 등록해 둔 계좌를 안내하고, 친구가 그 계좌로 직접 송금하는 방식이에요. 뭐갖고싶어에서 직접 결제나 자동 정산이 이뤄지지는 않아요. 카드 정보나 결제 수단을 입력할 필요가 없어요.",
  },
  {
    question: "위시리스트는 아무나 볼 수 있나요? 비공개로 할 수 있나요?",
    answer:
      "공개 위시리스트는 검색엔진에 노출되지 않아서, 링크를 아는 사람만 열어볼 수 있어요. 링크를 공유한 친구들에게만 보이는 셈이에요. 더 이상 공개하고 싶지 않으면 설정에서 언제든 비공개로 전환할 수 있고, 비공개로 바꾸면 링크로도 열리지 않아요.",
  },
  {
    question: "이용료나 펀딩 수수료가 있나요?",
    answer:
      "아니요, 무료로 사용할 수 있어요. 위시리스트를 만들고 공유하고 마음을 받는 모든 과정에 이용료나 수수료가 붙지 않아요.",
  },
] as const;

export const FOOTER_COPY = {
  contactLabel: "문의하기",
  supportLabel: "후원하기",
  termsLabel: "이용약관",
  privacyLabel: "개인정보 처리방침",
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
  participationSuccessNoAccount:
    "마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.",
  participationTransferNote:
    "여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.",
  participationTransferNoteNoAccount:
    "실제 선물 전달 방법은 생일자에게 직접 확인해주세요.",
  fundCta: "이 선물에 마음 보태기",
  participationClosedComplete: "마음이 다 모였어요. 고마워요!",
  participationClosedPaused: "지금은 잠시 마음을 받지 않아요.",
  fundingSuccessTitle: "마음이 전해졌어요",
  fundingSuccessDescription: "아래 계좌로 보내주시면 전달이 완료돼요.",
  fundingSuccessCorrectionNote: "잘못 보냈다면 생일자에게 알려주세요.",
  accountModalClose: "닫기",
  accountSectionTitle: "계좌 안내",
  accountSectionNote: "마음은 이 계좌로 전할 수 있어요.",
  accountCopyLabel: "계좌번호 복사",
  accountCopyCopied: "복사 완료",
  accountCopySuccess: "은행과 계좌번호를 복사했어요.",
  accountCopyError: "계좌번호 복사에 실패했어요.",
  shareCta: "공유하기",
  shareCopied: "복사 완료",
  shareSuccess: "위시리스트 링크를 복사했어요.",
  shareError: "링크 복사에 실패했어요. 주소를 직접 복사해주세요.",
  messageFormTitle: "축하 메시지 남기기",
  messageFormNote: "결제 없이 메시지만 전할 수 있어요.",
  messageSuccess: "축하 메시지가 전해졌어요.",
  postCreateCtaLabel: "나도 만들기",
  participationErrors: {
    wishlist_not_found: "위시리스트를 찾을 수 없어요.",
    wish_not_found: "선물을 다시 선택해주세요.",
    wish_not_open: "지금은 마음을 보탤 수 없는 선물이에요.",
    message_required: "메시지를 입력해주세요.",
    message_too_long: "메시지는 500자까지 쓸 수 있어요.",
    invalid_amount: "금액은 1원 이상으로 입력해주세요.",
    client_request_conflict:
      "이미 처리된 요청이에요. 새로고침한 뒤 다시 시도해주세요.",
    rate_limited: "지금 이용자가 많아요. 잠시 후 다시 시도해주세요.",
    unexpected: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  },
  noTargetAmount: "목표 금액 없음",
  progressSuffix: "달성",
  notFoundTitle: "위시리스트를 찾을 수 없어요",
  notFoundDescription:
    "주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.",
  errorTitle: "잠시 문제가 생겼어요",
  errorDescription: "일시적인 오류예요. 잠시 후 다시 시도해주세요.",
  homeCta: "처음으로",
  retryCta: "다시 시도",
} as const;

export const ADMIN_COPY = {
  reservedSlug:
    "sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.",
  invalidAccountVisibility: "지원하지 않는 계좌 공개 값입니다.",
  bankNameRequired: "은행 이름을 입력해주세요.",
  accountHolderRequired: "예금주를 입력해주세요.",
  accountNumberRequired: "계좌번호를 입력해주세요.",
  invalidAccountNumber: "계좌번호는 숫자와 하이픈(-)만 입력해 주세요.",
  accountFieldTooLong: "계좌 정보는 80자 이하여야 합니다.",
  accountEncryptionUnavailable: "계좌 암호화 키가 설정되어 있지 않습니다.",
  privateShareNotice: "비공개라 친구가 열 수 없어요.",
  accountVisibilityCopyOnlyHint:
    "공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.",
  accountVisibilityHiddenHint: "공개 페이지에 계좌가 보이지 않아요.",
} as const;

export function formatWishCount(count: number): string {
  return `${count}개`;
}

export function getPublicParticipationNotice(
  status: WishStatus,
  progress: number,
): string | null {
  const displayedStatus = getDisplayedWishStatus(status, progress);

  if (displayedStatus === "fulfilled") {
    return PUBLIC_WISHLIST_COPY.participationClosedComplete;
  }

  if (displayedStatus === "paused") {
    return PUBLIC_WISHLIST_COPY.participationClosedPaused;
  }

  return null;
}
