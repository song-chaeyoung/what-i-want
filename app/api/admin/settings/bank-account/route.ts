import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { revalidatePublicWishlistByOwner } from "@/src/lib/public-wishlist/cache";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import { deleteBankAccount } from "@/src/lib/settings/service";

export async function DELETE(request: Request): Promise<Response> {
  try {
    return await deleteBankAccountForSession(request, "json");
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "bank_account_delete_failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const jsonRequest = isJsonRequest(request);

  try {
    if (!jsonRequest) {
      const formData = await request.formData();

      if (getFormString(formData, "_method")?.toLowerCase() !== "delete") {
        return redirectWithError(requestUrl);
      }
    }

    return await deleteBankAccountForSession(
      request,
      jsonRequest ? "json" : "redirect",
    );
  } catch (error) {
    console.error(error);
    return jsonRequest
      ? NextResponse.json(
          { error: "bank_account_delete_failed" },
          { status: 500 },
        )
      : redirectWithError(requestUrl);
  }
}

async function deleteBankAccountForSession(
  request: Request,
  responseMode: "json" | "redirect",
): Promise<Response> {
  const session = await auth();
  const requestUrl = new URL(request.url);

  if (!session?.user?.id) {
    return responseMode === "json"
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", requestUrl));
  }

  const result = await deleteBankAccount(
    session.user.id,
    new DrizzleSettingsRepository(),
  );

  if (!result.ok) {
    return responseMode === "json"
      ? NextResponse.json({ error: result.error }, { status: 404 })
      : redirectWithError(requestUrl);
  }

  await revalidatePublicWishlistByOwner(session.user.id);

  return responseMode === "json"
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(
        new URL("/admin/settings?accountDeleted=1", requestUrl),
      );
}

function isJsonRequest(request: Request): boolean {
  return (
    request.headers.get("content-type")?.includes("application/json") ?? false
  );
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
