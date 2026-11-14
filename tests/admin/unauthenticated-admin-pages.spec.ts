// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { test, expect } from "../fixtures/admin";

test.describe("Admin Login Boundary", () => {
  test("Unauthenticated Admin Pages Redirect To Login", async ({ page }) => {
    // 1. [사전 조건] 이 테스트는 `seedAdmin`·`signIn` 을 호출하지 않습니다(쿠키 없는 새 컨텍스트). `/admin` 으로 이동합니다.
    await page.goto("/admin");

    // expect: URL 이 `/login` 이 된다.
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });

    // expect: 레벨 1 제목 `로그인` 과 버튼 `Google로 계속하기` 가 보인다.
    await expect(
      page.getByRole("heading", { level: 1, name: "로그인" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible();

    // expect: 사이드바(`complementary`)와 `위시리스트 관리` 제목이 없다.
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "위시리스트 관리" }),
    ).toHaveCount(0);

    // 2. `/admin/wishes`, `/admin/messages`, `/admin/settings` 로 차례로 이동합니다.
    for (const path of [
      "/admin/wishes",
      "/admin/messages",
      "/admin/settings",
    ]) {
      await page.goto(path);

      // expect: 각각 URL 이 `/login` 이 되고 버튼 `Google로 계속하기` 가 보인다.
      await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
      await expect(
        page.getByRole("button", { name: "Google로 계속하기" }),
      ).toBeVisible();
    }
  });
});
