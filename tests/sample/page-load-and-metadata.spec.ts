// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Page Overview", () => {
  test("Page Load and Metadata", async ({ page }) => {
    // 1. 로그인하지 않은 새 페이지에서 `/sample` 로 이동합니다. (필요하면 `불러오는 중이에요…` 로딩 화면이 사라지고 `main[data-theme]` 가 나타날 때까지 대기)
    const response = await page.goto("/sample");

    const heading = page.getByRole("heading", {
      level: 1,
      name: "민지님의 위시리스트",
    });
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // expect: 응답이 성공(HTTP 200)이고 최종 URL 의 pathname 이 `/sample` 로 유지된다 (로그인 페이지로 리다이렉트되지 않는다).
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/sample");

    // expect: 레벨 1 제목 `민지님의 위시리스트` 가 보인다.
    await expect(heading).toBeVisible();

    // expect: `main[data-theme]` 요소가 정확히 1개이고 `data-theme` 값이 `pixel_y2k` 이다.
    const themedMain = page.locator("main[data-theme]");
    await expect(themedMain).toHaveCount(1);
    await expect(themedMain).toHaveAttribute("data-theme", "pixel_y2k");

    // 2. 문서 title 을 확인합니다.
    // expect: `document.title` 이 정확히 `생일 선물 펀딩 예시 | 뭐갖고싶어` 이다.
    await expect(page).toHaveTitle("생일 선물 펀딩 예시 | 뭐갖고싶어");

    // 3. `<head>` 의 메타 태그를 확인합니다.
    // expect: `meta[name=description]` 의 content 가 `생일 선물 펀딩 페이지 예시를 확인하세요. 선물 목록과 목표 금액, 모인 마음, 축하 메시지 입력 화면을 미리 볼 수 있어요.` 이다.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "생일 선물 펀딩 페이지 예시를 확인하세요. 선물 목록과 목표 금액, 모인 마음, 축하 메시지 입력 화면을 미리 볼 수 있어요.",
    );

    // expect: `meta[property='og:title']` 의 content 가 `생일 선물 펀딩 예시 | 뭐갖고싶어` 이다.
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "생일 선물 펀딩 예시 | 뭐갖고싶어",
    );

    // expect: `meta[name=robots]` 의 content 가 `index, follow` 이다.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );

    // expect: `link[rel=canonical]` 의 href 를 URL 로 파싱했을 때 pathname 이 `/sample` 이다 (호스트는 단언하지 않는다).
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/sample$/);
    const canonicalHref = await canonical.getAttribute("href");
    expect(canonicalHref).not.toBeNull();
    expect(new URL(canonicalHref ?? "").pathname).toBe("/sample");
  });
});
