// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Message Management", () => {
  test("Hide And Restore Funded Message", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] seedAdmin({ items: [무선 이어폰], messages: [이친구 이어폰에 보태요 10,000원, 김친구 생일 축하해!] }), signIn(admin). `/admin/messages` 로 이동해 `navigation "메시지 필터"` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin({
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 40_000 },
      ],
      messages: [
        {
          senderName: "이친구",
          body: "이어폰에 보태요",
          wishItemIndex: 0,
          amount: 10_000,
        },
        { senderName: "김친구", body: "생일 축하해!" },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/messages");
    await expect(
      page.getByRole("navigation", { name: "메시지 필터" }),
    ).toBeVisible({ timeout: 30_000 });

    const articles = page.getByRole("article");
    const fundedRow = articles.filter({ hasText: "이어폰에 보태요" });
    const plainRow = articles.filter({ hasText: "생일 축하해!" });

    // expect: 지표 값 `2개`, 행(`article`) 2개가 최신순으로 `이어폰에 보태요`, `생일 축하해!` 이다.
    await expect(page.getByText("2개", { exact: true })).toBeVisible();
    await expect(articles).toHaveCount(2);
    await expect(articles.nth(0)).toContainText("이어폰에 보태요");
    await expect(articles.nth(1)).toContainText("생일 축하해!");

    // expect: `이어폰에 보태요` 행에 `무선 이어폰`, `이친구`, `₩10,000`, 버튼 `숨기기` 가 있고 `생일 축하해!` 행에는 `선물 없음`, `금액 없음` 이 있다.
    await expect(fundedRow).toContainText("무선 이어폰");
    await expect(fundedRow).toContainText("이친구");
    await expect(fundedRow).toContainText("₩10,000");
    await expect(fundedRow.getByRole("button", { name: "숨기기" })).toBeVisible();
    await expect(plainRow).toContainText("선물 없음");
    await expect(plainRow).toContainText("금액 없음");

    // 2. `page.once('dialog', ...)` 로 메시지를 기록하고 `accept()` 하도록 건 뒤 `이어폰에 보태요` 행의 `숨기기` 를 누릅니다.
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await fundedRow.getByRole("button", { name: "숨기기" }).click();

    // expect: 확인 창 메시지가 `이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.` 이다.
    expect(dialogMessage).toBe(
      "이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.",
    );

    // expect: 토스트 `참여 기록을 숨겼어요.`(`data-type` `success`)가 보이고 URL 이 `/admin/messages` 로 정리된다.
    const hideToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "참여 기록을 숨겼어요." });
    await expect(hideToast).toBeVisible();
    await expect(hideToast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/messages$/);

    // expect: 행이 `생일 축하해!` 하나만 남고 지표 값이 `1개` 이다.
    await expect(articles).toHaveCount(1);
    await expect(articles.first()).toContainText("생일 축하해!");
    await expect(page.getByText("1개", { exact: true })).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] 숨김 결과를 조회합니다(`expect.poll`).
    const loadMessage = async () =>
      (
        await e2eDb
          .select()
          .from(messages)
          .where(eq(messages.id, admin.messages[0].id))
      )[0];
    const loadItem = async () =>
      (
        await e2eDb
          .select()
          .from(wishItems)
          .where(eq(wishItems.id, admin.items[0].id))
      )[0];

    // expect: `messages`(`id = messages[0].id`)의 `isHidden` 이 `true` 이다.
    await expect.poll(async () => (await loadMessage()).isHidden).toBe(true);

    // expect: `wish_items`(`id = items[0].id`)의 `fundedAmount` 가 `30000` 이다(40,000 − 10,000).
    await expect.poll(async () => (await loadItem()).fundedAmount).toBe(30_000);

    // expect: `funding_logs`(`messageId = messages[0].id`)가 1행이고 `amount` 가 `10000` 그대로이다(로그는 지우지 않음).
    const logs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.messageId, admin.messages[0].id));
    expect(logs).toHaveLength(1);
    expect(logs[0].amount).toBe(10_000);

    // 4. 메시지 필터의 `숨긴 메시지` 탭을 누릅니다.
    await page
      .getByRole("navigation", { name: "메시지 필터" })
      .getByRole("link", { name: "숨긴 메시지" })
      .click();

    // expect: URL 이 `/admin/messages?filter=hidden` 이고 행이 `이어폰에 보태요` 하나이며 `₩10,000` 과 버튼 `숨김 해제` 가 있다(버튼 `숨기기` 없음). 지표 값 `1개`.
    await expect(page).toHaveURL(/\/admin\/messages\?filter=hidden$/);
    await expect(articles).toHaveCount(1);
    await expect(articles.first()).toContainText("이어폰에 보태요");
    await expect(articles.first()).toContainText("₩10,000");
    await expect(
      articles.first().getByRole("button", { name: "숨김 해제" }),
    ).toBeVisible();
    await expect(
      articles.first().getByRole("button", { name: "숨기기" }),
    ).toHaveCount(0);
    await expect(page.getByText("1개", { exact: true })).toBeVisible();

    // 5. `숨김 해제` 를 누릅니다(확인 창 없음).
    await articles.first().getByRole("button", { name: "숨김 해제" }).click();

    // expect: 토스트 `참여 기록을 복구했어요.`(`data-type` `success`)가 보인다.
    const restoreToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "참여 기록을 복구했어요." });
    await expect(restoreToast).toBeVisible();
    await expect(restoreToast).toHaveAttribute("data-type", "success");

    // expect: URL 이 `/admin/messages` 로 정리되어(받은 메시지함으로 돌아옴) 행 2개 `이어폰에 보태요`, `생일 축하해!` 가 보인다.
    await expect(page).toHaveURL(/\/admin\/messages$/);
    await expect(articles).toHaveCount(2);
    await expect(fundedRow).toBeVisible();
    await expect(plainRow).toBeVisible();

    // 6. [e2eDb 조회, 코드 근거] 복구 결과를 조회합니다(`expect.poll`).
    // expect: `messages[0]` 의 `isHidden` 이 `false`, `wish_items.fundedAmount` 가 `40000` 이다.
    await expect.poll(async () => (await loadMessage()).isHidden).toBe(false);
    await expect.poll(async () => (await loadItem()).fundedAmount).toBe(40_000);
  });
});
