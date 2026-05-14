import type { WishStatus } from "@/src/lib/wish-item/status";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";

export type PublicWishlistRecord = {
  id: string;
  slug: string;
  title: string;
  themeId: PublicThemeId;
};

export type PublicWishItemRecord = {
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

export type PublicWishItemView = PublicWishItemRecord & {
  progress: number;
  isComplete: boolean;
};

export type PublicWishlistRepository = {
  findPublicWishlistBySlug(slug: string): Promise<PublicWishlistRecord | null>;
  listWishItems(wishlistId: string): Promise<PublicWishItemRecord[]>;
};
