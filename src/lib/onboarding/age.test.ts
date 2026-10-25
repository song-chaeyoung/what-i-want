import { describe, expect, test } from "vitest";
import {
  getLatestSignupBirthday,
  isFutureBirthday,
  isUnderMinimumSignupAge,
} from "./age";

describe("getLatestSignupBirthday", () => {
  test("returns the date 14 years before today in KST", () => {
    // UTC로는 10/23이지만 KST로는 10/24다.
    expect(getLatestSignupBirthday(new Date("2026-10-23T15:00:00Z"))).toBe(
      "2012-10-24",
    );
  });

  test("returns Feb 28 on a leap day so it stays a valid date input max", () => {
    expect(getLatestSignupBirthday(new Date("2028-02-29T12:00:00+09:00"))).toBe(
      "2014-02-28",
    );
  });
});

describe("isFutureBirthday", () => {
  const kstMorning = new Date("2026-10-24T09:00:00+09:00");

  test("treats today in KST as not in the future", () => {
    expect(isFutureBirthday("2026-10-24", kstMorning)).toBe(false);
  });

  test("treats tomorrow in KST as in the future", () => {
    expect(isFutureBirthday("2026-10-25", kstMorning)).toBe(true);
  });
});

describe("isUnderMinimumSignupAge", () => {
  const kstMorning = new Date("2026-10-24T09:00:00+09:00");

  test("is false on the 14th birthday and true the day after the cutoff", () => {
    expect(isUnderMinimumSignupAge("2012-10-24", kstMorning)).toBe(false);
    expect(isUnderMinimumSignupAge("2012-10-25", kstMorning)).toBe(true);
  });
});
