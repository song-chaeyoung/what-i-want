"use client";

import { Button } from "@/components/ui/button";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { useWishlistShare } from "@/components/use-wishlist-share";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";

export function PublicShareButton({
  slug,
  title,
  sampleTheme,
}: {
  slug: string;
  title: string;
  sampleTheme?: PublicThemeId;
}) {
  const { share, copied } = useWishlistShare({
    slug,
    source: "visitor",
    title,
    sampleTheme,
  });

  return (
    <Button type="button" onClick={share} variant="theme" className="h-9 px-4 text-xs">
      {copied ? PUBLIC_WISHLIST_COPY.shareCopied : PUBLIC_WISHLIST_COPY.shareCta}
    </Button>
  );
}
