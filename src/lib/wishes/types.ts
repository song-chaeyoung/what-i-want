import type { WishStatus } from "@/src/lib/wish-item/status";

export type WishlistRecord = {
  id: string;
  slug: string;
  title: string;
};

export type WishItemRecord = {
  id: string;
  wishlistId: string;
  title: string;
  description: string | null;
  targetAmount: number | null;
  fundedAmount: number;
  productUrl: string | null;
  imageUrl: string | null;
  status: WishStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWishRecord = {
  wishlistId: string;
  title: string;
  description: string | null;
  targetAmount: number | null;
  productUrl: string | null;
  imageUrl: string | null;
  status: WishStatus;
};

export type UpdateWishRecord = {
  title: string;
  description: string | null;
  targetAmount: number | null;
  productUrl: string | null;
  imageUrl: string | null;
  status: WishStatus;
};

export interface WishRepository {
  findWishlistByOwnerId(ownerId: string): Promise<WishlistRecord | null>;
  listWishItems(wishlistId: string): Promise<WishItemRecord[]>;
  createWishItem(record: CreateWishRecord): Promise<WishItemRecord>;
  updateWishItem(
    ownerId: string,
    wishItemId: string,
    record: UpdateWishRecord,
  ): Promise<WishItemRecord | null>;
  deleteWishItem(ownerId: string, wishItemId: string): Promise<boolean>;
}
