import { test, expect } from "../fixtures/wishlist";

// 친구 참여 흐름 탐색용 seed. 상태별 카드와 공개 계좌가 모두 있는 위시리스트를 연다.
test("seed", async ({ page, seedWishlist }) => {
  const { slug } = await seedWishlist({
    title: "E2E 친구의 위시리스트",
    items: [
      { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 50_000 },
      { title: "캠핑 의자", targetAmount: 80_000, status: "paused" },
      { title: "보드게임", targetAmount: 40_000, status: "fulfilled" },
      { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" },
    ],
    bankAccount: {
      bankName: "E2E은행",
      accountHolder: "김친구",
      accountNumber: "123-456-789012",
      visibility: "always_visible",
    },
  });

  await page.goto(`/wishlist/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "E2E 친구의 위시리스트" }),
  ).toBeVisible({ timeout: 30_000 });
});
