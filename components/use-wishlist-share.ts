"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import {
  buildWishlistShareUrl,
  type WishlistShareSource,
} from "@/src/lib/share/share-url";

type UseWishlistShareParams = {
  slug: string;
  source: WishlistShareSource;
  title: string;
};

/**
 * 모바일에서는 네이티브 공유 시트(카카오톡 선택 가능), 그 외에는 링크 복사로 폴백한다.
 * 공유 링크에는 UTM이 붙어 유입 채널을 구분할 수 있다.
 */
export function useWishlistShare({ slug, source, title }: UseWishlistShareParams) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = buildWishlistShareUrl(window.location.origin, slug, source);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // 공유 시트를 직접 닫은 경우는 폴백 없이 조용히 끝낸다.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(PUBLIC_WISHLIST_COPY.shareSuccess);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(PUBLIC_WISHLIST_COPY.shareError);
    }
  }

  return { share, copied };
}
