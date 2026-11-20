// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

const WON = "₩";

test.describe("Wishlist Reset", () => {
  test("Cancel Reset Wishlist", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] 선물 1개·메시지 1개로 seedAdmin 하고 signIn 한 뒤 `/admin/settings` 에서 버튼 `위시리스트 초기화` 를 기다립니다.
    const admin = await seedAdmin({
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
      messages: [
        {
          senderName: "이친구",
          body: "이어폰에 보태요",
          wishItemIndex: 0,
          amount: 30_000,
        },
      ],
    });
    const wishlistId = admin.wishlistId as string;
    await signIn(admin);

    await page.goto("/admin/settings");
    const resetButton = page.getByRole("button", { name: "위시리스트 초기화" });
    await expect(resetButton).toBeVisible({ timeout: 30_000 });

    // expect: `새 생일 준비` 섹션에 설명이 있다.
    await expect(
      page.getByText(
        "지난 생일의 선물, 메시지, 모인 금액 기록을 모두 지우고 새로 시작해요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.",
      ),
    ).toBeVisible();

    // 2. 클릭 전에 dialog 핸들러를 걸고(취소) 버튼 `위시리스트 초기화` 를 누릅니다.
    let dialogType = "";
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogType = dialog.type();
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await resetButton.click();

    // expect: 확인 창 종류가 `confirm`, 메시지가 안내 문구이다.
    await expect.poll(() => dialogType, { timeout: 10_000 }).toBe("confirm");
    expect(dialogMessage).toBe(
      "위시리스트를 초기화할까요? 등록한 선물, 받은 메시지, 모인 금액 기록이 모두 삭제되고 되돌릴 수 없어요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.",
    );

    // 3. [e2eDb 조회, 코드 근거] 선물·메시지·후원 기록을 조회합니다.
    // expect: 취소하면 제출이 막혀 `wish_items` 1행(30000), `messages` 1행, `funding_logs` 1행(30000)이 그대로이다.
    // (고정 대기 없이 토스트 count 0 을 단언하면 그 시점에 항상 참이라 넣지 않고, 아래 DB 와 `/admin` 서버 렌더로 확인한다.)
    const items = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.wishlistId, wishlistId));
    expect(items).toHaveLength(1);
    expect(items[0].fundedAmount).toBe(30_000);

    const messageRows = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.wishlistId, wishlistId));
    expect(messageRows).toHaveLength(1);

    const logs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, admin.items[0].id));
    expect(logs).toHaveLength(1);
    expect(logs[0].amount).toBe(30_000);

    // 4. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다.
    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // expect: `선물` `1개`, `메시지` `1개`, `모인 금액` `₩30,000` 이다(서버 렌더, 취소 뒤 지표 그대로).
    const main = page.getByRole("main");
    const metric = (label: string) =>
      main.getByText(label, { exact: true }).locator("xpath=..");
    await expect(metric("선물").locator("p").nth(1)).toHaveText("1개");
    await expect(metric("메시지").locator("p").nth(1)).toHaveText("1개");
    await expect(metric("모인 금액").locator("p").nth(1)).toHaveText(
      `${WON}30,000`,
    );
  });
});
