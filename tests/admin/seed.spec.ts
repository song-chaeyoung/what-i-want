import { test, expect } from "../fixtures/admin";

// 관리자 화면 탐색용 seed. 온보딩을 마친 사용자로 로그인해 상태별 선물과 메시지가 있는 선물 관리를 연다.
test("seed", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin({
    items: [
      { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      { title: "캠핑 의자", targetAmount: 80_000, status: "paused" },
      { title: "보드게임", targetAmount: 40_000, status: "fulfilled" },
      { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" },
    ],
    messages: [
      { senderName: "김친구", body: "생일 축하해!" },
      {
        senderName: "이친구",
        body: "이어폰에 보태요",
        wishItemIndex: 0,
        amount: 30_000,
      },
      { senderName: "박친구", body: "숨긴 메시지", isHidden: true },
    ],
  });
  await signIn(admin);

  await page.goto("/admin/wishes");
  await expect(page.getByRole("heading", { name: "무선 이어폰" })).toBeVisible({
    timeout: 30_000,
  });
});
