"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export function PublicShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}`;

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

  return (
    <button
      type="button"
      onClick={handleShare}
      className="pub-btn h-9 px-4 text-xs"
    >
      {copied ? PUBLIC_WISHLIST_COPY.shareCopied : PUBLIC_WISHLIST_COPY.shareCta}
    </button>
  );
}
