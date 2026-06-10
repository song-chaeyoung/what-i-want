"use client";

import { Gift, Inbox, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/wishes", label: "선물 관리", icon: Gift },
  { href: "/admin/messages", label: "메시지함", icon: Inbox },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

type AdminShellNavProps = {
  variant?: "mobile" | "desktop";
};

export function AdminPageTitle() {
  const pathname = usePathname();
  const activeItem = adminNavItems.find((item) =>
    isActivePath(pathname, item.href),
  );

  return <>{activeItem?.label ?? "위시리스트 관리"}</>;
}

export function AdminShellNav({ variant = "mobile" }: AdminShellNavProps) {
  const pathname = usePathname();

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
            </Link>
          );
        })}
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
