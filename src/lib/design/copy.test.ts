import { describe, expect, test } from "vitest";
import {
  ADMIN_COPY,
  ONBOARDING_COPY,
  WITHDRAWAL_COPY,
  BRAND_NAME,
  HOME_COPY,
  PUBLIC_WISHLIST_COPY,
  formatWishCount,
  getPublicParticipationNotice,
  underAgeConfirmTitle,
} from "./copy";

describe("visual system copy", () => {
  test("defines the public brand and home hero copy", () => {
    expect(BRAND_NAME).toBe("뭐갖고싶어");
    expect(HOME_COPY).toEqual({
      headline: "친구들과 함께하는 생일 선물 펀딩",
      eyebrow: "뭐갖고싶어 · 생일 위시리스트",
      description:
        "받고 싶은 선물과 목표 금액을 정하고, 링크 하나로 친구들에게 공유해요.",
      subDescription:
        "친구는 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 마음을 보탤 수 있어요.",
      cta: "내 위시리스트 만들기",
      previewSlug: "birthday-wish",
    });
  });

  test("defines public wishlist empty and not found copy", () => {
    expect(PUBLIC_WISHLIST_COPY.emptyTitle).toBe(
      "아직 공개된 선물이 없어요",
    );
    expect(PUBLIC_WISHLIST_COPY.notFoundTitle).toBe(
      "위시리스트를 찾을 수 없어요",
    );
  });

  test("defines closed participation notices for complete and paused wishes", () => {
    expect(PUBLIC_WISHLIST_COPY.participationClosedComplete).toBe(
      "마음이 다 모였어요. 고마워요!",
    );
    expect(PUBLIC_WISHLIST_COPY.participationClosedPaused).toBe(
      "지금은 잠시 마음을 받지 않아요.",
    );
  });

  test("defines public participation form copy", () => {
    expect(PUBLIC_WISHLIST_COPY.participationTitle).toBe("마음 보내기");
    expect(PUBLIC_WISHLIST_COPY.participationSubmitCta).toBe("마음 보내기");
    expect(PUBLIC_WISHLIST_COPY.participationSuccess).toBe(
      "마음이 전해졌어요.",
    );
    expect(PUBLIC_WISHLIST_COPY.participationErrors.invalid_amount).toBe(
      "금액은 1원부터 1억 원까지 입력할 수 있어요.",
    );
    expect(PUBLIC_WISHLIST_COPY.participationErrors.rate_limited).toBe(
      "지금 이용자가 많아요. 잠시 후 다시 시도해주세요.",
    );
  });

  test("defines public share copy", () => {
    expect(PUBLIC_WISHLIST_COPY.shareCta).toBe("공유하기");
    expect(PUBLIC_WISHLIST_COPY.shareSuccess).toBe(
      "위시리스트 링크를 복사했어요.",
    );
    expect(PUBLIC_WISHLIST_COPY.shareError).toBe(
      "링크 복사에 실패했어요. 주소를 직접 복사해주세요.",
    );
  });

  test("defines public account guidance copy", () => {
    expect(PUBLIC_WISHLIST_COPY.accountSectionTitle).toBe("계좌 안내");
    expect(PUBLIC_WISHLIST_COPY.accountSectionNote).toBe(
      "마음은 이 계좌로 전할 수 있어요.",
    );
    expect(PUBLIC_WISHLIST_COPY.accountCopyLabel).toBe("계좌번호 복사");
    expect(PUBLIC_WISHLIST_COPY.accountCopyCopied).toBe("복사 완료");
    expect(PUBLIC_WISHLIST_COPY.accountCopySuccess).toBe(
      "은행과 계좌번호를 복사했어요.",
    );
    expect(PUBLIC_WISHLIST_COPY.accountCopyError).toBe(
      "계좌번호 복사에 실패했어요.",
    );
  });

  test("defines admin account validation and reserved slug copy", () => {
    expect(ADMIN_COPY.reservedSlug).toBe(
      "sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.",
    );
    expect(ADMIN_COPY.invalidAccountNumber).toBe(
      "계좌번호는 숫자와 하이픈(-)만 입력해 주세요.",
    );
    expect(ADMIN_COPY.invalidAccountVisibility).toBe(
      "지원하지 않는 계좌 공개 값입니다.",
    );
    expect(ADMIN_COPY.bankNameRequired).toBe("은행 이름을 입력해주세요.");
    expect(ADMIN_COPY.accountHolderRequired).toBe("예금주를 입력해주세요.");
    expect(ADMIN_COPY.accountNumberRequired).toBe("계좌번호를 입력해주세요.");
    expect(ADMIN_COPY.accountFieldTooLong).toBe(
      "계좌 정보는 80자 이하여야 합니다.",
    );
    expect(ADMIN_COPY.accountEncryptionUnavailable).toBe(
      "계좌 암호화 키가 설정되어 있지 않습니다.",
    );
    expect(ADMIN_COPY.privateShareNotice).toBe(
      "비공개라 친구가 열 수 없어요.",
    );
    expect(ADMIN_COPY.accountVisibilityCopyOnlyHint).toBe(
      "공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.",
    );
    expect(ADMIN_COPY.accountVisibilityHiddenHint).toBe(
      "공개 페이지에 계좌가 보이지 않아요.",
    );
    expect(ADMIN_COPY.deleteBankAccountButton).toBe("계좌 삭제");
    expect(ADMIN_COPY.deleteBankAccountConfirm).toEqual({
      title: "계좌 정보를 삭제할까요?",
      description:
        "은행, 예금주, 계좌번호가 모두 지워지고 되돌릴 수 없어요. 공개 위시리스트에도 계좌가 보이지 않아요.",
      confirm: "삭제",
      pending: "삭제하는 중…",
    });
    expect(
      `${ADMIN_COPY.deleteBankAccountConfirm.title} ${ADMIN_COPY.deleteBankAccountConfirm.description}`,
    ).toBe(
      "계좌 정보를 삭제할까요? 은행, 예금주, 계좌번호가 모두 지워지고 되돌릴 수 없어요. 공개 위시리스트에도 계좌가 보이지 않아요.",
    );
    expect(ADMIN_COPY.deleteBankAccountSuccess).toBe("계좌 정보를 삭제했어요.");
    expect(ADMIN_COPY.deleteBankAccountError).toBe(
      "계좌 정보를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
    expect(ADMIN_COPY.deleteWishButton).toBe("삭제");
    expect(ADMIN_COPY.deleteWishConfirm).toEqual({
      title: "이 선물을 삭제할까요?",
      descriptionWithAmount:
        "이 선물에 모인 금액 기록도 함께 삭제되고 되돌릴 수 없어요. 받은 메시지는 메시지함에 남아요.",
      descriptionWithoutAmount: "삭제하면 되돌릴 수 없어요.",
      confirm: "삭제",
      pending: "삭제하는 중…",
    });
    expect(
      `${ADMIN_COPY.deleteWishConfirm.title} ${ADMIN_COPY.deleteWishConfirm.descriptionWithAmount}`,
    ).toBe(
      "이 선물을 삭제할까요? 이 선물에 모인 금액 기록도 함께 삭제되고 되돌릴 수 없어요. 받은 메시지는 메시지함에 남아요.",
    );
    expect(
      `${ADMIN_COPY.deleteWishConfirm.title} ${ADMIN_COPY.deleteWishConfirm.descriptionWithoutAmount}`,
    ).toBe("이 선물을 삭제할까요? 삭제하면 되돌릴 수 없어요.");
    expect(ADMIN_COPY.hideMessageButton).toBe("숨기기");
    expect(ADMIN_COPY.hideMessageConfirm).toEqual({
      title: "이 메시지를 숨길까요?",
      descriptionWithAmount:
        "함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.",
      descriptionWithoutAmount: "숨긴 메시지 목록에서 복구할 수 있어요.",
      confirm: "숨기기",
      pending: "숨기는 중…",
    });
    expect(
      `${ADMIN_COPY.hideMessageConfirm.title} ${ADMIN_COPY.hideMessageConfirm.descriptionWithAmount}`,
    ).toBe(
      "이 메시지를 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.",
    );
    expect(
      `${ADMIN_COPY.hideMessageConfirm.title} ${ADMIN_COPY.hideMessageConfirm.descriptionWithoutAmount}`,
    ).toBe(
      "이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.",
    );
    expect(ADMIN_COPY.resetWishlistButton).toBe("위시리스트 초기화");
    expect(ADMIN_COPY.resetWishlistConfirm).toEqual({
      title: "위시리스트를 초기화할까요?",
      description:
        "등록한 선물, 받은 메시지, 모인 금액 기록이 모두 삭제되고 되돌릴 수 없어요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.",
      confirm: "초기화",
      pending: "초기화하는 중…",
    });
    expect(
      `${ADMIN_COPY.resetWishlistConfirm.title} ${ADMIN_COPY.resetWishlistConfirm.description}`,
    ).toBe(
      "위시리스트를 초기화할까요? 등록한 선물, 받은 메시지, 모인 금액 기록이 모두 삭제되고 되돌릴 수 없어요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.",
    );
  });

  test("defines onboarding under-age confirm copy", () => {
    expect(underAgeConfirmTitle("2015")).toBe("2015년생이 맞나요?");
    expect(ONBOARDING_COPY.underAgeConfirm).toEqual({
      description:
        "만 14세 미만은 가입할 수 없어서, 이대로 제출하면 로그인 정보가 바로 삭제돼요.",
      confirm: "이 생일로 제출",
      pending: "제출하는 중…",
      cancel: "연도 고치기",
    });
  });

  test("defines withdrawal copy", () => {
    expect(WITHDRAWAL_COPY).toEqual({
      sectionTitle: "회원 탈퇴",
      sectionDescription:
        "계정과 위시리스트, 선물, 받은 메시지, 계좌 정보가 바로 모두 삭제되고 되돌릴 수 없어요.",
      button: "회원 탈퇴",
      confirm: {
        title: "정말 탈퇴할까요?",
        description:
          "계정, 위시리스트, 선물, 받은 메시지, 모인 금액 기록, 계좌 정보가 바로 모두 삭제되고 되돌릴 수 없어요. 탈퇴한 뒤에는 다른 사람이 같은 공개 주소를 쓸 수 있어서, 예전에 공유한 링크가 다른 사람의 위시리스트로 열릴 수 있어요.",
        confirm: "탈퇴",
        pending: "탈퇴하는 중…",
      },
      success: "탈퇴가 끝났어요. 그동안 이용해 주셔서 고마워요.",
      error: "탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.",
    });
    expect(
      `${WITHDRAWAL_COPY.confirm.title} ${WITHDRAWAL_COPY.confirm.description}`,
    ).toBe(
      "정말 탈퇴할까요? 계정, 위시리스트, 선물, 받은 메시지, 모인 금액 기록, 계좌 정보가 바로 모두 삭제되고 되돌릴 수 없어요. 탈퇴한 뒤에는 다른 사람이 같은 공개 주소를 쓸 수 있어서, 예전에 공유한 링크가 다른 사람의 위시리스트로 열릴 수 있어요.",
    );
  });

  test("chooses a closed participation notice from the displayed status", () => {
    expect(getPublicParticipationNotice("open", 99)).toBeNull();
    expect(getPublicParticipationNotice("open", 100)).toBe(
      "마음이 다 모였어요. 고마워요!",
    );
    expect(getPublicParticipationNotice("fulfilled", 0)).toBe(
      "마음이 다 모였어요. 고마워요!",
    );
    expect(getPublicParticipationNotice("paused", 0)).toBe(
      "지금은 잠시 마음을 받지 않아요.",
    );
    expect(getPublicParticipationNotice("paused", 100)).toBe(
      "지금은 잠시 마음을 받지 않아요.",
    );
    expect(getPublicParticipationNotice("hidden", 100)).toBeNull();
  });

  test("formats wish counts in Korean", () => {
    expect(formatWishCount(0)).toBe("0개");
    expect(formatWishCount(3)).toBe("3개");
  });
});
