import { describe, expect, test } from "vitest";
import { resetWishlist } from "./service";
import type {
  WishlistResetRepository,
  WishlistResetWishlistRecord,
} from "./types";

class FakeWishlistResetRepository implements WishlistResetRepository {
  wishlist: WishlistResetWishlistRecord | null = {
    id: "wishlist-1",
    slug: "birthday",
  };
  requestedOwnerIds: string[] = [];
  resetWishlistIds: string[] = [];

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<WishlistResetWishlistRecord | null> {
    this.requestedOwnerIds.push(ownerId);
    return this.wishlist;
  }

  async resetWishlistContent(wishlistId: string): Promise<void> {
    this.resetWishlistIds.push(wishlistId);
  }
}

describe("wishlist reset service", () => {
  test("resets the owner's wishlist content and returns the slug", async () => {
    const repository = new FakeWishlistResetRepository();

    const result = await resetWishlist("user-1", repository);

    expect(result).toEqual({ ok: true, slug: "birthday" });
    expect(repository.requestedOwnerIds).toEqual(["user-1"]);
    expect(repository.resetWishlistIds).toEqual(["wishlist-1"]);
  });

  test("returns wishlist_not_found without resetting when onboarding is incomplete", async () => {
    const repository = new FakeWishlistResetRepository();
    repository.wishlist = null;

    const result = await resetWishlist("user-1", repository);

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.resetWishlistIds).toEqual([]);
  });
});
