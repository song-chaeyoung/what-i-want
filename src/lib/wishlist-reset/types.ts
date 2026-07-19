export type WishlistResetWishlistRecord = {
  id: string;
  slug: string;
};

export type WishlistResetRepository = {
  findWishlistByOwnerId(
    ownerId: string,
  ): Promise<WishlistResetWishlistRecord | null>;
  resetWishlistContent(wishlistId: string): Promise<void>;
};
