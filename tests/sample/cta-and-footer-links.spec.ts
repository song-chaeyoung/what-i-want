// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("CTA and Footer Links", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기한 뒤 페이지 하단으로 스크롤합니다.
    await page.goto("/sample");
    const heading = page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" });
    await expect(heading).toBeVisible({ timeout: 30_000 });

    const footer = page.locator("footer");
    const ctaLink = page.getByRole("link", { name: "내 위시리스트 만들기" });
    await footer.scrollIntoViewIfNeeded();

    // expect: 텍스트 `make your own` 가 보인다.
    await expect(page.getByText("make your own", { exact: true })).toBeVisible();

    // expect: 링크 `내 위시리스트 만들기` 가 보이고 href 가 `/login` 이다.
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute("href", "/login");

    // 2. 푸터를 확인합니다. (링크는 href 만 단언하고 외부 링크는 클릭하지 않음)
    // expect: 푸터에 `뭐갖고싶어` 텍스트가 보인다.
    await expect(footer.getByText("뭐갖고싶어", { exact: true })).toBeVisible();

    // expect: 링크 `이용약관` 의 href 가 `/terms` 이다.
    await expect(footer.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/terms",
    );

    // expect: 링크 `개인정보 처리방침` 의 href 가 `/privacy` 이다.
    await expect(footer.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute(
      "href",
      "/privacy",
    );

    // expect: 링크 `문의하기` 의 href 가 `https://forms.gle/WYpBboXs3WphC7ai6` 이다.
    await expect(footer.getByRole("link", { name: "문의하기" })).toHaveAttribute(
      "href",
      "https://forms.gle/WYpBboXs3WphC7ai6",
    );

    // expect: 저작권 문구가 정규식 `/© \d{4} 뭐갖고싶어/` 와 일치한다.
    await expect(footer.getByText(/© \d{4} 뭐갖고싶어/)).toBeVisible();

    // 3. 링크 `내 위시리스트 만들기` 를 클릭합니다. (도착 URL 확인만 하고 로그인 페이지의 Google/Kakao 버튼 등 어떤 요소도 클릭하지 않음)
    const postRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") {
        postRequests.push(request.url());
      }
    });
    await ctaLink.click();

    // expect: URL 이 `http://localhost:3200/login` 으로 바뀌고 pathname 이 `/login` 이다.
    await expect(page).toHaveURL("/login");
    expect(new URL(page.url()).pathname).toBe("/login");

    // expect: OAuth 이동이나 쓰기 요청이 발생하지 않는다.
    expect(new URL(page.url()).origin).toBe("http://localhost:3200");
    expect(postRequests).toEqual([]);

    // 4. 브라우저 뒤로 가기를 실행합니다.
    await page.goBack();

    // expect: `/sample` 로 돌아오고 레벨 1 제목 `민지님의 위시리스트` 가 다시 보인다.
    await expect(page).toHaveURL("/sample");
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // 5. 헤더의 링크 `뭐갖고싶어` 를 클릭합니다.
    await page.locator("header").first().getByRole("link", { name: "뭐갖고싶어" }).click();

    // expect: URL 의 pathname 이 `/` 로 바뀐다 (홈으로 이동).
    await expect(page).toHaveURL("/");
    expect(new URL(page.url()).pathname).toBe("/");
  });
});
