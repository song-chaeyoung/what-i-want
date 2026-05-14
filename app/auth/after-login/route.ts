import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOnboardingState } from "@/src/lib/onboarding/repository";

export async function GET(): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const state = await getOnboardingState(session.user.id);

  if (!state.isComplete) {
    redirect("/onboarding");
  }

  redirect("/admin");
}
