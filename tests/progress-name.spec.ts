import { expect, test } from "./fixtures/admin";

test("names the home and sample progress bars", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  const headphones = page.getByRole("progressbar", {
    name: "무선 헤드폰 모금 진행률",
  });
  const cake = page.getByRole("progressbar", { name: "생일 케이크 모금 진행률" });
  await expect(headphones).toHaveAttribute("aria-valuenow", "72");
  await expect(headphones).toHaveAttribute("aria-valuemax", "100");
  await expect(cake).toHaveAttribute("aria-valuenow", "38");
  await expect(cake).toHaveAttribute("aria-valuemax", "100");

  await page.goto("/sample");
  await expect(
    page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "무선 헤드폰", exact: true }),
  ).toHaveAttribute("aria-valuenow", "72");
  await expect(
    page.getByRole("progressbar", { name: "생일 케이크", exact: true }),
  ).toHaveAttribute("aria-valuenow", "38");
});

test("names the admin wish progress bar", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin({
    items: [
      {
        title: "무선 헤드폰",
        targetAmount: 100_000,
        fundedAmount: 36_000,
        status: "open",
      },
    ],
  });
  await signIn(admin);
  await page.goto("/admin/wishes");

  const bar = page.getByRole("progressbar", { name: "무선 헤드폰 모금 진행률" });
  await expect(bar).toBeVisible({ timeout: 30_000 });
  await expect(bar).toHaveAttribute("aria-valuenow", "36");
  await expect(bar).toHaveAttribute("aria-valuemax", "100");
});
