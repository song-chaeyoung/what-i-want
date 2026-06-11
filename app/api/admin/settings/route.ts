import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import {
  getSettings,
  updateSettings,
  type UpdateSettingsInput,
} from "@/src/lib/settings/service";

export async function GET(): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getSettings(
    session.user.id,
    new DrizzleSettingsRepository(),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ settings: result.settings });
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

  const input = await readSettingsInput(request, session.user.id);
  const result = await updateSettings(
    input,
    new DrizzleSettingsRepository(),
  );

  if (!result.ok) {
    return jsonRequest
      ? NextResponse.json(
          { error: result.error },
          { status: result.error === "settings_not_found" ? 404 : 400 },
        )
      : redirectWithError(requestUrl, result.error);
  }

  return jsonRequest
    ? NextResponse.json({ settings: result.settings })
    : NextResponse.redirect(new URL("/admin/settings?saved=1", requestUrl));
}

async function readSettingsInput(
  request: Request,
  ownerId: string,
): Promise<UpdateSettingsInput> {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      ownerId,
      displayName: getBodyString(body, "displayName"),
      description: getBodyString(body, "description"),
      birthday: getBodyString(body, "birthday"),
      wishlistSlug: getBodyString(body, "wishlistSlug"),
      wishlistTitle: getBodyString(body, "wishlistTitle"),
      themeId: getBodyString(body, "themeId"),
      bankName: getBodyString(body, "bankName"),
      accountHolder: getBodyString(body, "accountHolder"),
      accountNumber: getBodyString(body, "accountNumber"),
    };
  }

  const formData = await request.formData();
  return {
    ownerId,
    displayName: getFormString(formData, "displayName"),
    description: getFormString(formData, "description"),
    birthday: getFormString(formData, "birthday"),
    wishlistSlug: getFormString(formData, "wishlistSlug"),
    wishlistTitle: getFormString(formData, "wishlistTitle"),
    themeId: getFormString(formData, "themeId"),
    bankName: getFormString(formData, "bankName"),
    accountHolder: getFormString(formData, "accountHolder"),
    accountNumber: getFormString(formData, "accountNumber"),
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

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectWithError(requestUrl: URL, error: string): Response {
  const url = new URL("/admin/settings", requestUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
