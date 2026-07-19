import type { WishlistResetRepository } from "./types";

export type ResetWishlistResult =
  | {
      ok: true;
      slug: string;
    }
  | {
      ok: false;
      error: "wishlist_not_found";
    };

export async function resetWishlist(
  ownerId: string,
  repository: WishlistResetRepository,
): Promise<ResetWishlistResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  await repository.resetWishlistContent(wishlist.id);

  return { ok: true, slug: wishlist.slug };
}
