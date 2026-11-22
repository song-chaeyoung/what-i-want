import { test, expect } from "../fixtures/admin";

// 관리자 홈·설정·초기화·로그아웃 탐색용 seed. 선물·메시지·계좌가 있는 온보딩 완료 사용자로 /admin 을 연다.
test("seed", async ({ page, seedAdmin, signIn }) => {
  const admin = await seedAdmin({
    items: [
      { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      { title: "캠핑 의자", targetAmount: 80_000, status: "paused" },
      { title: "보드게임", targetAmount: 40_000, status: "fulfilled" },
      { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" },
      { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 5_000 },
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
    bankAccount: {
      bankName: "E2E은행",
      accountHolder: "E2E 관리자",
      accountNumber: "123-456-789012",
      visibility: "copy_only",
    },
  });
  await signIn(admin);

  await page.goto("/admin");
  await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
});
