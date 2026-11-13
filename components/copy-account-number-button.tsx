"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export function CopyAccountNumberButton({
  bankName,
  accountNumber,
}: {
  bankName: string;
  accountNumber: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${bankName} ${accountNumber}`);
      setCopied(true);
      toast.success(PUBLIC_WISHLIST_COPY.accountCopySuccess);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(PUBLIC_WISHLIST_COPY.accountCopyError);
    }
  }

  return (
    <Button
      type="button"
      data-account-copy=""
      onClick={handleCopy}
      variant="theme"
      className="h-11 px-4 text-sm"
    >
      {copied
        ? PUBLIC_WISHLIST_COPY.accountCopyCopied
        : PUBLIC_WISHLIST_COPY.accountCopyLabel}
    </Button>
  );
}
