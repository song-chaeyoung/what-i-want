import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import { DrizzleAccountWithdrawalRepository } from "@/src/lib/account-withdrawal/repository";
import { withdrawAccount } from "@/src/lib/account-withdrawal/service";
import { revalidatePublicWishlist } from "@/src/lib/public-wishlist/cache";

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

    const result = await withdrawAccount(
      session.user.id,
      new DrizzleAccountWithdrawalRepository(),
    );

    // kakao_unlink_failed도 여기로 온다. 그 경우 서비스가 users 행을 지우지 않았다.
    if (!result.ok) {
      return redirectWithError(requestUrl);
    }

    if (result.wishlistSlug) {
      revalidatePublicWishlist(result.wishlistSlug);
    }

    // 계정은 이미 지워졌다. signOut이 redirect가 아닌 오류를 내도 실패로 안내하지 않는다.
    try {
      await signOut({ redirectTo: "/?withdrawn=1" });
    } catch (error) {
      if (isNextRedirect(error)) {
        throw error;
      }

      console.error(error);
    }

    return NextResponse.redirect(new URL("/?withdrawn=1", requestUrl));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

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
  url.searchParams.set("error", "withdraw_failed");
  return NextResponse.redirect(url);
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}
