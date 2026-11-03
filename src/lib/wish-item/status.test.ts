import { describe, expect, test } from "vitest";
import {
  WISH_STATUS_LABELS,
  getDisplayedWishStatus,
  getWishStatusLabel,
  isWishComplete,
} from "./status";

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
      open: "마음 모으는 중",
      fulfilled: "완료",
      hidden: "숨김",
      paused: "잠시 멈춤",
    });
    expect(getWishStatusLabel("open")).toBe("마음 모으는 중");
    expect(getWishStatusLabel("fulfilled")).toBe("완료");
    expect(getWishStatusLabel("hidden")).toBe("숨김");
    expect(getWishStatusLabel("paused")).toBe("잠시 멈춤");
  });

  test("labels fulfilled wishes as complete", () => {
    expect(getWishStatusLabel("fulfilled", 0)).toBe("완료");
    expect(getWishStatusLabel("fulfilled", 40)).toBe("완료");
  });

  test("labels open wishes below 100 percent as still gathering", () => {
    expect(getWishStatusLabel("open", 0)).toBe("마음 모으는 중");
    expect(getWishStatusLabel("open", 99)).toBe("마음 모으는 중");
  });

  test("labels open wishes at or above 100 percent as complete", () => {
    expect(getWishStatusLabel("open", 100)).toBe("완료");
    expect(getWishStatusLabel("open", 120)).toBe("완료");
  });

  test("keeps the owner's paused and hidden labels", () => {
    expect(getWishStatusLabel("paused", 0)).toBe("잠시 멈춤");
    expect(getWishStatusLabel("paused", 100)).toBe("잠시 멈춤");
    expect(getWishStatusLabel("hidden", 0)).toBe("숨김");
    expect(getWishStatusLabel("hidden", 100)).toBe("숨김");
  });

  test("shows fulfilled as the displayed status", () => {
    expect(getDisplayedWishStatus("fulfilled", 0)).toBe("fulfilled");
    expect(getDisplayedWishStatus("fulfilled", 100)).toBe("fulfilled");
  });

  test("keeps open wishes below 100 percent open", () => {
    expect(getDisplayedWishStatus("open", 0)).toBe("open");
    expect(getDisplayedWishStatus("open", 99)).toBe("open");
  });

  test("shows open wishes at or above 100 percent as fulfilled", () => {
    expect(getDisplayedWishStatus("open", 100)).toBe("fulfilled");
    expect(getDisplayedWishStatus("open", 120)).toBe("fulfilled");
  });

  test("keeps paused and hidden display status regardless of progress", () => {
    expect(getDisplayedWishStatus("paused", 0)).toBe("paused");
    expect(getDisplayedWishStatus("paused", 100)).toBe("paused");
    expect(getDisplayedWishStatus("hidden", 0)).toBe("hidden");
    expect(getDisplayedWishStatus("hidden", 100)).toBe("hidden");
  });

  test("labels the displayed status", () => {
    const cases = [
      ["fulfilled", 0],
      ["open", 40],
      ["open", 100],
      ["paused", 100],
      ["hidden", 100],
    ] as const;

    for (const [status, progress] of cases) {
      expect(getWishStatusLabel(status, progress)).toBe(
        WISH_STATUS_LABELS[getDisplayedWishStatus(status, progress)],
      );
    }
  });
});
