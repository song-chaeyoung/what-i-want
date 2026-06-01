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
    <div className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800">
      <aside className="hidden w-[220px] flex-none border-r border-line bg-white px-4 py-[22px] md:block">
        <div className="px-1.5 pb-[22px]">
          <p className="text-[11px] font-bold uppercase text-teal">{BRAND_NAME}</p>
          <h1 className="mt-1 text-[15px] font-extrabold text-ink">
            위시리스트 관리
          </h1>
        </div>

        <nav className="flex flex-col gap-0.5">
          <AdminNavLink href="/admin" label="대시보드" eng="Dashboard" />
          <AdminNavLink href="/admin/wishes" label="선물 관리" eng="Gifts" />
          <AdminNavLink href="/admin/messages" label="메시지함" eng="Messages" />
          <AdminNavLink href="/admin/settings" label="설정" eng="Settings" />
        </nav>

        <div className="mt-6 rounded-md border border-line bg-[#fafaf9] p-3">
          <div className="text-[11px] font-semibold text-zinc-500">계정</div>
          <p className="mt-1.5 break-all text-xs font-medium text-zinc-600">
            {user.email}
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-5 sm:px-7">
          <div>
            <div className="text-lg font-extrabold tracking-normal text-ink">
              위시리스트 관리
            </div>
            <div className="mt-0.5 text-[12.5px] text-zinc-500">{user.email}</div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-5 py-3 md:hidden">
          <MobileAdminNavLink href="/admin">대시보드</MobileAdminNavLink>
          <MobileAdminNavLink href="/admin/wishes">선물 관리</MobileAdminNavLink>
          <MobileAdminNavLink href="/admin/messages">메시지함</MobileAdminNavLink>
          <MobileAdminNavLink href="/admin/settings">설정</MobileAdminNavLink>
        </nav>

        <div className="w-full px-5 py-6 sm:px-7">{children}</div>
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  eng,
}: {
  href: string;
  label: string;
  eng: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="text-[13.5px] font-semibold text-zinc-700">{label}</span>
      <span className="mt-0.5 text-[9px] font-bold uppercase text-zinc-400">
        {eng}
      </span>
    </Link>
  );
}

function MobileAdminNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
    >
      {children}
    </Link>
  );
}
