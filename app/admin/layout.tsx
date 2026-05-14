import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { getOnboardingState } from "@/src/lib/onboarding/repository";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (!state.isComplete) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-dvh bg-[#f7f5f0] text-[#171717]">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10">
        <header className="flex flex-col gap-3 border-b border-[#d1d5db] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0f766e]">
              뭐갖고싶어
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">
              위시리스트 관리
            </h1>
          </div>
          <p className="text-sm text-[#4b5563]">{user.email}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
