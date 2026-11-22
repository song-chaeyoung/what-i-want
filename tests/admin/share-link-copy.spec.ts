// spec: specs/admin-management.md
// seed: tests/fixtures/admin.ts

import { test, expect } from "../fixtures/admin";

test.describe("Admin home share", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Share Link Copy", async ({ page, context, seedAdmin, signIn }) => {
    // 1. [사전 조건] `clipboard-read`, `clipboard-write` 권한을 부여하고(위 `test.use({ permissions })`),
    //    `page.addInitScript` 로 `navigator.share` 를 `undefined` 로 설정해 클립보드 폴백 경로를 강제합니다.
    //    `seedAdmin()`, `signIn(admin)` 뒤 `/admin` 으로 이동하고 `내 공개 주소` 가 보일 때까지 대기합니다.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    });

    const admin = await seedAdmin();
    await signIn(admin);
    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const shareButton = page.getByRole("button", {
      name: /공유하기|복사 완료/,
    });
    const shareUrl = `http://localhost:3200/wishlist/${admin.slug}?utm_source=owner_share&utm_medium=share`;

    // expect: `typeof navigator.share` 가 `undefined` 이고 버튼 `공유하기` 가 보인다.
    expect(await page.evaluate(() => typeof navigator.share)).toBe("undefined");
    await expect(shareButton).toHaveText("공유하기");

    // 2. 버튼 `공유하기` 를 클릭합니다.
    await shareButton.click();

    // expect: 버튼 라벨이 `복사 완료` 로 바뀐다.
    await expect(shareButton).toHaveText("복사 완료");

    // expect: 토스트 `위시리스트 링크를 복사했어요.` 가 표시된다.
    await expect(
      page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
    ).toBeVisible();

    // expect: 클립보드 문자열이 관리자 공유 URL 이다.
    // origin `http://localhost:3200`, pathname `/wishlist/{slug}`,
    // `utm_source` `owner_share`, `utm_medium` `share`.
    await expect
      .poll(async () => {
        const text = await page.evaluate(() => navigator.clipboard.readText());
        const url = new URL(text);
        return {
          href: url.href,
          origin: url.origin,
          pathname: url.pathname,
          utmSource: url.searchParams.get("utm_source"),
          utmMedium: url.searchParams.get("utm_medium"),
        };
      })
      .toEqual({
        href: shareUrl,
        origin: "http://localhost:3200",
        pathname: `/wishlist/${admin.slug}`,
        utmSource: "owner_share",
        utmMedium: "share",
      });

    // expect: 페이지 URL 은 `/admin` 그대로이며 새 탭이 생기지 않는다.
    expect(new URL(page.url()).pathname).toBe("/admin");
    expect(context.pages()).toHaveLength(1);

    // 3. 약 2~3초 대기합니다.
    // expect: 버튼 라벨이 `공유하기` 로 되돌아간다.
    await expect(shareButton).toHaveText("공유하기", { timeout: 5000 });
  });
});
