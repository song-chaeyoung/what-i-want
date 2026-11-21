// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Change Public Slug", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin(), signIn(admin). 새 slug 는 테스트마다 유일하게 만들고, 옛 주소 공개 페이지를 한 번 연 뒤 `/admin/settings` 로 이동해 `#wishlistSlug` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin();
    const slug = admin.slug as string;
    const next = `e2e-new-${slug.slice(4)}`;
    await signIn(admin);

    // 옛 주소의 공개 페이지 캐시를 채워 둔다. 5단계의 not-found 가 이전 slug 캐시 무효화의 근거가 된다.
    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 관리자님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/settings");
    await expect(page.locator("#wishlistSlug")).toBeVisible({ timeout: 30_000 });

    // expect: `공개 주소` 값이 `admin.slug` 이다.
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    // 2. `공개 주소` 에 앞뒤 공백·대문자인 새 slug 를 입력하고 `저장하기` 를 누릅니다.
    await page.locator("#wishlistSlug").fill(`  ${next.toUpperCase()}  `);
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    const savedToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    await expect(savedToast).toBeVisible({ timeout: 10_000 });
    await expect(savedToast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });

    // expect: `공개 주소` 입력값이 소문자·공백 제거된 `next` 이다(서버가 `trim`+소문자 정규화).
    await expect(page.locator("#wishlistSlug")).toHaveValue(next);

    // expect: 헤더 링크 `공개 페이지 보기` 의 href 가 `/wishlist/${next}` 로 갱신된다.
    await expect(
      page.getByRole("main").getByRole("link", { name: "공개 페이지 보기" }),
    ).toHaveAttribute("href", `/wishlist/${next}`);

    // 3. [e2eDb 조회, 코드 근거] `wishlists` 를 조회합니다(`expect.poll`).
    // expect: `slug` 가 `next` 이다.
    await expect
      .poll(
        async () =>
          (
            await e2eDb
              .select()
              .from(wishlists)
              .where(eq(wishlists.ownerId, admin.userId))
          )[0].slug,
      )
      .toBe(next);

    // 4. `/wishlist/${next}` 로 이동합니다.
    await page.goto(`/wishlist/${next}`);

    // expect: 레벨 1 제목 `E2E 관리자님의 위시리스트` 가 보인다.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    // 5. `/wishlist/${admin.slug}`(옛 주소)로 이동합니다.
    await page.goto(`/wishlist/${slug}`);

    // expect: 문구 `위시리스트를 찾을 수 없어요` 와 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.` 가 보인다.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "위시리스트를 찾을 수 없어요",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요."),
    ).toBeVisible();
  });
});
