// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Share", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Share Link Copy", async ({ page, context }) => {
    // 1. [사전 조건] `clipboard-read`, `clipboard-write` 권한을 부여하고(위 `test.use({ permissions })`),
    //    `page.addInitScript` 로 `navigator.share` 를 `undefined` 로 설정해 클립보드 폴백 경로를 강제합니다.
    //    그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    });
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const header = page.locator("header");
    // 헤더에는 버튼이 하나뿐이며, 복사 후 라벨이 바뀌므로 이름 없이 찾는다.
    const shareButton = header.getByRole("button");

    // expect: `typeof navigator.share` 가 `undefined` 이고 헤더에 버튼 `공유하기` 가 보인다.
    expect(await page.evaluate(() => typeof navigator.share)).toBe("undefined");
    await expect(header.getByRole("button", { name: "공유하기" })).toBeVisible();

    // 2. 헤더의 버튼 `공유하기` 를 클릭합니다.
    await header.getByRole("button", { name: "공유하기" }).click();

    // expect: 버튼 라벨이 `복사 완료` 로 바뀐다.
    await expect(shareButton).toHaveText("복사 완료");

    // expect: 토스트 `위시리스트 링크를 복사했어요.` 가 표시된다.
    await expect(
      page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
    ).toBeVisible();

    // expect: 클립보드 문자열을 `new URL(...)` 로 파싱하면 origin 이 `http://localhost:3200`,
    // pathname 이 `/sample`, `theme` 가 현재 렌더된 `pixel_y2k`, `utm_source` 가 `visitor_share`,
    // `utm_medium` 이 `share` 이다.
    await expect
      .poll(async () => {
        const text = await page.evaluate(() => navigator.clipboard.readText());
        const url = new URL(text);
        return {
          origin: url.origin,
          pathname: url.pathname,
          theme: url.searchParams.get("theme"),
          utmSource: url.searchParams.get("utm_source"),
          utmMedium: url.searchParams.get("utm_medium"),
        };
      })
      .toEqual({
        origin: "http://localhost:3200",
        pathname: "/sample",
        theme: "pixel_y2k",
        utmSource: "visitor_share",
        utmMedium: "share",
      });

    // expect: 페이지 URL 은 `/sample` 그대로이며 새 탭/네비게이션이 발생하지 않는다.
    expect(new URL(page.url()).pathname).toBe("/sample");
    expect(new URL(page.url()).search).toBe("");
    expect(context.pages()).toHaveLength(1);

    // 3. 약 2~3초 대기합니다.
    // expect: 헤더 버튼 라벨이 `공유하기` 로 되돌아간다.
    await expect(shareButton).toHaveText("공유하기", { timeout: 5000 });
  });
});
