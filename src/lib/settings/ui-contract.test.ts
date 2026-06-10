import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const adminSettingsPagePath = join(process.cwd(), "app/admin/settings/page.tsx");
const adminSettingsRoutePath = join(
  process.cwd(),
  "app/api/admin/settings/route.ts",
);
const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
const adminShellNavPath = join(process.cwd(), "app/admin/admin-shell-nav.tsx");
const publicPagePath = join(process.cwd(), "app/b/[slug]/page.tsx");
const publicViewPath = join(
  process.cwd(),
  "components/public-wishlist-view.tsx",
);

describe("admin settings UI contract", () => {
  test("adds an authenticated admin settings route handler", () => {
    const source = readFileSync(adminSettingsRoutePath, "utf8");

    expect(source).toContain("auth()");
    expect(source).toContain("updateSettings");
    expect(source).toContain("DrizzleSettingsRepository");
    expect(source).toContain("/admin/settings?saved=1");
  });

  test("renders settings page fields and admin navigation", () => {
    const pageSource = readFileSync(adminSettingsPagePath, "utf8");
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(pageSource).toContain("getSettings");
    expect(pageSource).toContain('name="displayName"');
    expect(pageSource).toContain('name="wishlistSlug"');
    expect(pageSource).toContain('name="bankName"');
    expect(pageSource).toContain('name="accountVisibility"');
    expect(layoutSource).toContain("<AdminShellNav");
    expect(navSource).toContain('href: "/admin/settings"');
  });

  test("renders public account guidance on public wishlist pages", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");
    const viewSource = readFileSync(publicViewPath, "utf8");

    expect(viewSource).toContain("AccountGuidance");
    expect(pageSource).toContain("account={result.account}");
  });
});
