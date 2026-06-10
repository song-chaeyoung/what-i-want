"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyPublicLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/b/${slug}`);
      setCopied(true);
      toast.success("공개 페이지 링크를 복사했어요.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했어요. 주소를 직접 복사해주세요.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5 text-teal" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
      링크 복사
    </button>
  );
}
