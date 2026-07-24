import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleOnboardingRepository } from "@/src/lib/onboarding/repository";
import { completeAdminGuide } from "@/src/lib/onboarding/service";

export async function POST(): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    const result = await completeAdminGuide(
      session.user.id,
      new DrizzleOnboardingRepository(),
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "unexpected" },
      { status: 500 },
    );
  }
}
