import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const publicPagePath = join(process.cwd(), "app/b/[slug]/page.tsx");
const adminMessagesPagePath = join(process.cwd(), "app/admin/messages/page.tsx");
const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
const adminShellNavPath = join(process.cwd(), "app/admin/admin-shell-nav.tsx");

describe("public participation UI contract", () => {
  test("renders a public participation form on the public wishlist page", () => {
    const source = readFileSync(publicPagePath, "utf8");

    expect(source).toContain("searchParams");
    expect(source).toContain("PUBLIC_WISHLIST_COPY.participationTitle");
    expect(source).toContain("participation");
    expect(source).toContain('name="wishItemId"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="senderName"');
    expect(source).toContain('name="body"');
  });

  test("adds an admin messages page and navigation link", () => {
    const pageSource = readFileSync(adminMessagesPagePath, "utf8");
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(pageSource).toContain("listAdminMessages");
    expect(pageSource).toContain("DrizzleAdminMessagesRepository");
    expect(pageSource).toContain("메시지함");
    expect(layoutSource).toContain("<AdminShellNav");
    expect(navSource).toContain('href: "/admin/messages"');
  });
});
