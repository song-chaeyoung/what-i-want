import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { revalidatePublicWishlist } from "@/src/lib/public-wishlist/cache";
import { DrizzleWishlistResetRepository } from "@/src/lib/wishlist-reset/repository";
import { resetWishlist } from "@/src/lib/wishlist-reset/service";

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", requestUrl));
    }

    const result = await resetWishlist(
      session.user.id,
      new DrizzleWishlistResetRepository(),
    );

    if (!result.ok) {
      return NextResponse.redirect(
        new URL("/admin/settings?error=1", requestUrl),
      );
    }

    revalidatePublicWishlist(result.slug);

    return NextResponse.redirect(
      new URL("/admin/settings?wishlistReset=1", requestUrl),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=1", requestUrl),
    );
  }
}
