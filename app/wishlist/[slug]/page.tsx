import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicWishlistView } from "@/components/public-wishlist-view";
import { PublicWishlistToastEvents } from "@/components/public-wishlist-toast-events";
import { BRAND_NAME, PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { getCachedPublicWishlist } from "@/src/lib/public-wishlist/cache";

type PublicWishlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicWishlistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCachedPublicWishlist(slug);

  if (!result.ok) {
    return { title: PUBLIC_WISHLIST_COPY.notFoundTitle };
  }

  const { title } = result.wishlist;
  const description = PUBLIC_WISHLIST_COPY.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: BRAND_NAME,
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicWishlistPage({
  params,
}: PublicWishlistPageProps) {
  const { slug } = await params;
  const result = await getCachedPublicWishlist(slug);

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
