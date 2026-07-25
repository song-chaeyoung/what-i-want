"use client";

import { useState } from "react";
import { BookOpen, Gift, Inbox, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/wishes", label: "선물 관리", icon: Gift },
  { href: "/admin/messages", label: "메시지함", icon: Inbox },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

const adminGuideItem = {
  label: "사용 가이드",
  icon: BookOpen,
};

type AdminShellNavProps = {
  variant?: "mobile" | "desktop";
  unreadMessageCount?: number;
};

export function AdminPageTitle() {
  const pathname = usePathname();
  const activeItem = adminNavItems.find((item) =>
    isActivePath(pathname, item.href),
  );

  return <>{activeItem?.label ?? "위시리스트 관리"}</>;
}

export function AdminShellNav({
  variant = "mobile",
  unreadMessageCount = 0,
}: AdminShellNavProps) {
  const pathname = usePathname();
  // 메시지함에 들어가는 순간 서버가 읽음 처리하므로, 레이아웃이 다시 렌더링되기
  // 전까지는 클라이언트에서 뱃지를 지워 최신 상태를 유지한다. 확인한 시점의
  // 카운트를 기억해두고, 이후 서버가 더 큰 값을 내려주면(=새 메시지 도착)
  // 뱃지를 다시 띄운다.
  const [acknowledgedCount, setAcknowledgedCount] = useState<number | null>(
    null,
  );

  if (
    acknowledgedCount !== unreadMessageCount &&
    isActivePath(pathname, "/admin/messages")
  ) {
    setAcknowledgedCount(unreadMessageCount);
  }

  const visibleUnreadCount =
    acknowledgedCount !== null && unreadMessageCount <= acknowledgedCount
      ? 0
      : unreadMessageCount;

  if (variant === "desktop") {
    return (
      <nav className="hidden flex-col gap-1 md:flex">
        {adminNavItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
                isActive
                  ? "bg-white text-ink shadow-sm ring-1 ring-line"
                  : "text-zinc-600 hover:bg-white/70 hover:text-ink",
              ].join(" ")}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {item.label}
              {item.href === "/admin/messages" ? (
                <UnreadBadge count={visibleUnreadCount} />
              ) : null}
            </Link>
          );
        })}
        <AdminGuideLink variant="desktop" />
      </nav>
    );
  }

  return (
    <nav className="border-b border-line bg-[#fbfbfa] px-4 md:hidden">
      <div className="flex gap-3 overflow-x-auto">
        {adminNavItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex shrink-0 whitespace-nowrap border-b-2 px-0 py-2.5 text-[13px] font-semibold transition-colors",
                "items-center gap-1.5",
                isActive
                  ? "border-ink text-ink"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800",
              ].join(" ")}
            >
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {item.label}
              {item.href === "/admin/messages" ? (
                <UnreadBadge count={visibleUnreadCount} />
              ) : null}
            </Link>
          );
        })}
        <AdminGuideLink variant="mobile" />
      </div>
    </nav>
  );
}

function AdminGuideLink({ variant }: { variant: "mobile" | "desktop" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("guide", "1");
  const href = `${pathname}?${nextParams.toString()}`;
  const Icon = adminGuideItem.icon;

  if (variant === "desktop") {
    return (
      <Link
        href={href}
        scroll={false}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-zinc-600 transition-colors hover:bg-white/70 hover:text-ink"
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {adminGuideItem.label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-0 py-2.5 text-[13px] font-semibold text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800"
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {adminGuideItem.label}
    </Link>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-label={`새 메시지 ${count}개`}
      className="inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
