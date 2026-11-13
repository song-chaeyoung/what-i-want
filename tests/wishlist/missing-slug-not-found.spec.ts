// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { test, expect } from "../fixtures/wishlist";

test.describe("Missing Slug", () => {
  test("Missing Slug Not Found", async ({ page }) => {
    // 1. [사전 조건] `seedWishlist` 를 호출하지 않습니다. 새 페이지에서 존재하지 않는 slug 로 `/wishlist/e2e-does-not-exist-000` 에 이동하고, 레벨 1 제목 `위시리스트를 찾을 수 없어요` 가 보일 때까지 대기합니다.
    await page.goto("/wishlist/e2e-does-not-exist-000");

    // expect: 레벨 1 제목이 `위시리스트를 찾을 수 없어요` 이다.
    await expect(
      page.getByRole("heading", { level: 1, name: "위시리스트를 찾을 수 없어요" }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: pill `404`(`getByText('404', { exact: true })`)가 보인다.
    await expect(page.getByText("404", { exact: true })).toBeVisible();

    // expect: 문단 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.` 가 보인다.
    await expect(
      page.getByText("주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.", {
        exact: true,
      }),
    ).toBeVisible();

    // expect: 링크 `처음으로` 가 보이고 href 가 `/` 이다.
    const homeLink = page.getByRole("link", { name: "처음으로" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");

    // expect: 문서 title 이 `위시리스트를 찾을 수 없어요` 이고 URL 은 `/wishlist/e2e-does-not-exist-000` 그대로이다.
    await expect(page).toHaveTitle("위시리스트를 찾을 수 없어요");
    await expect(page).toHaveURL("/wishlist/e2e-does-not-exist-000");

    // 2. 위시리스트 화면 요소가 없는지 확인합니다. (부정 검증)
    // expect: `공유하기` 버튼, `계좌 안내`, `축하 메시지 남기기`, `이 선물에 마음 보태기`, `선물`/`모인 마음` 요약, `article` 이 존재하지 않는다.
    await expect(page.getByRole("button", { name: "공유하기" })).toHaveCount(0);
    await expect(page.getByText("계좌 안내", { exact: true })).toHaveCount(0);
    await expect(page.getByText("축하 메시지 남기기", { exact: true })).toHaveCount(0);
    await expect(page.getByText("이 선물에 마음 보태기", { exact: true })).toHaveCount(0);
    await expect(page.getByText("선물", { exact: true })).toHaveCount(0);
    await expect(page.getByText("모인 마음", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(0);

    // expect: `getByRole('main')` 이 1개이다 (제목을 기다린 뒤에는 로딩 셸이 아니라 not-found 화면의 `main` 만 남음).
    await expect(page.getByRole("main")).toHaveCount(1);
  });
});
