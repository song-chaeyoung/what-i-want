import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const publicPagePath = join(process.cwd(), "app/b/[slug]/page.tsx");
const publicViewPath = join(process.cwd(), "components/public-wishlist-view.tsx");
const adminMessagesPagePath = join(process.cwd(), "app/admin/messages/page.tsx");
const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
const adminShellNavPath = join(process.cwd(), "app/admin/admin-shell-nav.tsx");

describe("public participation UI contract", () => {
  test("renders a public participation form on the public wishlist page", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");
    const viewSource = readFileSync(publicViewPath, "utf8");

    expect(pageSource).toContain("searchParams");
    expect(viewSource).toContain("PUBLIC_WISHLIST_COPY.participationTitle");
    expect(viewSource).toContain("participation");
    expect(viewSource).toContain('name="wishItemId"');
    expect(viewSource).toContain('name="amount"');
    expect(viewSource).toContain('name="senderName"');
    expect(viewSource).toContain('name="body"');
  });

  test("adds an admin messages page and navigation link", () => {
    const pageSource = readFileSync(adminMessagesPagePath, "utf8");
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(pageSource).toContain("listAdminMessages");
    expect(pageSource).toContain("DrizzleAdminMessagesRepository");
    expect(navSource).toContain("메시지함");
    expect(layoutSource).toContain("<AdminShellNav");
    expect(navSource).toContain('href: "/admin/messages"');
  });
});
