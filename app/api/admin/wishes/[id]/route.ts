import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { deleteWish, updateWish } from "@/src/lib/wishes/service";

type WishRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: WishRouteContext,
): Promise<Response> {
  return updateWishFromRequest(request, context, "json");
}

export async function DELETE(
  request: Request,
  context: WishRouteContext,
): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteWish(
    session.user.id,
    id,
    new DrizzleWishRepository(),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(
  request: Request,
  context: WishRouteContext,
): Promise<Response> {
  const formData = await request.formData();
  const method = getFormString(formData, "_method")?.toLowerCase();

  if (method === "delete") {
    return deleteWishFromForm(request, context);
  }

  return updateWishFromForm(request, context, formData);
}

async function updateWishFromRequest(
  request: Request,
  context: WishRouteContext,
  responseMode: "json" | "redirect",
): Promise<Response> {
  const session = await auth();
  const requestUrl = new URL(request.url);

  if (!session?.user?.id) {
    return responseMode === "json"
      ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", requestUrl));
  }

  const { id } = await context.params;
  const input = await readWishInput(request);

  const result = await updateWish(
    {
      ownerId: session.user.id,
      wishItemId: id,
      ...input,
    },
    new DrizzleWishRepository(),
  );

  if (!result.ok) {
    return responseMode === "json"
      ? NextResponse.json(
          { error: result.error },
          { status: result.error === "wish_not_found" ? 404 : 400 },
        )
      : redirectWithSearchParam(requestUrl, result.error);
  }

  return responseMode === "json"
    ? NextResponse.json({ item: result.item })
    : NextResponse.redirect(new URL("/admin/wishes?updated=1", requestUrl));
}

async function updateWishFromForm(
  request: Request,
  context: WishRouteContext,
  formData: FormData,
): Promise<Response> {
  const session = await auth();
  const requestUrl = new URL(request.url);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", requestUrl));
  }

  const { id } = await context.params;
  const result = await updateWish(
    {
      ownerId: session.user.id,
      wishItemId: id,
      title: getFormString(formData, "title"),
      description: getFormString(formData, "description"),
      targetAmount: getFormString(formData, "targetAmount"),
      productUrl: getFormString(formData, "productUrl"),
      imageUrl: getFormString(formData, "imageUrl"),
      status: getFormString(formData, "status"),
    },
    new DrizzleWishRepository(),
  );

  if (!result.ok) {
    return redirectWithSearchParam(requestUrl, result.error);
  }

  return NextResponse.redirect(new URL("/admin/wishes?updated=1", requestUrl));
}

async function deleteWishFromForm(
  request: Request,
  context: WishRouteContext,
): Promise<Response> {
  const session = await auth();
  const requestUrl = new URL(request.url);

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", requestUrl));
  }

  const { id } = await context.params;
  const result = await deleteWish(
    session.user.id,
    id,
    new DrizzleWishRepository(),
  );

  if (!result.ok) {
    return redirectWithSearchParam(requestUrl, result.error);
  }

  return NextResponse.redirect(new URL("/admin/wishes?deleted=1", requestUrl));
}

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

async function readWishInput(request: Request): Promise<{
  title: string | null;
  description: string | null;
  targetAmount: string | number | null;
  productUrl: string | null;
  imageUrl: string | null;
  status: string | null;
}> {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      title: getBodyString(body, "title"),
      description: getBodyString(body, "description"),
      targetAmount: getBodyStringOrNumber(body, "targetAmount"),
      productUrl: getBodyString(body, "productUrl"),
      imageUrl: getBodyString(body, "imageUrl"),
      status: getBodyString(body, "status"),
    };
  }

  const formData = await request.formData();
  return {
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    targetAmount: getFormString(formData, "targetAmount"),
    productUrl: getFormString(formData, "productUrl"),
    imageUrl: getFormString(formData, "imageUrl"),
    status: getFormString(formData, "status"),
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

function redirectWithSearchParam(
  requestUrl: URL,
  error: string,
): Response {
  const url = new URL("/admin/wishes", requestUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
