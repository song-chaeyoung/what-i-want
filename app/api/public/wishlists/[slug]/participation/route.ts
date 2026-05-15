import { NextResponse } from "next/server";
import { DrizzlePublicParticipationRepository } from "@/src/lib/public-participation/repository";
import {
  submitPublicParticipation,
  type PublicParticipationError,
} from "@/src/lib/public-participation/service";

type PublicParticipationRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(
  request: Request,
  context: PublicParticipationRouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const requestUrl = new URL(request.url);
  const jsonRequest = isJsonRequest(request);
  const input = await readParticipationInput(request);

  const result = await submitPublicParticipation(
    {
      slug,
      ...input,
    },
    new DrizzlePublicParticipationRepository(),
  );

  if (!result.ok) {
    return jsonRequest
      ? NextResponse.json(
          { error: result.error },
          { status: getErrorStatus(result.error) },
        )
      : redirectToPublicPage(requestUrl, slug, "error", result.error);
  }

  return jsonRequest
    ? NextResponse.json({ ok: true }, { status: 201 })
    : redirectToPublicPage(requestUrl, slug, "sent", "1");
}

async function readParticipationInput(request: Request): Promise<{
  wishItemId: string;
  senderName: string | null;
  body: string | null;
  amount: string | number | null;
}> {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      wishItemId: getBodyString(body, "wishItemId") ?? "",
      senderName: getBodyString(body, "senderName"),
      body: getBodyString(body, "body"),
      amount: getBodyStringOrNumber(body, "amount"),
    };
  }

  const formData = await request.formData();
  return {
    wishItemId: getFormString(formData, "wishItemId") ?? "",
    senderName: getFormString(formData, "senderName"),
    body: getFormString(formData, "body"),
    amount: getFormString(formData, "amount"),
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

function getErrorStatus(error: PublicParticipationError): number {
  return error === "wishlist_not_found" || error === "wish_not_found"
    ? 404
    : 400;
}

function redirectToPublicPage(
  requestUrl: URL,
  slug: string,
  key: string,
  value: string,
): Response {
  const url = new URL(`/b/${slug}`, requestUrl);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}
