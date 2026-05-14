import { isWishComplete } from "@/src/lib/wish-item/status";
import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import type {
  PublicWishlistRecord,
  PublicWishlistRepository,
  PublicWishItemRecord,
  PublicWishItemView,
} from "./types";

export type PublicWishlistResult =
  | {
      ok: true;
      wishlist: PublicWishlistRecord;
      items: PublicWishItemView[];
    }
  | {
      ok: false;
      error: "not_found";
    };

export async function getPublicWishlist(
  slug: string,
  repository: PublicWishlistRepository,
): Promise<PublicWishlistResult> {
  const parsedSlug = parseWishlistSlug(slug);

  if (!parsedSlug.ok) {
    return { ok: false, error: "not_found" };
  }

  const wishlist = await repository.findPublicWishlistBySlug(parsedSlug.value);

  if (!wishlist) {
    return { ok: false, error: "not_found" };
  }

  const items = await repository.listWishItems(wishlist.id);

  return {
    ok: true,
    wishlist,
    items: items.filter(isPublicWish).map(toPublicWishItemView),
  };
}

function isPublicWish(item: PublicWishItemRecord): boolean {
  return item.status !== "hidden";
}

function toPublicWishItemView(item: PublicWishItemRecord): PublicWishItemView {
  const progress = calculateProgress(item);

  return {
    ...item,
    progress,
    isComplete: isWishComplete(item.status, progress),
  };
}

function calculateProgress(item: PublicWishItemRecord): number {
  if (!item.targetAmount || item.targetAmount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.floor((item.fundedAmount / item.targetAmount) * 100),
  );
}
