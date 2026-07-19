import { describe, expect, test } from "vitest";
import {
  formatBirthdayBadge,
  getDaysUntilBirthday,
  parseBirthday,
} from "./birthday";

// KST 자정 직후 기준 시각을 UTC Date로 만든다.
function kstDate(iso: string): Date {
  return new Date(`${iso}T00:00:00+09:00`);
}

describe("parseBirthday", () => {
  test("parses a YYYY-MM-DD birthday into month and day", () => {
    expect(parseBirthday("1999-07-24")).toEqual({ month: 7, day: 24 });
  });

  test("rejects malformed or impossible values", () => {
    expect(parseBirthday("07-24")).toBeNull();
    expect(parseBirthday("1999-13-01")).toBeNull();
    expect(parseBirthday("1999-00-10")).toBeNull();
    expect(parseBirthday("not-a-date")).toBeNull();
  });
});

describe("getDaysUntilBirthday", () => {
  test("returns 0 on the birthday itself", () => {
    expect(getDaysUntilBirthday("1999-07-24", kstDate("2026-07-24"))).toBe(0);
  });

  test("counts days until an upcoming birthday in the same year", () => {
    expect(getDaysUntilBirthday("1999-07-24", kstDate("2026-07-19"))).toBe(5);
  });

  test("rolls over to next year once the birthday has passed", () => {
    expect(getDaysUntilBirthday("1999-07-24", kstDate("2026-07-25"))).toBe(364);
  });

  test("uses the KST calendar date, not UTC", () => {
    // UTC 2026-07-23 16:00 = KST 2026-07-24 01:00 → 생일 당일
    expect(
      getDaysUntilBirthday("1999-07-24", new Date("2026-07-23T16:00:00Z")),
    ).toBe(0);
  });

  test("celebrates 2/29 birthdays on 2/28 in non-leap years", () => {
    expect(getDaysUntilBirthday("2000-02-29", kstDate("2026-02-28"))).toBe(0);
    expect(getDaysUntilBirthday("2000-02-29", kstDate("2028-02-28"))).toBe(1);
  });

  test("returns null for invalid birthdays", () => {
    expect(getDaysUntilBirthday("invalid", kstDate("2026-07-19"))).toBeNull();
  });
});

describe("formatBirthdayBadge", () => {
  test("formats month, day, and D-day label", () => {
    expect(formatBirthdayBadge("1999-07-24", kstDate("2026-07-19"))).toBe(
      "7월 24일 · D-5",
    );
  });

  test("shows D-DAY on the birthday", () => {
    expect(formatBirthdayBadge("1999-07-24", kstDate("2026-07-24"))).toBe(
      "7월 24일 · D-DAY",
    );
  });

  test("returns null for invalid birthdays", () => {
    expect(formatBirthdayBadge("invalid", kstDate("2026-07-19"))).toBeNull();
  });
});
