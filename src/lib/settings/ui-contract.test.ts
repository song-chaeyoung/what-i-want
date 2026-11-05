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
const publicPagePath = join(process.cwd(), "app/wishlist/[slug]/page.tsx");
const publicToastEventsPath = join(
  process.cwd(),
  "components/public-wishlist-toast-events.tsx",
);

describe("admin settings UI contract", () => {
  test("adds an authenticated admin settings route handler", () => {
    const source = readFileSync(adminSettingsRoutePath, "utf8");

    expect(source).toContain("auth()");
    expect(source).toContain("updateSettings");
    expect(source).toContain("DrizzleSettingsRepository");
    expect(source).toContain("/admin/settings?saved=1");
  });

  test("blocks under-14 birthdays in the date input before submitting", () => {
    const pageSource = readFileSync(adminSettingsPagePath, "utf8");

    expect(pageSource).toContain(
      'import { getLatestSignupBirthday } from "@/src/lib/onboarding/age";',
    );
    expect(pageSource).toContain("max={getLatestSignupBirthday()}");
  });

  test("renders settings page fields and admin navigation", () => {
    const pageSource = readFileSync(adminSettingsPagePath, "utf8");
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(pageSource).toContain("getSettings");
    expect(pageSource).toContain('name="displayName"');
    expect(pageSource).toContain('name="wishlistSlug"');
    expect(pageSource).toContain('name="bankName"');
    expect(pageSource).toContain('id="account-settings"');
    expect(pageSource).toContain("<AccountVisibilityField");
    expect(layoutSource).toContain("<AdminShellNav");
    expect(navSource).toContain('href: "/admin/settings"');
  });

  test("lets the owner toggle wishlist visibility", () => {
    const pageSource = readFileSync(adminSettingsPagePath, "utf8");
    const routeSource = readFileSync(adminSettingsRoutePath, "utf8");

    expect(pageSource).toContain('name="wishlistVisibility"');
    expect(pageSource).toContain("WISHLIST_VISIBILITIES");
    expect(pageSource).toContain(
      "defaultValue={settings.wishlist.visibility}",
    );
    expect(routeSource).toContain('"wishlistVisibility"');
  });

  test("lets the owner choose whether the public page shows the bank account", () => {
    const pageSource = readFileSync(adminSettingsPagePath, "utf8");
    const fieldSource = readFileSync(
      join(process.cwd(), "app/admin/settings/account-visibility-field.tsx"),
      "utf8",
    );
    const routeSource = readFileSync(adminSettingsRoutePath, "utf8");

    expect(pageSource).toContain("<AccountVisibilityField");
    expect(pageSource).toContain("disabled={settings.bankAccount === null}");
    expect(fieldSource).toContain('name="accountVisibility"');
    expect(fieldSource).toContain("adminInputClassName");
    expect(fieldSource).toContain("<AdminField");
    expect(fieldSource).toContain('label="계좌 공개"');
    expect(fieldSource).toContain("공개 페이지에 보이기");
    expect(fieldSource).toContain("숨기기");
    expect(fieldSource).toContain(
      "공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.",
    );
    expect(fieldSource).toContain("공개 페이지에 계좌가 보이지 않아요.");
    expect(fieldSource).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(routeSource).toContain('"accountVisibility"');
  });

  test("reveals account guidance only after a funding submission", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");
    const toastSource = readFileSync(publicToastEventsPath, "utf8");

    expect(toastSource).toContain("AccountRevealModal");
    expect(toastSource).toContain("PublicBankAccountCard");
    expect(toastSource).toContain('sent === "funding"');
    expect(toastSource).not.toContain("account.accountNumber}\n        aria-label");
    expect(pageSource).toContain("account={result.account}");
    expect(pageSource).toContain(
      "<PublicWishlistToastEvents account={result.account} />",
    );
  });
});
