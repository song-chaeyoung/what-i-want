"use client";

import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { useWishlistShare } from "@/components/use-wishlist-share";

export function PublicShareButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { share, copied } = useWishlistShare({ slug, source: "visitor", title });

  return (
    <button type="button" onClick={share} className="pub-btn h-9 px-4 text-xs">
      {copied ? PUBLIC_WISHLIST_COPY.shareCopied : PUBLIC_WISHLIST_COPY.shareCta}
    </button>
  );
}
