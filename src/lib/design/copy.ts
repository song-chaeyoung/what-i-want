export const BRAND_NAME = "뭐갖고싶어";

export const HOME_COPY = {
  headline: BRAND_NAME,
  eyebrow: "생일 위시리스트",
  description: "받고 싶은 선물을 링크 하나로 모아 친구들에게 공유해요.",
  subDescription: "친구는 로그인 없이 축하 메시지와 마음을 보낼 수 있어요.",
  cta: "내 위시리스트 만들기",
  previewSlug: "birthday-wish",
} as const;

export const HOME_FAQ = [
  {
    question: "뭐갖고싶어는 어떤 서비스인가요?",
    answer:
      "받고 싶은 생일 선물을 하나의 공개 링크에 모아 친구들에게 공유하는 서비스예요. 선물마다 목표 금액을 정해두면 친구들이 조금씩 마음을 보탤 수 있고, 얼마나 모였는지 진행률로 한눈에 확인할 수 있어요. 친구들은 그 링크에서 축하 메시지도 함께 남길 수 있어요.",
  },
  {
    question: "어떻게 사용하나요?",
    answer:
      "먼저 이름과 생일, 간단한 소개를 입력해 나만의 위시리스트를 만들고 받고 싶은 선물을 추가해요. 그다음 만들어진 공개 링크를 친구들에게 공유하면 돼요. 친구가 마음이나 축하 메시지를 보내면 관리 화면과 메시지함에서 바로 확인할 수 있어요.",
  },
  {
    question: "선물을 주는 친구도 회원가입을 해야 하나요?",
    answer:
      "아니요. 친구는 회원가입이나 로그인 없이 공유받은 링크에서 바로 참여할 수 있어요. 이름과 보낼 마음(금액), 축하 메시지만 적으면 되고, 메시지만 남기는 것도 가능해요.",
  },
  {
    question: "이 사이트에서 바로 결제나 송금이 되나요?",
    answer:
      "아니요, 뭐갖고싶어에서 직접 결제가 이뤄지진 않아요. 친구가 마음 보내기를 누르면 생일 주인공이 등록해 둔 계좌를 안내하고, 친구가 그 계좌로 직접 송금하는 방식이에요. 그래서 카드 정보나 결제 수단을 입력할 필요가 없어요.",
  },
  {
    question: "위시리스트는 아무나 볼 수 있나요? 비공개로 할 수 있나요?",
    answer:
      "공개 위시리스트는 검색엔진에 노출되지 않아서, 링크를 아는 사람만 열어볼 수 있어요. 링크를 공유한 친구들에게만 보이는 셈이에요. 더 이상 공개하고 싶지 않으면 설정에서 언제든 비공개로 전환할 수 있고, 비공개로 바꾸면 링크로도 열리지 않아요.",
  },
  {
    question: "유료인가요?",
    answer:
      "아니요, 무료로 사용할 수 있어요. 위시리스트를 만들고 공유하고 마음을 받는 모든 과정에 이용료나 수수료가 붙지 않아요.",
  },
] as const;

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
  participationSuccessNoAccount:
    "마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.",
  participationTransferNote:
    "여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.",
  participationTransferNoteNoAccount:
    "실제 선물 전달 방법은 생일자에게 직접 확인해주세요.",
  fundCta: "이 선물에 마음 보태기",
  fundingSuccessTitle: "마음이 전해졌어요",
  fundingSuccessDescription: "아래 계좌로 보내주시면 전달이 완료돼요.",
  fundingSuccessCorrectionNote: "잘못 보냈다면 생일자에게 알려주세요.",
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
  postCreateCtaLabel: "나도 만들기",
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
