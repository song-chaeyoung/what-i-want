"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5 text-[#171717]">
      <section className="w-full max-w-md space-y-4 border-2 border-[#171717] bg-[#fffdf7] p-6 shadow-pixel-xs">
        <p className="sticker-label">오류</p>
        <h1 className="font-pixel text-2xl leading-tight text-[#4c1d95]">
          잠시 문제가 생겼어요
        </h1>
        <p className="text-sm font-semibold leading-6 text-[#4b5563]">
          일시적인 오류예요. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="cta" onClick={() => unstable_retry()}>
            다시 시도
          </Button>
          <Button asChild variant="cta" className="bg-white text-ink hover:bg-mint">
            <Link href="/">처음으로</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
