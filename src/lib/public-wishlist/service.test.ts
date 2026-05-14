import { describe, expect, test } from "vitest";
import { getPublicWishlist } from "./service";
import type {
  PublicWishItemRecord,
  PublicWishlistRecord,
  PublicWishlistRepository,
} from "./types";

class FakePublicWishlistRepository implements PublicWishlistRepository {
  wishlist: PublicWishlistRecord | null = {
    id: "wishlist-1",
    slug: "birthday",
    title: "Birthday wishlist",
    themeId: "pixel_y2k",
  };
  items: PublicWishItemRecord[] = [];
  requestedSlugs: string[] = [];

  async findPublicWishlistBySlug(
    slug: string,
  ): Promise<PublicWishlistRecord | null> {
    this.requestedSlugs.push(slug);
    return this.wishlist?.slug === slug ? this.wishlist : null;
  }

  async listWishItems(): Promise<PublicWishItemRecord[]> {
    return this.items;
  }
}

describe("public wishlist service", () => {
  test("rejects invalid slugs before querying the repository", async () => {
    const repository = new FakePublicWishlistRepository();

    const result = await getPublicWishlist("NO SPACE", repository);

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(repository.requestedSlugs).toEqual([]);
  });

  test("looks up public wishlists by normalized slug", async () => {
    const repository = new FakePublicWishlistRepository();
    repository.items = [makeWishItem({ id: "wish-1", title: "Keyboard" })];

    const result = await getPublicWishlist("  BIRTHDAY  ", repository);

    expect(repository.requestedSlugs).toEqual(["birthday"]);
    expect(result).toMatchObject({
      ok: true,
      wishlist: repository.wishlist,
      items: [
        {
          id: "wish-1",
          title: "Keyboard",
          progress: 0,
          isComplete: false,
        },
      ],
    });
  });

  test("returns not found when the wishlist is not public or does not exist", async () => {
    const repository = new FakePublicWishlistRepository();
    repository.wishlist = null;

    const result = await getPublicWishlist("birthday", repository);

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  test("excludes hidden wishes from the public result", async () => {
    const repository = new FakePublicWishlistRepository();
    repository.items = [
      makeWishItem({ id: "wish-1", title: "Visible", status: "open" }),
      makeWishItem({ id: "wish-2", title: "Hidden", status: "hidden" }),
    ];

    const result = await getPublicWishlist("birthday", repository);

    expect(result).toMatchObject({
      ok: true,
      items: [{ id: "wish-1", title: "Visible" }],
    });
  });

  test("calculates progress and complete state for visible wishes", async () => {
    const repository = new FakePublicWishlistRepository();
    repository.items = [
      makeWishItem({
        id: "wish-1",
        fundedAmount: 25000,
        targetAmount: 100000,
        status: "open",
      }),
      makeWishItem({
        id: "wish-2",
        fundedAmount: 150000,
        targetAmount: 100000,
        status: "open",
      }),
      makeWishItem({
        id: "wish-3",
        fundedAmount: 0,
        targetAmount: null,
        status: "fulfilled",
      }),
    ];

    const result = await getPublicWishlist("birthday", repository);

    expect(result).toMatchObject({
      ok: true,
      items: [
        { id: "wish-1", progress: 25, isComplete: false },
        { id: "wish-2", progress: 100, isComplete: true },
        { id: "wish-3", progress: 0, isComplete: true },
      ],
    });
  });
});

function makeWishItem(
  overrides: Partial<PublicWishItemRecord> & { id?: string },
): PublicWishItemRecord {
  return {
    id: overrides.id ?? "wish-1",
    wishlistId: overrides.wishlistId ?? "wishlist-1",
    title: overrides.title ?? "Keyboard",
    description: overrides.description ?? null,
    targetAmount: overrides.targetAmount ?? null,
    fundedAmount: overrides.fundedAmount ?? 0,
    productUrl: overrides.productUrl ?? null,
    imageUrl: overrides.imageUrl ?? null,
    status: overrides.status ?? "open",
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? new Date("2026-05-14T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-05-14T00:00:00.000Z"),
  };
}
