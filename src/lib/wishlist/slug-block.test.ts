import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  hashWithdrawnSlug,
  isWithdrawnSlugBlockActive,
  withdrawnSlugBlockedUntil,
} from "./slug-block";

const secret = "slug-block-test-secret";

describe("withdrawn slug block", () => {
  test("stores an hmac instead of the plaintext slug", () => {
    const slug = "Birthday-Wish";
    const hash = hashWithdrawnSlug(slug, secret);

    expect(hash).toBe(
      createHmac("sha256", secret).update("birthday-wish").digest("hex"),
    );
    expect(hash).not.toBe(slug);
    expect(hash).not.toBe("birthday-wish");
    expect(hash).toHaveLength(64);
  });

  test("blocks a slug until 30 days after withdrawal and then allows it", () => {
    const withdrawnAt = new Date("2026-01-01T00:00:00.000Z");
    const blockedUntil = withdrawnSlugBlockedUntil(withdrawnAt);
    const hash = hashWithdrawnSlug("birthday-wish", secret);
    const blocks = [{ slugHash: hash, blockedUntil }];

    expect(blockedUntil.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(
      isSlugBlocked(blocks, "birthday-wish", new Date("2026-01-30T23:59:59.000Z")),
    ).toBe(true);
    expect(isSlugBlocked(blocks, "birthday-wish", blockedUntil)).toBe(false);
    expect(
      isSlugBlocked(blocks, "birthday-wish", new Date("2026-02-01T00:00:00.000Z")),
    ).toBe(false);
  });

  test("allows a different slug while another slug is blocked", () => {
    const blocks = [
      {
        slugHash: hashWithdrawnSlug("birthday-wish", secret),
        blockedUntil: new Date("2026-01-31T00:00:00.000Z"),
      },
    ];

    expect(
      isSlugBlocked(blocks, "other-wish", new Date("2026-01-15T00:00:00.000Z")),
    ).toBe(false);
  });
});

function isSlugBlocked(
  blocks: Array<{ slugHash: string; blockedUntil: Date }>,
  slug: string,
  now: Date,
): boolean {
  const slugHash = hashWithdrawnSlug(slug, secret);
  return blocks.some(
    (block) =>
      block.slugHash === slugHash &&
      isWithdrawnSlugBlockActive(block.blockedUntil, now),
  );
}
