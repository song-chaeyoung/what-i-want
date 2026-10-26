import { revalidateTag, unstable_cache } from "next/cache";
import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { DrizzlePublicWishlistRepository } from "./repository";
import { getPublicWishlist, type PublicWishlistResult } from "./service";

const PUBLIC_WISHLIST_REVALIDATE_SECONDS = 300;

function publicWishlistTag(slug: string): string {
  return `public-wishlist:${slug}`;
}

export async function getCachedPublicWishlist(
  slug: string,
): Promise<PublicWishlistResult> {
  const parsedSlug = parseWishlistSlug(slug);

  if (!parsedSlug.ok) {
    return { ok: false, error: "not_found" };
  }

  const canonicalSlug = parsedSlug.value;

  return unstable_cache(
    () => getPublicWishlist(canonicalSlug, new DrizzlePublicWishlistRepository()),
    // Data Cache survives deployments; do not reuse entries keyed by raw slugs.
    ["public-wishlist-v2", canonicalSlug],
    {
      tags: [publicWishlistTag(canonicalSlug)],
      revalidate: PUBLIC_WISHLIST_REVALIDATE_SECONDS,
    },
  )();
}

export function revalidatePublicWishlist(slug: string): void {
  const parsedSlug = parseWishlistSlug(slug);

  if (!parsedSlug.ok) {
    return;
  }

  // `{ expire: 0 }` expires the entry immediately so the next visit (e.g. the
  // redirect back to the public page after funding) is a fresh, blocking read
  // rather than stale-while-revalidate. This keeps funding/edits visible at once.
  revalidateTag(publicWishlistTag(parsedSlug.value), { expire: 0 });
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
