"use client";

import { Check, Share2 } from "lucide-react";
import { ADMIN_COPY, BRAND_NAME, PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import type { WishlistVisibility } from "@/src/lib/settings/types";
import { useWishlistShare } from "@/components/use-wishlist-share";

export function PrivateShareNotice({
  visibility,
}: {
  visibility: WishlistVisibility;
}) {
  if (visibility !== "private") {
    return null;
  }

  return (
    <p className="mt-1 text-xs font-semibold text-zinc-500">
      {ADMIN_COPY.privateShareNotice}
    </p>
  );
}

export function SharePublicLinkButton({ slug }: { slug: string }) {
  const { share, copied } = useWishlistShare({
    slug,
    source: "owner",
    title: `${BRAND_NAME} 생일 위시리스트`,
  });

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5 text-teal" />
      ) : (
        <Share2 aria-hidden="true" className="size-3.5" />
      )}
      {copied ? PUBLIC_WISHLIST_COPY.shareCopied : PUBLIC_WISHLIST_COPY.shareCta}
    </button>
  );
}
