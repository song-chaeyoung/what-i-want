// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { profiles, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Save Profile And Public Page Settings", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] seedAdmin({ displayName: "E2E 관리자" }), signIn(admin). 공개 페이지를 먼저 열어 캐시를 채운 뒤 `/admin/settings` 로 이동해 `#displayName` 을 기다립니다(timeout 30초).
    const admin = await seedAdmin({ displayName: "E2E 관리자" });
    const slug = admin.slug as string;
    await signIn(admin);

    // 공개 페이지는 unstable_cache 로 캐시되므로, 저장 전에 한 번 열어 4단계가 캐시 무효화까지 확인하게 한다.
    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 관리자님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("main[data-theme]")).toHaveAttribute(
      "data-theme",
      "pixel_y2k",
    );

    await page.goto("/admin/settings");
    await expect(page.locator("#displayName")).toBeVisible({ timeout: 30_000 });

    // expect: `이름` 값 `E2E 관리자`, `생일` 빈 값, `소개` 빈 값, `공개 주소` `${admin.slug}`, `제목` `E2E 관리자님의 위시리스트`, `공개 여부` `public`, `테마` `pixel_y2k` 이다.
    await expect(page.locator("#displayName")).toHaveValue("E2E 관리자");
    await expect(page.locator("#birthday")).toHaveValue("");
    await expect(page.locator("#description")).toHaveValue("");
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);
    await expect(page.locator("#wishlistTitle")).toHaveValue(
      "E2E 관리자님의 위시리스트",
    );
    await expect(page.locator("#wishlistVisibility")).toHaveValue("public");
    await expect(
      page.locator("#wishlistVisibility").getByRole("option"),
    ).toHaveText(["공개", "비공개"]);
    await expect(page.locator("#themeId")).toHaveValue("pixel_y2k");
    await expect(page.locator("#themeId").getByRole("option")).toHaveText([
      "픽셀 Y2K",
      "모노 흑백",
      "소프트 파스텔",
    ]);

    // expect: 레벨 3 제목이 `프로필`, `공개 페이지`, `계좌 안내`, `새 생일 준비`, `계정` 순서로 있다.
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "프로필",
      "공개 페이지",
      "계좌 안내",
      "새 생일 준비",
      "계정",
    ]);

    // 2. `이름` 을 `새 이름`, `생일` 을 `1990-03-15`, `소개` 를 `올해도 잘 부탁해요`, `제목` 을 `새 위시리스트 제목`, `테마` 를 `soft_pastel` 로 바꾸고 버튼 `저장하기` 를 누릅니다.
    await page.locator("#displayName").fill("새 이름");
    await page.locator("#birthday").fill("1990-03-15");
    await page.locator("#description").fill("올해도 잘 부탁해요");
    await page.locator("#wishlistTitle").fill("새 위시리스트 제목");
    await page.locator("#themeId").selectOption("soft_pastel");
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.`(`data-type` `success`)가 보인다.
    const savedToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    await expect(savedToast).toBeVisible({ timeout: 10_000 });
    await expect(savedToast).toHaveAttribute("data-type", "success");

    // expect: URL 이 `/admin/settings` 로 정리된다(`?saved=1` 제거).
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });

    // expect: 리다이렉트로 다시 렌더된 입력값이 새 값이고 `공개 주소` 는 그대로이다(서버 렌더 결과).
    await expect(page.locator("#displayName")).toHaveValue("새 이름");
    await expect(page.locator("#birthday")).toHaveValue("1990-03-15");
    await expect(page.locator("#description")).toHaveValue(
      "올해도 잘 부탁해요",
    );
    await expect(page.locator("#wishlistTitle")).toHaveValue(
      "새 위시리스트 제목",
    );
    await expect(page.locator("#themeId")).toHaveValue("soft_pastel");
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    // 3. [e2eDb 조회, 코드 근거] `profiles` 와 `wishlists` 를 조회합니다(`expect.poll`).
    const loadProfile = async () =>
      (
        await e2eDb
          .select()
          .from(profiles)
          .where(eq(profiles.userId, admin.userId))
      )[0];
    const loadWishlist = async () =>
      (
        await e2eDb
          .select()
          .from(wishlists)
          .where(eq(wishlists.ownerId, admin.userId))
      )[0];

    // expect: `profiles.displayName` `새 이름`, `birthday` `1990-03-15`, `description` `올해도 잘 부탁해요` 이다.
    await expect
      .poll(async () => (await loadProfile()).displayName)
      .toBe("새 이름");
    await expect
      .poll(async () => (await loadProfile()).birthday)
      .toBe("1990-03-15");
    await expect
      .poll(async () => (await loadProfile()).description)
      .toBe("올해도 잘 부탁해요");

    // expect: `wishlists.title` `새 위시리스트 제목`, `themeId` `soft_pastel`, `slug` `admin.slug`, `visibility` `public` 이다.
    await expect
      .poll(async () => (await loadWishlist()).title)
      .toBe("새 위시리스트 제목");
    await expect
      .poll(async () => (await loadWishlist()).themeId)
      .toBe("soft_pastel");
    await expect.poll(async () => (await loadWishlist()).slug).toBe(slug);
    await expect
      .poll(async () => (await loadWishlist()).visibility)
      .toBe("public");

    // 4. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초).
    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "새 위시리스트 제목" }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: 문단 `올해도 잘 부탁해요` 가 보인다.
    await expect(
      page.getByText("올해도 잘 부탁해요", { exact: true }),
    ).toBeVisible();

    // expect: 생일 배지 `3월 15일 · D-<숫자>` 가 보인다(D-일수는 실행 날짜에 따라 달라짐).
    await expect(page.getByText(/^3월 15일 · D-(DAY|\d+)$/)).toBeVisible();

    // expect: `main[data-theme]` 의 `data-theme` 가 `soft_pastel` 이고 문서 title 도 `새 위시리스트 제목` 이다.
    await expect(page.locator("main[data-theme]")).toHaveAttribute(
      "data-theme",
      "soft_pastel",
    );
    await expect(page).toHaveTitle("새 위시리스트 제목");
  });
});
