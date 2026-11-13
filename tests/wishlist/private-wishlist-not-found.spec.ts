// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { test, expect } from "../fixtures/wishlist";

test.describe("Private Wishlist", () => {
  test("Private Wishlist Not Found", async ({ page, seedWishlist }) => {
    // 1. [사전 조건] `seedWishlist({ ..., visibility: "private", ... })` 를 호출합니다.
    const { slug } = await seedWishlist({
      title: "E2E 비공개 위시리스트",
      visibility: "private",
      items: [
        {
          title: "비공개 무선 이어폰",
          targetAmount: 100_000,
          fundedAmount: 30_000,
        },
      ],
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "김친구",
        accountNumber: "123-456-789012",
        visibility: "always_visible",
      },
    });

    // expect: `slug` 가 반환된다.
    expect(slug).toMatch(/^e2e-/);

    // 2. 새 페이지에서 `/wishlist/${slug}` 로 이동하고, 레벨 1 제목 `위시리스트를 찾을 수 없어요` 가 보일 때까지 대기합니다.
    await page.goto(`/wishlist/${slug}`);

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

    // expect: 링크 `처음으로` 가 보이고 href 가 `/` 이다 (클릭하지 않음).
    const homeLink = page.getByRole("link", { name: "처음으로" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");

    // expect: 문서 title 이 `위시리스트를 찾을 수 없어요` 이다.
    await expect(page).toHaveTitle("위시리스트를 찾을 수 없어요");

    // expect: URL 은 `/wishlist/${slug}` 그대로이다 (리다이렉트 없음).
    await expect(page).toHaveURL(`/wishlist/${slug}`);

    // expect: HTTP 상태 코드는 단언하지 않는다 (탐색에서 not-found 도 200 으로 관찰됨).

    // 3. 비공개 위시리스트의 데이터가 노출되지 않는지 확인합니다. (부정 검증)
    // expect: 페이지에 `E2E 비공개 위시리스트`, `비공개 무선 이어폰`, `E2E은행`, `123-456-789012` 텍스트가 없다 (count 0).
    await expect(page.getByText("E2E 비공개 위시리스트")).toHaveCount(0);
    await expect(page.getByText("비공개 무선 이어폰")).toHaveCount(0);
    await expect(page.getByText("E2E은행")).toHaveCount(0);
    await expect(page.getByText("123-456-789012")).toHaveCount(0);

    // expect: `공유하기` 버튼, `축하 메시지 남기기`, `이 선물에 마음 보태기`, `article` 이 존재하지 않는다.
    await expect(page.getByRole("button", { name: "공유하기" })).toHaveCount(0);
    await expect(page.getByText("축하 메시지 남기기")).toHaveCount(0);
    await expect(page.getByText("이 선물에 마음 보태기")).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(0);
  });
});
