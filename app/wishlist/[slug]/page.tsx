import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublicWishlistView } from "@/components/public-wishlist-view";
import { PublicWishlistToastEvents } from "@/components/public-wishlist-toast-events";
import { DrizzlePublicWishlistRepository } from "@/src/lib/public-wishlist/repository";
import { getPublicWishlist } from "@/src/lib/public-wishlist/service";

type PublicWishlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicWishlistPage({
  params,
}: PublicWishlistPageProps) {
  const { slug } = await params;
  const result = await getPublicWishlist(
    slug,
    new DrizzlePublicWishlistRepository(),
  );

  if (!result.ok) {
    notFound();
  }

  return (
    <PublicWishlistView
      wishlist={result.wishlist}
      items={result.items}
      account={result.account}
    >
      <Suspense fallback={null}>
        <PublicWishlistToastEvents account={result.account} />
      </Suspense>
    </PublicWishlistView>
  );
}
