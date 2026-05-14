import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { BRAND_NAME } from "@/src/lib/design/copy";
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
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d1d5db] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#0f766e]">{BRAND_NAME}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">
              위시리스트 관리
            </h1>
          </div>
          <p className="text-sm text-[#4b5563]">{user.email}</p>
        </header>
        <nav className="flex flex-wrap gap-2 border-b border-[#e5e7eb] py-4">
          <Link
            href="/admin"
            className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm font-semibold transition-colors hover:border-[#0f766e]"
          >
            대시보드
          </Link>
          <Link
            href="/admin/wishes"
            className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm font-semibold transition-colors hover:border-[#0f766e]"
          >
            선물 관리
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
