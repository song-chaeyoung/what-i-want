// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { test, expect } from "../fixtures/admin";

test.describe("Share Public Link", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Share Link Copy", async ({ page, context, seedAdmin, signIn }) => {
    // 1. [사전 조건] 클립보드 권한(위 test.use), seedAdmin, signIn, `navigator.share` 를 undefined 로 스텁한 뒤 `/admin` 에서 `내 공개 주소` 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    });

    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const main = page.getByRole("main");
    // 복사 후 라벨이 바뀌므로 두 라벨을 모두 받는 이름으로 같은 버튼을 잡는다.
    const shareButton = main.getByRole("button", { name: /공유하기|복사 완료/ });

    // expect: `typeof navigator.share` 가 `undefined` 이고 `main` 안에 버튼 `공유하기` 가 보인다.
    expect(await page.evaluate(() => typeof navigator.share)).toBe("undefined");
    await expect(main.getByRole("button", { name: "공유하기" })).toBeVisible();

    // 2. `공유하기` 를 누릅니다.
    await main.getByRole("button", { name: "공유하기" }).click();

    // expect: 같은 버튼의 라벨이 `복사 완료` 로 바뀐다.
    await expect(shareButton).toHaveText("복사 완료", { timeout: 5000 });

    // expect: 토스트 `위시리스트 링크를 복사했어요.`(success)가 보인다.
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "위시리스트 링크를 복사했어요." });
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toHaveAttribute("data-type", "success");

    // expect: 클립보드의 URL 이 소유자 공유 URL 이다.
    await expect
      .poll(
        async () => {
          const text = await page.evaluate(() =>
            navigator.clipboard.readText(),
          );
          const url = new URL(text);
          return {
            origin: url.origin,
            pathname: url.pathname,
            utmSource: url.searchParams.get("utm_source"),
            utmMedium: url.searchParams.get("utm_medium"),
            theme: url.searchParams.get("theme"),
          };
        },
        { timeout: 5000 },
      )
      .toEqual({
        origin: "http://localhost:3200",
        pathname: `/wishlist/${admin.slug}`,
        utmSource: "owner_share",
        utmMedium: "share",
        theme: null,
      });

    // expect: URL 은 `/admin` 그대로이고 `context.pages()` 가 1개이다.
    expect(new URL(page.url()).pathname).toBe("/admin");
    expect(context.pages()).toHaveLength(1);

    // 3. 약 2초 대기합니다.
    // expect: 버튼 라벨이 `공유하기` 로 되돌아간다.
    await expect(shareButton).toHaveText("공유하기", { timeout: 5000 });
  });
});
