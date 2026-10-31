import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { AdminShellNav } from "../../../app/admin/admin-shell-nav";

const route = vi.hoisted(() => ({ pathname: "/admin/messages", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));

describe("admin unread message badge", () => {
  test.each(["mobile", "desktop"] as const)(
    "keeps unread received messages visible in the hidden inbox (%s)",
    (variant) => {
      route.search = "filter=hidden";

      const html = renderToStaticMarkup(
        createElement(AdminShellNav, { variant, unreadMessageCount: 5 }),
      );

      expect(html).toContain('aria-label="새 메시지 5개"');
    },
  );

  test("acknowledges messages when the received inbox is opened", () => {
    route.search = "";

    const html = renderToStaticMarkup(
      createElement(AdminShellNav, { unreadMessageCount: 5 }),
    );

    expect(html).not.toContain('aria-label="새 메시지 5개"');
  });
});
