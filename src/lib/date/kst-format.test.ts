import { afterEach, describe, expect, test } from "vitest";
import { formatKstDate, formatKstDateTime } from "./kst-format";

const originalTz = process.env.TZ;

// KST 10월 26일 00:30 = UTC 10월 25일 15:30
const kstMidnightAfter = new Date("2026-10-25T15:30:00Z");

afterEach(() => {
  if (originalTz === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTz;
  }
});

describe.each(["UTC", "America/Los_Angeles", "Asia/Seoul"])(
  "with server time zone %s",
  (serverTz) => {
    test("formats the KST calendar date", () => {
      process.env.TZ = serverTz;

      expect(formatKstDate(kstMidnightAfter)).toBe("2026. 10. 26.");
    });

    test("formats the KST date and time", () => {
      process.env.TZ = serverTz;

      expect(formatKstDateTime(kstMidnightAfter)).toBe(
        "2026. 10. 26. 오전 12:30",
      );
    });
  },
);
