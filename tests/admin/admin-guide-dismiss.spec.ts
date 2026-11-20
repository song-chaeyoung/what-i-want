// spec: specs/admin-management-2.md
// seed: tests/admin/seed-guide.spec.ts

import { test, expect } from "../fixtures/admin";

const GUIDE_KEY = "mwagotgo:admin-guide-seen";

test.describe("Admin Guide", () => {
  test("Dismiss Guide Removes Query", async ({ page, seedAdmin, signIn }) => {
    const readSeen = () =>
      page.evaluate((key) => localStorage.getItem(key), GUIDE_KEY);

    // 1. [사전 조건] seedAdmin(), signIn(admin)(안내를 이미 본 상태). `/admin?guide=1` 로 이동해 dialog 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin?guide=1");
    const dialog = page.getByRole("dialog", {
      name: "이제 위시리스트를 만들어볼까요?",
    });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText("01 / 03", { exact: true })).toBeVisible();

    // 2. `다음` 을 눌러 `02 / 03` 을 확인한 뒤 `Escape` 를 누릅니다.
    await dialog.getByRole("button", { name: "다음" }).click();
    await expect(dialog.getByText("02 / 03", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");

    // expect: dialog 가 닫히고 URL 이 `/admin` 으로 정리된다.
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin$/);

    // expect: localStorage `mwagotgo:admin-guide-seen` 은 `"1"` 이다.
    expect(await readSeen()).toBe("1");

    // 3. 사이드바(`complementary`)의 링크 `사용 가이드` 를 누릅니다.
    await page
      .getByRole("complementary")
      .getByRole("link", { name: "사용 가이드" })
      .click();

    // expect: dialog 가 다시 열리고 진행 표시가 `02 / 03` 이 아니라 `01 / 03` 이다.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("01 / 03", { exact: true })).toBeVisible();
    await expect(dialog.getByText("02 / 03", { exact: true })).toHaveCount(0);

    // 4. `/admin/settings?guide=1` 로 이동해 dialog 를 기다린 뒤 `관리 화면 먼저 둘러보기` 를 누릅니다.
    await page.goto("/admin/settings?guide=1");
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await dialog
      .getByRole("button", { name: "관리 화면 먼저 둘러보기" })
      .click();

    // expect: dialog 가 닫히고 URL 이 `/admin/settings` 로 정리된다(현재 경로 유지).
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/settings$/);
  });
});
