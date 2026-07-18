import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("public wishlist cache contract", () => {
  test("caches the public wishlist read behind an on-demand revalidatable tag", () => {
    const source = read("src/lib/public-wishlist/cache.ts");

    expect(source).toContain(
      'import { revalidateTag, unstable_cache } from "next/cache";',
    );
    expect(source).toContain("unstable_cache(");
    expect(source).toContain("getPublicWishlist(slug");
    expect(source).toContain("tags: [publicWishlistTag(slug)]");
    // `{ expire: 0 }` keeps funding/edits visible immediately instead of
    // serving stale-while-revalidate content on the next visit.
    expect(source).toContain(
      "revalidateTag(publicWishlistTag(slug), { expire: 0 })",
    );
  });

  test("invalidates the public wishlist cache from every mutation route", () => {
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

    const settings = read("app/api/admin/settings/route.ts");
    expect(settings).toContain(
      "revalidatePublicWishlistByOwner(session.user.id)",
    );
  });
});
