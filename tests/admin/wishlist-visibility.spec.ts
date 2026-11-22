// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Toggle Wishlist Visibility", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] seedAdmin({ items: [무선 이어폰] }), signIn(admin). 공개 페이지를 먼저 열어 캐시를 채운 뒤 `/admin/settings` 로 이동해 `#wishlistVisibility` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin({
      items: [{ title: "무선 이어폰", targetAmount: 100_000 }],
    });
    await signIn(admin);

    // 공개 페이지는 unstable_cache 로 캐시되므로, 저장 전에 한 번 열어 3단계 not-found 가 캐시 무효화까지 확인하게 한다.
    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/settings");
    const visibility = page.locator("#wishlistVisibility");
    await expect(visibility).toBeVisible({ timeout: 30_000 });

    const loadVisibility = async () =>
      (
        await e2eDb
          .select()
          .from(wishlists)
          .where(eq(wishlists.ownerId, admin.userId))
      )[0]?.visibility;
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    const privateNotice = page.getByText("비공개라 친구가 열 수 없어요.");

    // expect: `공개 여부` 값이 `public` 이고 힌트 `비공개로 하면 링크가 있어도 공개 페이지가 보이지 않아요.` 가 있다.
    await expect(visibility).toHaveValue("public");
    await expect(
      page.getByText("비공개로 하면 링크가 있어도 공개 페이지가 보이지 않아요."),
    ).toBeVisible();

    // 2. `공개 여부` 를 `private`(옵션 `비공개`)로 바꾸고 `저장하기` 를 누릅니다.
    await visibility.selectOption("private");
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });

    // expect: 다시 렌더된 `공개 여부` 값이 `private` 이다.
    await expect(visibility).toHaveValue("private");

    // expect: [e2eDb 조회, 코드 근거] `expect.poll` 로 `wishlists.visibility` 가 `private` 이다.
    await expect.poll(loadVisibility, { timeout: 10_000 }).toBe("private");

    // 3. `/wishlist/${admin.slug}` 로 이동합니다(로그인한 소유자 본인 세션에서도 동일).
    await page.goto(`/wishlist/${admin.slug}`);

    // expect: 문구 `위시리스트를 찾을 수 없어요` 가 보인다(탐색: 소유자도 not-found).
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "위시리스트를 찾을 수 없어요",
      }),
    ).toBeVisible({ timeout: 30_000 });

    // 4. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소")).toBeVisible({
      timeout: 30_000,
    });

    // expect: `내 공개 주소` 아래에 `비공개라 친구가 열 수 없어요.` 가 보인다.
    await expect(privateNotice).toBeVisible();

    // expect: `공유하기` 버튼과 `열어 보기` 링크는 그대로 있다.
    await expect(
      page.getByRole("main").getByRole("button", { name: "공유하기" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "열어 보기" })).toHaveAttribute(
      "href",
      `/wishlist/${admin.slug}`,
    );

    // 5. `/admin/settings` 에서 `공개 여부` 를 `public` 으로 바꿔 `저장하기` 를 누릅니다.
    await page.goto("/admin/settings");
    await expect(visibility).toBeVisible({ timeout: 30_000 });
    await expect(visibility).toHaveValue("private");
    await visibility.selectOption("public");
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.` 가 보이고 [e2eDb 조회, 코드 근거] `expect.poll` 로 `visibility` 가 `public` 이다.
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect.poll(loadVisibility, { timeout: 10_000 }).toBe("public");

    // 6. `/wishlist/${admin.slug}` 로 이동하고, 이어서 `/admin` 으로 이동합니다.
    await page.goto(`/wishlist/${admin.slug}`);

    // expect: 공개 페이지에서 레벨 1 제목 `E2E 관리자님의 위시리스트` 가 보이고 `선물` `1개` 이다.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('dt:text-is("선물") + dd')).toHaveText("1개");

    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소")).toBeVisible({
      timeout: 30_000,
    });

    // expect: `/admin` 에서 `비공개라 친구가 열 수 없어요.` 가 없다(count 0).
    await expect(privateNotice).toHaveCount(0);
  });
});
