import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { revalidatePublicWishlistByOwner } from "@/src/lib/public-wishlist/cache";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import { deleteBankAccount } from "@/src/lib/settings/service";

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);

  try {
    const formData = await request.formData();

    if (getFormString(formData, "_method")?.toLowerCase() !== "delete") {
      return redirectWithError(requestUrl);
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", requestUrl));
    }

    const result = await deleteBankAccount(
      session.user.id,
      new DrizzleSettingsRepository(),
    );

    if (!result.ok) {
      return redirectWithError(requestUrl);
    }

    await revalidatePublicWishlistByOwner(session.user.id);

    return NextResponse.redirect(
      new URL("/admin/settings?accountDeleted=1", requestUrl),
    );
  } catch (error) {
    console.error(error);
    return redirectWithError(requestUrl);
  }
}

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectWithError(requestUrl: URL): Response {
  const url = new URL("/admin/settings", requestUrl);
  url.searchParams.set("error", "bank_account_delete_failed");
  return NextResponse.redirect(url);
}
