// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Delete Wish", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] `seedAdmin({ items: [보드게임, 무선 이어폰] })`, `signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `보드게임` 을 기다립니다.
    const admin = await seedAdmin({
      items: [
        { title: "보드게임", targetAmount: 40_000 },
        { title: "무선 이어폰", targetAmount: 100_000 },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(
      page.getByRole("heading", { level: 3, name: "보드게임" }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: 지표 `총 선물` 이 `2개` 이다.
    await expect(page.getByText("총 선물", { exact: true })).toBeVisible();
    await expect(page.getByText("2개", { exact: true })).toBeVisible();

    // 2. `page.once('dialog', ...)` 로 메시지를 기록하고 `accept()` 하도록 건 뒤, `보드게임` 카드를 열어 버튼 `삭제` 를 누릅니다.
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    const card = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "보드게임" }),
    });
    await card.locator("summary").click();
    await card.getByRole("button", { name: "삭제" }).click();

    // expect: 토스트 `선물을 삭제했어요.`(`data-type` `success`)가 보인다.
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "선물을 삭제했어요." });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("data-type", "success");

    // expect: 확인 창 메시지가 `이 선물을 삭제할까요? 삭제하면 되돌릴 수 없어요.` 이다(모인 금액 없는 선물 문구, 코드 근거).
    expect(dialogMessage).toBe("이 선물을 삭제할까요? 삭제하면 되돌릴 수 없어요.");

    // expect: URL 이 `/admin/wishes` 로 정리되고, 레벨 3 제목 `보드게임` 이 없고 `무선 이어폰` 은 남는다.
    await expect(page).toHaveURL(/\/admin\/wishes$/);
    await expect(
      page.getByRole("heading", { level: 3, name: "보드게임" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    ).toBeVisible();

    // expect: 지표 `총 선물` 이 `1개` 이다.
    await expect(page.getByText("1개", { exact: true })).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    const loadWishes = () =>
      e2eDb
        .select()
        .from(wishItems)
        .where(eq(wishItems.wishlistId, admin.wishlistId!));
    await expect.poll(async () => (await loadWishes()).length).toBe(1);

    // expect: 1행이고 그 `id` 가 `items[1].id`(무선 이어폰)이다. `items[0].id` 행은 없다.
    const remaining = await loadWishes();
    expect(remaining[0].id).toBe(admin.items[1].id);
    expect(remaining.map((wish) => wish.id)).not.toContain(admin.items[0].id);
  });
});
