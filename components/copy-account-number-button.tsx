"use client";

import { useState } from "react";
import { toast } from "sonner";

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
      toast.success("은행과 계좌번호를 복사했어요.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("계좌번호 복사에 실패했어요.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="pub-btn h-11 px-4 text-sm"
    >
      {copied ? "복사 완료" : "계좌번호 복사"}
    </button>
  );
}
