// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Send Message", () => {
  test("Send Congratulation Message", async ({
    page,
    seedWishlist,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목 `E2E 메시지 위시리스트` 가 보일 때까지 대기합니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 메시지 위시리스트",
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

    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 메시지 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const messageForm = page.locator("details").filter({ hasText: "gift note" });

    // expect: 메시지 폼 `details` 가 닫혀 있다 (`open` 이 false).
    await expect(messageForm).toHaveJSProperty("open", false);

    // expect: summary 에 `gift note`, `축하 메시지 남기기`, `결제 없이 메시지만 전할 수 있어요.` 가 보인다.
    const summary = messageForm.locator("summary");
    await expect(summary.getByText("gift note", { exact: true })).toBeVisible();
    await expect(
      summary.getByText("축하 메시지 남기기", { exact: true }),
    ).toBeVisible();
    await expect(
      summary.getByText("결제 없이 메시지만 전할 수 있어요.", { exact: true }),
    ).toBeVisible();

    // 2. summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다. 메시지 폼 범위에서 `이름` 에 `테스트친구`, `메시지` 에 `생일 축하해! 항상 건강하세요` 를 입력합니다.
    await summary.getByText("축하 메시지 남기기", { exact: true }).click();

    // expect: `details` 가 열린다 (`open` 이 true).
    await expect(messageForm).toHaveJSProperty("open", true);

    const senderInput = messageForm.getByRole("textbox", { name: "이름" });
    const bodyInput = messageForm.getByRole("textbox", { name: "메시지" });
    await senderInput.fill("테스트친구");
    await bodyInput.fill("생일 축하해! 항상 건강하세요");

    // expect: `이름`(`#message-sender`)과 `메시지`(`#message-body`)에 입력값이 그대로 표시되고 버튼 `마음 보내기` 가 활성이다.
    await expect(senderInput).toHaveValue("테스트친구");
    await expect(bodyInput).toHaveValue("생일 축하해! 항상 건강하세요");
    const sendButton = messageForm.getByRole("button", { name: "마음 보내기" });
    await expect(sendButton).toBeEnabled();

    // 3. 메시지 폼 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    await sendButton.click();

    // expect: 토스트 `축하 메시지가 전해졌어요.` 가 표시되고 `data-type` 이 `success` 이다.
    const successToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "축하 메시지가 전해졌어요." });
    await expect(successToast).toBeVisible({ timeout: 15_000 });
    await expect(successToast).toHaveAttribute("data-type", "success");

    // expect: 그 토스트 안에 버튼 `나도 만들기` 가 보인다 (클릭하지 않음).
    await expect(
      successToast.getByRole("button", { name: "나도 만들기" }),
    ).toBeVisible();

    // expect: 계좌 모달(`role=dialog`)은 나타나지 않는다 (`getByRole('dialog')` count 0).
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // 4. URL 을 확인합니다. (`?sent=message` 는 클라이언트가 `router.replace` 로 지움)
    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // expect: 페이지 본문 어디에도 방금 입력한 메시지 `생일 축하해! 항상 건강하세요` 가 표시되지 않는다 (축하 메시지는 공개 페이지에 노출되지 않음).
    await expect(page.getByText("생일 축하해! 항상 건강하세요")).toHaveCount(0);

    // 5. [e2eDb 조회, 코드 근거] `messages` 를 `wishlistId = seed 의 wishlistId` 로 조회합니다. (`expect.poll` 로 행이 보일 때까지 대기)
    const readMessages = () =>
      e2eDb.select().from(messages).where(eq(messages.wishlistId, wishlistId));

    // expect: `messages` 행이 정확히 1개이다.
    await expect.poll(async () => (await readMessages()).length).toBe(1);

    // expect: 그 행의 `wishItemId` 가 `null` 이다 (메시지 전용 제출).
    // expect: 그 행의 `body` 가 `생일 축하해! 항상 건강하세요` 이고 `senderName` 이 `테스트친구` 이다.
    const [savedMessage] = await readMessages();
    expect(savedMessage.wishItemId).toBeNull();
    expect(savedMessage.body).toBe("생일 축하해! 항상 건강하세요");
    expect(savedMessage.senderName).toBe("테스트친구");

    // expect: `funding_logs`(`wishItemId = items[0].id`)가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.
    const savedFundingLogs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, items[0].id));
    expect(savedFundingLogs).toHaveLength(0);

    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, items[0].id));
    expect(savedItem.fundedAmount).toBe(30_000);
  });
});
