import Link from "next/link";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export default function PublicWishlistNotFound() {
  return (
    <main className="pub-page grid min-h-dvh place-items-center px-5">
      <section className="pub-card w-full max-w-md p-6">
        <p className="pub-pill">404</p>
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.notFoundTitle}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
          {PUBLIC_WISHLIST_COPY.notFoundDescription}
        </p>
        <Link
          href="/"
          className="pub-btn mt-6 h-10 px-4 text-sm"
        >
          {PUBLIC_WISHLIST_COPY.homeCta}
        </Link>
      </section>
    </main>
  );
}
