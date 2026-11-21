// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { test, expect } from "../fixtures/admin";

const WON = "₩";

test.describe("Admin Dashboard", () => {
  test("Dashboard Summary And Recent Lists", async ({
    page,
    seedAdmin,
    signIn,
  }) => {
    // 1. [사전 조건] 선물 5개·메시지 3개(숨김 1개)로 seedAdmin 하고 signIn 한 뒤 `/admin` 에서 `내 공개 주소` 를 기다립니다.
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
    });
    await signIn(admin);

    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const main = page.getByRole("main");

    // expect: 헤더의 링크 `공개 페이지 보기` 의 href 가 `/wishlist/${admin.slug}` 이다.
    await expect(
      main.getByRole("link", { name: "공개 페이지 보기" }),
    ).toHaveAttribute("href", `/wishlist/${admin.slug}`);

    // 2. 지표 카드 3개를 확인합니다. (카드는 라벨 `p` 의 부모 `div` 로 범위를 좁힌다)
    const metric = (label: string) =>
      main.getByText(label, { exact: true }).locator("xpath=..");

    // expect: `선물` 5개(숨긴 선물 포함, `/admin/wishes` 의 `총 선물` 과 같은 기준), 보조 문구 `등록된 선물`.
    const giftMetric = metric("선물");
    await expect(giftMetric.locator("p").nth(1)).toHaveText("5개");
    await expect(giftMetric.locator("p").nth(2)).toHaveText("등록된 선물");

    // expect: `메시지` 2개(숨긴 메시지 제외), 보조 문구 `도착한 마음`.
    const messageMetric = metric("메시지");
    await expect(messageMetric.locator("p").nth(1)).toHaveText("2개");
    await expect(messageMetric.locator("p").nth(2)).toHaveText("도착한 마음");

    // expect: `모인 금액` ₩35,000(30,000 + 5,000), 보조 문구 `전체 선물 기준`.
    const fundedMetric = metric("모인 금액");
    await expect(fundedMetric.locator("p").nth(1)).toHaveText(`${WON}35,000`);
    await expect(fundedMetric.locator("p").nth(2)).toHaveText("전체 선물 기준");

    // 3. `내 공개 주소` 영역을 확인합니다.
    // expect: 문구 `/wishlist/${admin.slug}` 가 보인다.
    await expect(
      main.getByText(`/wishlist/${admin.slug}`, { exact: true }),
    ).toBeVisible();

    // expect: 링크 `열어 보기` 의 href 가 `/wishlist/${admin.slug}` 이다.
    await expect(main.getByRole("link", { name: "열어 보기" })).toHaveAttribute(
      "href",
      `/wishlist/${admin.slug}`,
    );

    // expect: 버튼 `공유하기` 가 보인다.
    await expect(main.getByRole("button", { name: "공유하기" })).toBeVisible();

    // 4. `최근 선물` 패널을 확인합니다.
    const wishPanel = main
      .getByRole("heading", { level: 3, name: "최근 선물" })
      .locator("xpath=ancestor::section[1]");

    // expect: 레벨 3 제목 `최근 선물` 과 링크 `전체 보기`(href `/admin/wishes`)가 있다.
    await expect(
      wishPanel.getByRole("heading", { level: 3, name: "최근 선물" }),
    ).toBeVisible();
    await expect(wishPanel.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/admin/wishes",
    );

    // expect: 행이 4개뿐이며 순서·배지·금액이 맞다.
    const wishRows = wishPanel.locator(".divide-y > div");
    await expect(wishRows).toHaveCount(4);
    const expectedWishes = [
      ["무선 이어폰", "마음 모으는 중", `${WON}30,000 / ${WON}100,000`],
      ["캠핑 의자", "잠시 멈춤", `${WON}0 / ${WON}80,000`],
      ["보드게임", "완료", `${WON}0 / ${WON}40,000`],
      ["숨긴 선물", "숨김", `${WON}0 / ${WON}10,000`],
    ];
    for (const [index, texts] of expectedWishes.entries()) {
      for (const text of texts) {
        await expect(wishRows.nth(index)).toContainText(text);
      }
    }

    // expect: 5번째 선물 `필름 카메라` 는 이 패널에 없다.
    await expect(wishPanel.getByText("필름 카메라")).toHaveCount(0);

    // 5. `최근 메시지` 패널을 확인합니다.
    const messagePanel = main
      .getByRole("heading", { level: 3, name: "최근 메시지" })
      .locator("xpath=ancestor::section[1]");

    // expect: 레벨 3 제목 `최근 메시지` 와 링크 `메시지함`(href `/admin/messages`)이 있다.
    await expect(
      messagePanel.getByRole("heading", { level: 3, name: "최근 메시지" }),
    ).toBeVisible();
    await expect(
      messagePanel.getByRole("link", { name: "메시지함" }),
    ).toHaveAttribute("href", "/admin/messages");

    // expect: 행이 2개이며 순서는 김친구, 이친구 이다.
    const messageRows = messagePanel.locator(".divide-y > div");
    await expect(messageRows).toHaveCount(2);
    await expect(messageRows.nth(0)).toContainText("김친구");
    await expect(messageRows.nth(0)).toContainText("선물 없음 · 금액 없음");
    await expect(messageRows.nth(1)).toContainText("이친구");
    await expect(messageRows.nth(1)).toContainText(
      `무선 이어폰 · ${WON}30,000`,
    );

    // expect: `박친구` 와 `숨긴 메시지` 는 없다.
    await expect(messagePanel.getByText("박친구")).toHaveCount(0);
    await expect(messagePanel.getByText("숨긴 메시지")).toHaveCount(0);

    // 6. 링크 `전체 보기` 를 누릅니다.
    await wishPanel.getByRole("link", { name: "전체 보기" }).click();

    // expect: URL 이 `/admin/wishes` 가 되고 지표 `총 선물` 이 `5개` 이다.
    await expect(page).toHaveURL(/\/admin\/wishes$/, { timeout: 30_000 });
    await expect(
      page
        .getByRole("main")
        .getByText("총 선물", { exact: true })
        .locator("xpath=..")
        .locator("p")
        .nth(1),
    ).toHaveText("5개", { timeout: 30_000 });
  });
});
