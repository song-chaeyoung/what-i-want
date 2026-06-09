import { Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminToastEvents } from "./admin-toast-events";
import { AdminShellNav } from "./admin-shell-nav";
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
    <div className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800">
      <aside className="hidden w-[220px] flex-none border-r border-line bg-[#fbfbfa] px-4 py-[22px] md:block">
        <div className="px-1.5 pb-5">
          <p className="text-[11px] font-bold uppercase text-teal">{BRAND_NAME}</p>
          <h1 className="mt-1 text-[15px] font-extrabold text-ink">
            위시리스트 관리
          </h1>
        </div>

        <AdminShellNav variant="desktop" />

        <div className="mt-6 rounded-md border border-line bg-[#fafaf9] p-3">
          <div className="text-[11px] font-semibold text-zinc-500">계정</div>
          <p className="mt-1.5 break-all text-xs font-medium text-zinc-600">
            {user.email}
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-12 items-center gap-3 border-b border-line bg-white/90 px-4 py-2 shadow-[0_1px_0_rgba(24,24,27,0.02)] backdrop-blur sm:px-7 sm:py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-extrabold tracking-normal text-ink sm:text-[16px]">
              위시리스트 관리
            </div>
            <div className="mt-0.5 hidden max-w-none truncate text-[12.5px] text-zinc-400 sm:block">
              {user.email}
            </div>
          </div>
          {state.wishlistSlug ? (
            <Link
              href={`/b/${state.wishlistSlug}`}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-line bg-[#fbfbfa] px-3 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 sm:h-9 sm:text-sm"
            >
              공개 페이지 보기
            </Link>
          ) : null}
        </header>

        <AdminShellNav />

        <Suspense fallback={null}>
          <AdminToastEvents />
        </Suspense>

        <div className="w-full px-4 py-4 sm:px-7 sm:py-6">{children}</div>
      </main>
    </div>
  );
}
