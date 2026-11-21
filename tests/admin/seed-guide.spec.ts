import { test, expect } from "../fixtures/admin";

// 첫 진입 안내 모달 탐색용 seed. 안내 모달을 끄지 않고 처음 로그인한 관리자로 /admin 을 연다.
test("seed", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin();
  await signIn(admin, { showAdminGuide: true });

  await page.goto("/admin");
  await expect(
    page.getByRole("dialog", { name: "이제 위시리스트를 만들어볼까요?" }),
  ).toBeVisible({ timeout: 30_000 });
});
