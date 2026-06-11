import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const adminLayoutPath = join(root, "app/admin/layout.tsx");
const adminToastEventsPath = join(root, "app/admin/admin-toast-events.tsx");
const adminToastMessagePath = join(root, "app/admin/admin-toast-message.tsx");
const adminUiPath = join(root, "app/admin/admin-ui.tsx");
const adminPagePath = join(root, "app/admin/page.tsx");
const adminMessagesPagePath = join(root, "app/admin/messages/page.tsx");
const adminSettingsPagePath = join(root, "app/admin/settings/page.tsx");
const adminWishesPagePath = join(root, "app/admin/wishes/page.tsx");

const adminPagePaths = [
  adminPagePath,
  adminMessagesPagePath,
  adminSettingsPagePath,
  adminWishesPagePath,
];

describe("admin toast contract", () => {
  test("mounts admin toast events from the server admin layout", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain('import { Suspense } from "react";');
    expect(source).toContain('import { AdminToastEvents } from "./admin-toast-events";');
    expect(source).toContain("<Suspense fallback={null}>");
    expect(source).toContain("<AdminToastEvents />");
    expect(source).not.toMatch(/^["']use client["'];/);
  });

  test("maps admin redirect query params to sonner toasts", () => {
    expect(existsSync(adminToastEventsPath)).toBe(true);

    const source = readFileSync(adminToastEventsPath, "utf8");

    expect(source).toMatch(/^"use client";/);
    expect(source).toContain('import { toast, type ExternalToast } from "sonner";');
    expect(source).toContain('import { usePathname, useRouter, useSearchParams } from "next/navigation";');
    expect(source).toContain('saved: { type: "success", message: "설정을 저장했어요." }');
    expect(source).toContain('created: { type: "success", message: "선물을 추가했어요." }');
    expect(source).toContain("missingAccount: {");
    expect(source).toContain('type: "warning"');
    expect(source).toContain(
      'message: "계좌번호가 등록되어 있지 않아요. 설정에서 계좌번호를 추가해 주세요."',
    );
    expect(source).toContain(
      'action: { label: "계좌 등록", href: "/admin/settings#account-settings" }',
    );
    expect(source).toContain('updated: { type: "success", message: "선물을 수정했어요." }');
    expect(source).toContain('deleted: { type: "success", message: "선물을 삭제했어요." }');
    expect(source).toContain('error: { type: "error", message: "요청을 처리하지 못했어요." }');
    expect(source).toContain("toastConfigList.forEach((toastConfig) => {");
    expect(source).toContain("toast[toastConfig.type](");
    expect(source).toContain("getAdminToastOptions(toastConfig, router)");
    expect(source).toContain("onClick: () => router.push(toastConfig.action.href)");
    expect(source).toContain("toastParamNames.forEach((paramName) => {");
    expect(source).toContain("nextParams.delete(paramName);");
    expect(source).toContain("router.replace(nextUrl, { scroll: false });");
  });

  test("adds a missing account alert query after creating a wish without an account", () => {
    const source = readFileSync(join(root, "app/api/admin/wishes/route.ts"), "utf8");

    expect(source).toContain("getSettings");
    expect(source).toContain("DrizzleSettingsRepository");
    expect(source).toContain("getCreateWishRedirectUrl");
    expect(source).toContain('url.searchParams.set("created", "1");');
    expect(source).toContain('url.searchParams.set("missingAccount", "1");');
  });

  test("does not duplicate redirect query feedback as inline admin notices", () => {
    const settingsSource = readFileSync(adminSettingsPagePath, "utf8");
    const wishesSource = readFileSync(adminWishesPagePath, "utf8");

    expect(settingsSource).not.toContain("params.saved");
    expect(settingsSource).not.toMatch(/const errorMessage\s*=/);
    expect(settingsSource).not.toContain("{errorMessage ? (");
    expect(wishesSource).not.toContain("successMessage");
    expect(wishesSource).not.toContain("getSuccessMessage");
    expect(wishesSource).not.toContain("params.error ? errorMessages[params.error]");
    expect(wishesSource).not.toContain("created?: string;");
    expect(wishesSource).not.toContain("updated?: string;");
    expect(wishesSource).not.toContain("deleted?: string;");
  });

  test("renders admin load guidance through toast messages instead of inline notices", () => {
    expect(existsSync(adminToastMessagePath)).toBe(true);

    const toastMessageSource = readFileSync(adminToastMessagePath, "utf8");
    const adminUiSource = readFileSync(adminUiPath, "utf8");

    expect(toastMessageSource).toMatch(/^"use client";/);
    expect(toastMessageSource).toContain('import { toast } from "sonner";');
    expect(toastMessageSource).toContain("export function AdminToastMessage");
    expect(toastMessageSource).toContain("toast[type](message, { id });");
    expect(toastMessageSource).toContain("return null;");
    expect(adminUiSource).not.toContain("export function AdminNotice");

    for (const pagePath of adminPagePaths) {
      const source = readFileSync(pagePath, "utf8");

      expect(source).toContain('import { AdminToastMessage } from');
      expect(source).toContain("<AdminToastMessage");
      expect(source).not.toContain("AdminNotice");
    }
  });
});
