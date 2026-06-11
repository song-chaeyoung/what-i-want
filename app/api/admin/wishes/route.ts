import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import { getSettings } from "@/src/lib/settings/service";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { createWish, listWishes } from "@/src/lib/wishes/service";

export async function GET(): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await listWishes(
    session.user.id,
    new DrizzleWishRepository(),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    wishlist: result.wishlist,
    items: result.items,
  });
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  const requestUrl = new URL(request.url);
  const jsonRequest = isJsonRequest(request);

  if (!session?.user?.id) {
    return jsonRequest
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", requestUrl));
  }

  const input = await readWishInput(request);
  const wishRepository = new DrizzleWishRepository();
  const result = await createWish(
    {
      ownerId: session.user.id,
      ...input,
    },
    wishRepository,
  );

  if (!result.ok) {
    return jsonRequest
      ? NextResponse.json(
          { error: result.error },
          { status: result.error === "wishlist_not_found" ? 404 : 400 },
        )
      : redirectWithSearchParam(requestUrl, result.error);
  }

  return jsonRequest
    ? NextResponse.json({ item: result.item }, { status: 201 })
    : NextResponse.redirect(
        await getCreateWishRedirectUrl(requestUrl, session.user.id),
      );
}

async function readWishInput(request: Request): Promise<{
  title: string | null;
  description: string | null;
  targetAmount: string | number | null;
  productUrl: string | null;
  imageUrl: string | null;
}> {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      title: getBodyString(body, "title"),
      description: getBodyString(body, "description"),
      targetAmount: getBodyStringOrNumber(body, "targetAmount"),
      productUrl: getBodyString(body, "productUrl"),
      imageUrl: getBodyString(body, "imageUrl"),
    };
  }

  const formData = await request.formData();
  return {
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    targetAmount: getFormString(formData, "targetAmount"),
    productUrl: getFormString(formData, "productUrl"),
    imageUrl: getFormString(formData, "imageUrl"),
  };
}

function isJsonRequest(request: Request): boolean {
  return request.headers.get("content-type")?.includes("application/json") ??
    false;
}

function getBodyString(
  body: Record<string, unknown>,
  key: string,
): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

function getBodyStringOrNumber(
  body: Record<string, unknown>,
  key: string,
): string | number | null {
  const value = body[key];
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectWithSearchParam(
  requestUrl: URL,
  error: string,
): Response {
  const url = new URL("/admin/wishes", requestUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

async function getCreateWishRedirectUrl(
  requestUrl: URL,
  ownerId: string,
): Promise<URL> {
  const url = new URL("/admin/wishes", requestUrl);
  url.searchParams.set("created", "1");

  const settingsResult = await getSettings(
    ownerId,
    new DrizzleSettingsRepository(),
  );

  if (!settingsResult.ok || !settingsResult.settings.bankAccount) {
    url.searchParams.set("missingAccount", "1");
  }

  return url;
}
