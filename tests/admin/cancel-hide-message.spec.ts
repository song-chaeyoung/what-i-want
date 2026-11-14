// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { messages } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Message Management", () => {
  test("Cancel Hide Message", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin({ messages: [김친구 생일 축하해!] }), signIn(admin). `/admin/messages` 로 이동해 행 `생일 축하해!` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin({
      messages: [{ senderName: "김친구", body: "생일 축하해!" }],
    });
    await signIn(admin);

    await page.goto("/admin/messages");
    const row = page.getByRole("article").filter({ hasText: "생일 축하해!" });
    await expect(row).toBeVisible({ timeout: 30_000 });

    // 2. `page.once('dialog', ...)` 로 메시지를 기록하고 `dismiss()` 하도록 건 뒤 행의 `숨기기` 를 누릅니다.
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await row.getByRole("button", { name: "숨기기" }).click();

    // expect: 확인 창 메시지가 `이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.` 이다(금액 없는 메시지 문구, 코드 근거).
    expect(dialogMessage).toBe(
      "이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.",
    );

    // expect: 토스트가 나타나지 않고(`[data-sonner-toast]` count 0), URL 이 `/admin/messages` 그대로이며, 행 `생일 축하해!` 가 남는다.
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/messages$/);
    await expect(row).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] `messages`(`id = messages[0].id`)를 조회합니다.
    const [message] = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.id, admin.messages[0].id));

    // expect: `isHidden` 이 `false` 이다.
    expect(message.isHidden).toBe(false);

    // 4. `숨긴 메시지` 탭을 누릅니다.
    await page
      .getByRole("navigation", { name: "메시지 필터" })
      .getByRole("link", { name: "숨긴 메시지" })
      .click();

    // expect: 행이 없고 문구 `숨긴 메시지가 없습니다.` 가 보이며 지표 값이 `0개` 이다.
    await expect(page).toHaveURL(/\/admin\/messages\?filter=hidden$/);
    await expect(page.getByText("숨긴 메시지가 없습니다.")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(page.getByText("0개", { exact: true })).toBeVisible();
  });
});
