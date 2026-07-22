import { Suspense } from "react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminToastEvents } from "./admin-toast-events";
import { AdminPageTitle, AdminShellNav } from "./admin-shell-nav";
import AdminLoading from "./loading";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import { countUnreadAdminMessages } from "@/src/lib/admin-messages/service";
import { requireUser } from "@/src/lib/auth/require-user";
import { BRAND_NAME } from "@/src/lib/design/copy";
import { getOnboardingState } from "@/src/lib/onboarding/repository";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: AdminLayoutProps) {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (!state.isComplete) {
    redirect("/onboarding");
  }

  const unreadResult = await countUnreadAdminMessages(
    user.id,
    new DrizzleAdminMessagesRepository(),
  );
  const unreadMessageCount = unreadResult.ok ? unreadResult.count : 0;

  return (
    <div className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800">
      <aside className="hidden w-[220px] flex-none border-r border-line bg-[#fbfbfa] px-4 py-[22px] md:block">
        <div className="px-1.5 pb-5">
          <Link
            href="/"
            aria-label={`${BRAND_NAME} 홈`}
            className="flex items-center gap-1.5"
          >
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
            <span className="font-pixel text-base leading-none tracking-normal text-zinc-700">
              {BRAND_NAME}
            </span>
          </Link>
          <h1 className="mt-1 text-xs font-medium text-zinc-400">
            위시리스트 관리
          </h1>
        </div>

        <AdminShellNav
          variant="desktop"
          unreadMessageCount={unreadMessageCount}
        />

        <div className="mt-6 border-t border-line px-1.5 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500">계정</div>
          <p className="mt-1.5 break-all text-xs font-medium text-zinc-600">
            {user.email}
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-12 items-center gap-3 border-b border-line bg-white/90 px-4 py-2 shadow-[0_1px_0_rgba(24,24,27,0.02)] backdrop-blur sm:px-7 sm:py-3">
          <Link
            href="/"
            aria-label={`${BRAND_NAME} 홈`}
            className="flex shrink-0 items-center gap-1.5 md:hidden"
          >
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
            <span className="font-pixel text-base leading-none tracking-normal text-zinc-700">
              {BRAND_NAME}
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="hidden truncate text-[14px] font-extrabold tracking-normal text-ink sm:text-[16px] md:block">
              <AdminPageTitle />
            </div>
          </div>
          {state.wishlistSlug ? (
            <Link
              href={`/wishlist/${state.wishlistSlug}`}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-line bg-[#fbfbfa] px-3 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 sm:h-9 sm:text-sm"
            >
              공개 페이지 보기
            </Link>
          ) : null}
        </header>

        <AdminShellNav unreadMessageCount={unreadMessageCount} />

        <Suspense fallback={null}>
          <AdminToastEvents />
        </Suspense>

        <div className="w-full px-4 py-4 sm:px-7 sm:py-6">{children}</div>
      </main>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800">
      <aside className="hidden w-[220px] flex-none border-r border-line bg-[#fbfbfa] px-4 py-[22px] md:block">
        <div className="px-1.5 pb-5">
          <Link
            href="/"
            aria-label={`${BRAND_NAME} 홈`}
            className="flex items-center gap-1.5"
          >
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
            <span className="font-pixel text-base leading-none tracking-normal text-zinc-700">
              {BRAND_NAME}
            </span>
          </Link>
          <h1 className="mt-1 text-xs font-medium text-zinc-400">
            위시리스트 관리
          </h1>
        </div>

        <AdminShellNav variant="desktop" />

        <div className="mt-6 border-t border-line px-1.5 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500">계정</div>
          <div className="mt-1.5 h-3 w-32 animate-pulse rounded bg-zinc-200" />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-12 items-center gap-3 border-b border-line bg-white/90 px-4 py-2 shadow-[0_1px_0_rgba(24,24,27,0.02)] backdrop-blur sm:px-7 sm:py-3">
          <Link
            href="/"
            aria-label={`${BRAND_NAME} 홈`}
            className="flex shrink-0 items-center gap-1.5 md:hidden"
          >
            <Image
              src="/logo.png"
              alt=""
              width={20}
              height={20}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
            <span className="font-pixel text-base leading-none tracking-normal text-zinc-700">
              {BRAND_NAME}
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="hidden truncate text-[14px] font-extrabold tracking-normal text-ink sm:text-[16px] md:block">
              <AdminPageTitle />
            </div>
          </div>
        </header>

        <AdminShellNav />

        <div className="w-full px-4 py-4 sm:px-7 sm:py-6">
          <AdminLoading />
        </div>
      </main>
    </div>
  );
}
