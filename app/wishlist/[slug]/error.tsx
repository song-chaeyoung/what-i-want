"use client";

import { useEffect } from "react";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export default function PublicWishlistError({
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
    <main className="pub-page grid min-h-dvh place-items-center px-5">
      <section className="pub-card w-full max-w-md p-6">
        <p className="pub-pill">오류</p>
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.errorTitle}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
          {PUBLIC_WISHLIST_COPY.errorDescription}
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="pub-btn mt-6 h-10 px-4 text-sm"
        >
          {PUBLIC_WISHLIST_COPY.retryCta}
        </button>
      </section>
    </main>
  );
}
