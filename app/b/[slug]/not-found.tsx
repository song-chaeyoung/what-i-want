import Link from "next/link";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export default function PublicWishlistNotFound() {
  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5 text-[#171717]">
      <section className="pixel-board w-full max-w-md bg-white p-6">
        <p className="sticker-label">404</p>
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal text-[#4c1d95]">
          {PUBLIC_WISHLIST_COPY.notFoundTitle}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#4b5563]">
          {PUBLIC_WISHLIST_COPY.notFoundDescription}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-4 text-sm font-black text-white transition-colors hover:bg-[#0f766e]"
        >
          {PUBLIC_WISHLIST_COPY.homeCta}
        </Link>
      </section>
    </main>
  );
}
