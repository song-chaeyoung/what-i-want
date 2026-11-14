import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

export default function PublicWishlistNotFound() {
  return (
    <main className="pub-page grid min-h-dvh place-items-center px-5">
      <Card asChild variant="theme" className="w-full max-w-md p-6">
        <section>
          <Badge asChild variant="theme">
            <p>404</p>
          </Badge>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-normal text-[var(--headline)]">
            {PUBLIC_WISHLIST_COPY.notFoundTitle}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[var(--ink-muted)]">
            {PUBLIC_WISHLIST_COPY.notFoundDescription}
          </p>
          <Button asChild variant="theme" className="mt-6 h-10 px-4 text-sm">
            <Link href="/">{PUBLIC_WISHLIST_COPY.homeCta}</Link>
          </Button>
        </section>
      </Card>
    </main>
  );
}
