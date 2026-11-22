// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Slug Validation Errors", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] seedAdmin(), 다른 사용자 seedAdmin({ displayName: "E2E 다른 사람" }) (signIn 은 admin 만). `/admin/settings` 로 이동해 `#wishlistSlug` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin();
    const other = await seedAdmin({ displayName: "E2E 다른 사람" });
    const slug = admin.slug as string;
    const otherSlug = other.slug as string;
    await signIn(admin);

    await page.goto("/admin/settings");
    await expect(page.locator("#wishlistSlug")).toBeVisible({ timeout: 30_000 });

    // expect: `공개 주소` 값이 `admin.slug` 이다.
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    const loadSlug = async (userId: string) =>
      (
        await e2eDb
          .select()
          .from(wishlists)
          .where(eq(wishlists.ownerId, userId))
      )[0].slug;

    // 입력값으로 저장하기를 눌러 POST 응답(리다이렉트)을 돌려받는다.
    const submitSlug = async (value: string) => {
      await page.locator("#wishlistSlug").fill(value);
      const responsePromise = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          new URL(r.url()).pathname === "/api/admin/settings",
        { timeout: 30_000 },
      );
      await page.getByRole("button", { name: "저장하기" }).click();
      return responsePromise;
    };

    // 이전 오류 토스트가 사라진 뒤에야 같은 문구의 다음 토스트를 구분할 수 있다.
    const waitForToastsGone = async () => {
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
        timeout: 10_000,
      });
    };

    // 2. `공개 주소` 에 `sample` 을 입력하고 `저장하기` 를 누릅니다.
    const reservedResponse = await submitSlug("sample");
    expect(reservedResponse.status()).toBe(307);
    expect(new URL(reservedResponse.headers()["location"]).search).toBe(
      "?error=reserved_slug",
    );

    // expect: 토스트 `sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.`(`data-type` `error`)가 보인다.
    const reservedToast = page.locator("[data-sonner-toast]").filter({
      hasText: "sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.",
    });
    await expect(reservedToast).toBeVisible({ timeout: 10_000 });
    await expect(reservedToast).toHaveAttribute("data-type", "error");

    // expect: URL 이 `/admin/settings` 로 정리되고 `공개 주소` 값이 `admin.slug` 이다(서버 렌더 결과).
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    // expect: [e2eDb 조회, 코드 근거] `wishlists.slug` 가 `admin.slug` 그대로이다.
    await expect.poll(() => loadSlug(admin.userId)).toBe(slug);

    // 3. 토스트가 사라지길 기다린 뒤 `공개 주소` 에 `Bad_Slug!` 를 입력하고 `저장하기` 를 누릅니다.
    await waitForToastsGone();
    const invalidResponse = await submitSlug("Bad_Slug!");

    // expect: 응답 status 가 `307` 이고 `location` 헤더의 search 가 `?error=invalid_slug` 이다.
    expect(invalidResponse.status()).toBe(307);
    expect(new URL(invalidResponse.headers()["location"]).search).toBe(
      "?error=invalid_slug",
    );

    // expect: 토스트 `공개 주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.`(`data-type` `error`)가 보이고, 일반 문구 `요청을 처리하지 못했어요.` 토스트는 없다.
    const genericToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "요청을 처리하지 못했어요." });
    const invalidToast = page.locator("[data-sonner-toast]").filter({
      hasText: "공개 주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
    });
    await expect(invalidToast).toBeVisible({ timeout: 10_000 });
    await expect(invalidToast).toHaveAttribute("data-type", "error");
    await expect(genericToast).toHaveCount(0);

    // expect: `공개 주소` 값이 `admin.slug` 그대로이고 URL 이 `/admin/settings` 이다.
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    // expect: [e2eDb 조회, 코드 근거] `wishlists.slug` 가 `admin.slug` 그대로이다.
    await expect.poll(() => loadSlug(admin.userId)).toBe(slug);

    // 4. 토스트가 사라지길 기다린 뒤 `공개 주소` 에 `other.slug` 를 입력하고 `저장하기` 를 누릅니다.
    await waitForToastsGone();
    const duplicateResponse = await submitSlug(otherSlug);

    // expect: 응답 `location` 의 search 가 `?error=duplicate_slug` 이다(코드 근거).
    expect(duplicateResponse.status()).toBe(307);
    expect(new URL(duplicateResponse.headers()["location"]).search).toBe(
      "?error=duplicate_slug",
    );

    // expect: 토스트 `이미 사용 중인 공개 주소입니다.`(`data-type` `error`)가 보이고, 일반 문구 토스트는 없다.
    const duplicateToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "이미 사용 중인 공개 주소입니다." });
    await expect(duplicateToast).toBeVisible({ timeout: 10_000 });
    await expect(duplicateToast).toHaveAttribute("data-type", "error");
    await expect(genericToast).toHaveCount(0);

    // expect: URL 이 `/admin/settings` 이고 `공개 주소` 값이 `admin.slug` 이다.
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);

    // expect: [e2eDb 조회, 코드 근거] 두 사용자의 slug 가 그대로이다.
    await expect.poll(() => loadSlug(admin.userId)).toBe(slug);
    await expect.poll(() => loadSlug(other.userId)).toBe(otherSlug);
  });
});
