import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeOnboarding } from "@/src/lib/onboarding/service";
import { DrizzleOnboardingRepository } from "@/src/lib/onboarding/repository";

export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", requestUrl));
    }

    const formData = await request.formData();
    const repository = new DrizzleOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: session.user.id,
        displayName: getFormString(formData, "displayName"),
        birthday: getOptionalFormString(formData, "birthday"),
        description: getOptionalFormString(formData, "description"),
      },
      repository,
    );

    if (!result.ok) {
      return redirectWithError(requestUrl, result.error);
    }

    return NextResponse.redirect(new URL("/admin", requestUrl));
  } catch (error) {
    console.error(error);
    return redirectWithError(requestUrl, "unexpected");
  }
}

function redirectWithError(requestUrl: URL, error: string): Response {
  const errorUrl = new URL("/onboarding", requestUrl);
  errorUrl.searchParams.set("error", error);
  return NextResponse.redirect(errorUrl);
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalFormString(formData: FormData, key: string): string | null {
  const value = getFormString(formData, key).trim();
  return value.length > 0 ? value : null;
}
