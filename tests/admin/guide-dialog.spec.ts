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
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("complementary").getByRole("link", { name: "사용 가이드" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "이제 위시리스트를 만들어볼까요?" }),
  ).toBeVisible();
});
