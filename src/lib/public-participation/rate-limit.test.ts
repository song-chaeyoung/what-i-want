import { beforeEach, describe, expect, test } from "vitest";
import {
  __resetPublicParticipationRateLimitForTests,
  checkPublicParticipationRateLimit,
  readPublicParticipationRateLimitVisitor,
} from "./rate-limit";

describe("public participation rate limit", () => {
  beforeEach(() => {
    __resetPublicParticipationRateLimitForTests();
  });

  test("blocks the sixth request from the same visitor within the window", () => {
    const visitor = {
      slug: "birthday",
      clientIp: "203.0.113.10",
      userAgent: "Vitest Browser",
    };

    for (let i = 0; i < 5; i += 1) {
      expect(
        checkPublicParticipationRateLimit({ ...visitor, now: 1_000 }),
      ).toEqual({ allowed: true });
    }

    expect(
      checkPublicParticipationRateLimit({ ...visitor, now: 1_000 }),
    ).toEqual({
      allowed: false,
      retryAfter: 60,
    });
  });

  test("tracks different slugs, client ips, and user agents independently", () => {
    const visitor = {
      slug: "birthday",
      clientIp: "203.0.113.10",
      userAgent: "Vitest Browser",
    };

    for (let i = 0; i < 5; i += 1) {
      checkPublicParticipationRateLimit({ ...visitor, now: 1_000 });
    }

    expect(
      checkPublicParticipationRateLimit({
        ...visitor,
        slug: "anniversary",
        now: 1_000,
      }),
    ).toEqual({ allowed: true });
    expect(
      checkPublicParticipationRateLimit({
        ...visitor,
        clientIp: "203.0.113.11",
        now: 1_000,
      }),
    ).toEqual({ allowed: true });
    expect(
      checkPublicParticipationRateLimit({
        ...visitor,
        userAgent: "Other Browser",
        now: 1_000,
      }),
    ).toEqual({ allowed: true });
  });

  test("allows the same visitor again after the window expires", () => {
    const visitor = {
      slug: "birthday",
      clientIp: "203.0.113.10",
      userAgent: "Vitest Browser",
    };

    for (let i = 0; i < 5; i += 1) {
      checkPublicParticipationRateLimit({ ...visitor, now: 1_000 });
    }

    expect(
      checkPublicParticipationRateLimit({ ...visitor, now: 61_000 }),
    ).toEqual({ allowed: true });
  });

  test("evicts the oldest bucket when the bucket cap is exceeded", () => {
    const visitor = {
      slug: "birthday",
      clientIp: "203.0.113.10",
      userAgent: "Vitest Browser",
    };

    for (let i = 0; i < 5; i += 1) {
      checkPublicParticipationRateLimit({ ...visitor, now: 1_000 });
    }

    // Fill the map past MAX_BUCKETS (10_000) with unique visitors so the
    // first visitor's bucket is evicted and their next request is allowed.
    for (let i = 0; i < 10_000; i += 1) {
      checkPublicParticipationRateLimit({
        ...visitor,
        clientIp: `198.51.100.${i}`,
        userAgent: `Spoofed Agent ${i}`,
        now: 1_000,
      });
    }

    expect(
      checkPublicParticipationRateLimit({ ...visitor, now: 1_000 }),
    ).toEqual({ allowed: true });
  });

  test("reads the first non-empty x-forwarded-for entry as the client ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.5, 198.51.100.7",
      "user-agent": "Vitest Browser",
    });

    expect(readPublicParticipationRateLimitVisitor(headers)).toEqual({
      clientIp: "203.0.113.5",
      userAgent: "Vitest Browser",
    });
  });

  test("falls back to x-real-ip when the first x-forwarded-for entry is empty", () => {
    const headers = new Headers({
      "x-forwarded-for": ", 203.0.113.5",
      "x-real-ip": "203.0.113.9",
      "user-agent": "Vitest Browser",
    });

    expect(readPublicParticipationRateLimitVisitor(headers)).toEqual({
      clientIp: "203.0.113.9",
      userAgent: "Vitest Browser",
    });
  });
});
