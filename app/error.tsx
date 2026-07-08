"use client";

import { useEffect } from "react";
import Link from "next/link";

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
      <section className="w-full max-w-md space-y-4 rounded-md border-2 border-[#171717] bg-white p-6">
        <p className="sticker-label">오류</p>
        <h1 className="font-pixel text-2xl leading-tight text-[#4c1d95]">
          잠시 문제가 생겼어요
        </h1>
        <p className="text-sm font-semibold leading-6 text-[#4b5563]">
          일시적인 오류예요. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex min-h-12 items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0f766e]"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-md border-2 border-[#171717] bg-white px-5 py-3 text-sm font-black transition-colors hover:bg-[#ccfbf1]"
          >
            처음으로
          </Link>
        </div>
      </section>
    </main>
  );
}
