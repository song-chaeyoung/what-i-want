import { expect, test } from "../fixtures/admin";

test("opens the guide from ?guide=1", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin();
  await signIn(admin);
  await page.goto("/admin?guide=1");

  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "이제 위시리스트를 만들어볼까요?" }),
  ).toBeVisible();
});

test("opens the guide from the menu", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin();
  await signIn(admin);
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { level: 1, name: "위시리스트 관리" }),
  ).toBeVisible({ timeout: 30_000 });
  // 안내는 hydration 뒤 effect에서 localStorage를 읽고 열리므로, 제목이 보인 직후의 dialog 0개 단언은
  // 항상 참이라 넣지 않는다. 이미 본 안내가 다시 열리지 않는지는 admin-guide-first-visit.spec.ts가
  // hydration 이후 신호(저장 토스트·URL 정리) 뒤에 확인한다.

  await page.getByRole("complementary").getByRole("link", { name: "사용 가이드" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "이제 위시리스트를 만들어볼까요?" }),
  ).toBeVisible();
});
