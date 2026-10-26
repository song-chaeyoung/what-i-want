// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Page Overview", () => {
  test("Header and Summary", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    await page.goto("/sample");

    const heading = page.getByRole("heading", {
      level: 1,
      name: "민지님의 위시리스트",
    });
    // expect: 페이지가 정상 렌더링된다.
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // 2. 헤더 영역(첫 번째 `header`)의 요소를 확인합니다.
    const header = page.locator("header").first();

    // expect: 링크 `뭐갖고싶어` 가 보이고 href 가 `/` 이다.
    const homeLink = header.getByRole("link", { name: "뭐갖고싶어", exact: true });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");

    // expect: pill 텍스트 `birthday wishlist` 가 보인다.
    await expect(
      header.getByText("birthday wishlist", { exact: true }),
    ).toBeVisible();

    // expect: 생일 배지가 정규식 `/^5월 15일 · (D-\d+|D-DAY)$/` 와 일치하며 보인다 (날짜에 따라 숫자 변동).
    await expect(header.getByText(/^5월 15일 · (D-\d+|D-DAY)$/)).toBeVisible();

    // expect: 정확히 일치하는 텍스트 `SAMPLE` pill 이 보인다.
    await expect(header.getByText("SAMPLE", { exact: true })).toBeVisible();

    // expect: 버튼 `공유하기` 가 보인다.
    await expect(header.getByRole("button", { name: "공유하기" })).toBeVisible();

    // 3. 제목과 소개문을 확인합니다.
    // expect: 레벨 1 제목이 `민지님의 위시리스트` 이다.
    await expect(heading).toHaveText("민지님의 위시리스트");

    // expect: 소개문 `올해도 함께 축하해줘서 고마워요. 편하게 골라주세요!` 가 보인다.
    await expect(
      page.getByText("올해도 함께 축하해줘서 고마워요. 편하게 골라주세요!"),
    ).toBeVisible();

    // 4. 요약 정의 목록(dl)을 확인합니다.
    const summary = page.locator("dl").first();
    const statDefinition = (term: RegExp) =>
      summary
        .locator("div")
        .filter({ has: page.locator("dt").filter({ hasText: term }) })
        .locator("dd");

    // expect: 용어 `선물` 의 정의가 `2개` 이다.
    await expect(statDefinition(/^선물$/)).toHaveText("2개");

    // expect: 용어 `모인 마음` 의 정의가 `₩43,040` 이다 (32,400 + 10,640 의 합계).
    await expect(statDefinition(/^모인 마음$/)).toHaveText("₩43,040");
  });
});
