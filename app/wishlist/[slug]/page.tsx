import { notFound } from "next/navigation";
import { PublicWishlistView } from "@/components/public-wishlist-view";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { DrizzlePublicWishlistRepository } from "@/src/lib/public-wishlist/repository";
import { getPublicWishlist } from "@/src/lib/public-wishlist/service";

type PublicWishlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function PublicWishlistPage({
  params,
  searchParams,
}: PublicWishlistPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
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
      sent={query.sent ?? null}
      errorMessage={query.error ? getParticipationErrorMessage(query.error) : null}
    />
  );
}

function getParticipationErrorMessage(error: string): string {
  return (
    PUBLIC_WISHLIST_COPY.participationErrors[
      error as keyof typeof PUBLIC_WISHLIST_COPY.participationErrors
    ] ?? PUBLIC_WISHLIST_COPY.participationErrors.wishlist_not_found
  );
}
