// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Cancel Delete Wish", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] `seedAdmin({ items: [무선 이어폰 30,000/100,000], messages: [이친구 30,000] })`, `signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `무선 이어폰` 을 기다립니다(timeout 30초).
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
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(
      page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    ).toBeVisible({ timeout: 30_000 });

    // 2. `page.once('dialog', ...)` 로 메시지를 기록하고 `dismiss()` 하도록 건 뒤, `무선 이어폰` 카드를 열어 버튼 `삭제` 를 누릅니다.
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    const card = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    });
    await card.locator("summary").click();
    await card.getByRole("button", { name: "삭제" }).click();

    // expect: 확인 창 메시지가 모인 금액이 있는 선물 문구이다(코드 근거).
    expect(dialogMessage).toBe(
      "이 선물을 삭제할까요? 이 선물에 모인 금액 기록도 함께 삭제되고 되돌릴 수 없어요. 받은 메시지는 메시지함에 남아요.",
    );

    // expect: 토스트가 나타나지 않고(`[data-sonner-toast]` count 0), URL 이 `/admin/wishes` 그대로이며, 카드 `무선 이어폰` 이 남는다.
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/wishes$/);
    await expect(
      page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    ).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] `wish_items`(`id = items[0].id`)와 그 `funding_logs` 를 조회합니다.
    const remainingWishes = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, admin.items[0].id));
    const remainingLogs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, admin.items[0].id));

    // expect: 선물 행이 남고 `fundedAmount` 는 `30000` 이며, 참여 기록 1건이 남는다.
    expect(remainingWishes).toHaveLength(1);
    expect(remainingWishes[0].fundedAmount).toBe(30_000);
    expect(remainingLogs).toHaveLength(1);
  });
});
