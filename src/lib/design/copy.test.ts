import { describe, expect, test } from "vitest";
import {
  BRAND_NAME,
  HOME_COPY,
  PUBLIC_WISHLIST_COPY,
  formatWishCount,
} from "./copy";

describe("visual system copy", () => {
  test("defines the public brand and home hero copy", () => {
    expect(BRAND_NAME).toBe("뭐갖고싶어");
    expect(HOME_COPY).toEqual({
      headline: "뭐갖고싶어",
      eyebrow: "생일 위시리스트",
      description: "받고 싶은 선물을 링크 하나로 모아 친구들에게 공유해요.",
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

  test("formats wish counts in Korean", () => {
    expect(formatWishCount(0)).toBe("0개");
    expect(formatWishCount(3)).toBe("3개");
  });
});
