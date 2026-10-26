import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("public wishlist cache contract", () => {
  test("participation and wish mutation routes invalidate the public cache", () => {
    const participation = read(
      "app/api/public/wishlists/[slug]/participation/route.ts",
    );
    expect(participation).toContain("revalidatePublicWishlist(slug)");

    const createWishes = read("app/api/admin/wishes/route.ts");
    expect(createWishes).toContain(
      "revalidatePublicWishlistByOwner(session.user.id)",
    );

    const mutateWish = read("app/api/admin/wishes/[id]/route.ts");
    // update (json + form) and delete (json + form) paths all invalidate.
    expect(
      mutateWish.match(/revalidatePublicWishlistByOwner\(session\.user\.id\)/g)
        ?.length ?? 0,
    ).toBe(4);
  });
});
