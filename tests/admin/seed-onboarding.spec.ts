import { test, expect } from "../fixtures/admin";

// 온보딩 탐색용 seed. 소셜 로그인만 하고 온보딩을 마치지 않은 사용자로 /onboarding을 연다.
test("seed", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin({ onboarded: false });
  await signIn(admin);

  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { level: 1, name: "기본 위시리스트 만들기" }),
  ).toBeVisible({ timeout: 30_000 });
});
