import { describe, expect, test } from "vitest";
import { WISH_STATUS_LABELS, getWishStatusLabel, isWishComplete } from "./status";

describe("wish item status", () => {
  test("treats fulfilled status as complete", () => {
    expect(isWishComplete("fulfilled", 0)).toBe(true);
  });

  test("treats progress at or above 100 as complete", () => {
    expect(isWishComplete("open", 100)).toBe(true);
    expect(isWishComplete("open", 120)).toBe(true);
  });

  test("does not treat lower progress on open wishes as complete", () => {
    expect(isWishComplete("open", 99)).toBe(false);
  });

  test("defines Korean labels for every status", () => {
    expect(WISH_STATUS_LABELS).toEqual({
      open: "모으는 중",
      fulfilled: "완료",
      hidden: "숨김",
      paused: "일시중지",
    });
    expect(getWishStatusLabel("paused")).toBe("일시중지");
  });
});
