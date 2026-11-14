import { describe, expect, test } from "vitest";
import {
  ADMIN_COPY,
  BRAND_NAME,
  HOME_COPY,
  PUBLIC_WISHLIST_COPY,
  formatWishCount,
  getPublicParticipationNotice,
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
