// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Submission Rate Limit", () => {
  test("Submission Rate Limit", async ({ page, seedWishlist, e2eDb }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. 이 테스트는 같은 slug 로 6번 제출하며, 모든 제출은 한 페이지(같은 IP·User-Agent)에서 1분 안에 끝나야 합니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 제출 제한 위시리스트",
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "김친구",
        accountNumber: "123-456-789012",
        visibility: "always_visible",
      },
    });
    const itemId = items[0].id;

    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 제출 제한 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const messageForm = page.locator("details").filter({ hasText: "gift note" });
    const readMessages = () =>
      e2eDb.select().from(messages).where(eq(messages.wishlistId, wishlistId));

    // 폼을 열고(open true 확인) 이름·메시지를 입력한 뒤 `마음 보내기` 를 클릭한다.
    const openAndSubmitMessage = async (index: number) => {
      // (a) summary `축하 메시지 남기기` 를 클릭해 폼을 열고 `open` 이 true 인지 확인
      await messageForm
        .locator("summary")
        .getByText("축하 메시지 남기기", { exact: true })
        .click();
      await expect(messageForm).toHaveJSProperty("open", true);

      // (b) 메시지 폼 범위에서 `이름` 과 `메시지` 입력
      await messageForm
        .getByRole("textbox", { name: "이름" })
        .fill(`제한친구${index}`);
      await messageForm
        .getByRole("textbox", { name: "메시지" })
        .fill(`제한 테스트 메시지 ${index}`);

      // (c) 버튼 `마음 보내기` 클릭
      await messageForm.getByRole("button", { name: "마음 보내기" }).click();
    };

    // expect: 메시지 폼 `details`(`filter({ hasText: 'gift note' })`)가 닫혀 있고 `messages` 가 0행이다 (`expect.poll` 로 확인).
    await expect(messageForm).toHaveJSProperty("open", false);
    await expect.poll(async () => (await readMessages()).length).toBe(0);

    // 2. i = 1 ~ 5 를 반복합니다. (a) 폼 열기, (b) 입력, (c) 제출, (d) `expect.poll` 로 `messages` 행 수가 `i` 가 될 때까지 대기, (e) 메시지 폼 `details` 의 `open` 이 false 로 돌아올 때까지 대기
    for (let i = 1; i <= 5; i += 1) {
      await openAndSubmitMessage(i);

      // (d) expect: 각 반복마다 `messages` 행 수가 `i` 이다 (1, 2, 3, 4, 5). 모든 행의 `wishItemId` 는 null 이다.
      await expect.poll(async () => (await readMessages()).length).toBe(i);
      for (const savedMessage of await readMessages()) {
        expect(savedMessage.wishItemId).toBeNull();
      }

      // (e) 제출 후 페이지가 다시 마운트돼 폼이 닫힐 때까지 대기 (이 대기 없이 summary 를 다시 클릭하면 열린 폼이 닫혀 버림)
      await expect(messageForm).toHaveJSProperty("open", false);
    }

    // expect: 다섯 번째까지 같은 페이지에서 `client_request_conflict` 같은 오류 없이 모두 저장된다 (위 반복에서 행 수가 1~5 로 늘어난 것으로 확인).
    // expect: 다섯 번째 제출 뒤 `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.` 문구가 페이지에 없다 (`data-type="error"` 토스트 count 0).
    await expect(
      page
        .locator('[data-sonner-toast][data-type="error"]')
        .filter({ hasText: "지금 이용자가 많아요. 잠시 후 다시 시도해주세요." }),
    ).toHaveCount(0);

    // 3. 6번째로 폼을 열고(`open` 이 false 로 돌아온 것을 확인한 뒤 summary 클릭) `이름` 에 `제한친구6`, `메시지` 에 `제한 테스트 메시지 6` 을 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트를 확인합니다.
    await openAndSubmitMessage(6);

    // expect: 토스트 `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.` 가 표시되고 `data-type` 이 `error` 이다.
    const rateLimitToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "지금 이용자가 많아요. 잠시 후 다시 시도해주세요." });
    await expect(rateLimitToast).toBeVisible({ timeout: 15_000 });
    await expect(rateLimitToast).toHaveAttribute("data-type", "error");

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 4. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `messages`(`wishlistId`), `funding_logs`(`wishItemId = items[0].id`), `wish_items`(`id = items[0].id`)를 조회합니다.
    // expect: `messages` 가 정확히 5행이다 (6번째 `제한 테스트 메시지 6` 은 저장되지 않음. body 목록이 `제한 테스트 메시지 1` ~ `5` 와 일치).
    const savedMessages = await readMessages();
    expect(savedMessages).toHaveLength(5);
    expect(savedMessages.map((savedMessage) => savedMessage.body).sort()).toEqual(
      [1, 2, 3, 4, 5].map((index) => `제한 테스트 메시지 ${index}`),
    );

    // expect: `funding_logs` 가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.
    const savedFundingLogs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, itemId));
    expect(savedFundingLogs).toHaveLength(0);

    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(savedItem.fundedAmount).toBe(30_000);
  });
});
