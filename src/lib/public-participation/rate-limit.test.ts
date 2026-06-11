import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  __resetPublicParticipationRateLimitForTests,
  checkPublicParticipationRateLimit,
} from "./rate-limit";

describe("public participation rate limit", () => {
  const originalAuthSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
    __resetPublicParticipationRateLimitForTests();
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
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
});
