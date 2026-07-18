import { revalidateTag, unstable_cache } from "next/cache";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { DrizzlePublicWishlistRepository } from "./repository";
import { getPublicWishlist, type PublicWishlistResult } from "./service";

const PUBLIC_WISHLIST_REVALIDATE_SECONDS = 300;

function publicWishlistTag(slug: string): string {
  return `public-wishlist:${slug}`;
}

export function getCachedPublicWishlist(
  slug: string,
): Promise<PublicWishlistResult> {
  return unstable_cache(
    () => getPublicWishlist(slug, new DrizzlePublicWishlistRepository()),
    ["public-wishlist", slug],
    {
      tags: [publicWishlistTag(slug)],
      revalidate: PUBLIC_WISHLIST_REVALIDATE_SECONDS,
    },
  )();
}

export function revalidatePublicWishlist(slug: string): void {
  // `{ expire: 0 }` expires the entry immediately so the next visit (e.g. the
  // redirect back to the public page after funding) is a fresh, blocking read
  // rather than stale-while-revalidate. This keeps funding/edits visible at once.
  revalidateTag(publicWishlistTag(slug), { expire: 0 });
}

export async function revalidatePublicWishlistByOwner(
  ownerId: string,
): Promise<void> {
  const wishlist = await new DrizzleWishRepository().findWishlistByOwnerId(
    ownerId,
  );

  if (wishlist) {
    revalidatePublicWishlist(wishlist.slug);
  }
}
