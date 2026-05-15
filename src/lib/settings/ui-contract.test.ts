import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const adminSettingsPagePath = join(process.cwd(), "app/admin/settings/page.tsx");
const adminSettingsRoutePath = join(
  process.cwd(),
  "app/api/admin/settings/route.ts",
);
const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
const publicPagePath = join(process.cwd(), "app/b/[slug]/page.tsx");

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

    expect(pageSource).toContain("getSettings");
    expect(pageSource).toContain('name="displayName"');
    expect(pageSource).toContain('name="wishlistSlug"');
    expect(pageSource).toContain('name="bankName"');
    expect(pageSource).toContain('name="accountVisibility"');
    expect(layoutSource).toContain('href="/admin/settings"');
  });

  test("renders public account guidance on public wishlist pages", () => {
    const source = readFileSync(publicPagePath, "utf8");

    expect(source).toContain("AccountGuidance");
    expect(source).toContain("result.account");
  });
});
