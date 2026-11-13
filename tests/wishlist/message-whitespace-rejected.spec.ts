// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Whitespace Message", () => {
  test("Whitespace Message Rejected", async ({
    page,
    seedWishlist,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 공백 메시지 위시리스트",
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
      page.getByRole("heading", { level: 1, name: "E2E 공백 메시지 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const messageForm = page.locator("details").filter({ hasText: "gift note" });
    await messageForm
      .locator("summary")
      .getByText("축하 메시지 남기기", { exact: true })
      .click();

    // expect: 메시지 폼 `details` 가 열리고 `메시지` 텍스트박스가 보인다.
    await expect(messageForm).toHaveJSProperty("open", true);
    const bodyInput = messageForm.getByRole("textbox", { name: "메시지" });
    await expect(bodyInput).toBeVisible();

    // 2. 메시지 폼 범위에서 `메시지` 에 공백 5칸(`'     '`)을 `fill` 하고 `이름` 은 비워 둡니다. `#message-body` 의 `validity` 를 확인합니다.
    await bodyInput.fill("     ");

    // expect: `#message-body` 의 `validity.valueMissing` 이 false 이고 `validity.valid` 가 true 이다 (브라우저 `required` 는 공백만 있는 값을 통과시킴. 그래서 서버까지 제출된다).
    const validity = await bodyInput.evaluate((element: HTMLTextAreaElement) => ({
      valueMissing: element.validity.valueMissing,
      valid: element.validity.valid,
    }));
    expect(validity.valueMissing).toBe(false);
    expect(validity.valid).toBe(true);

    // 3. 메시지 폼 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    await messageForm.getByRole("button", { name: "마음 보내기" }).click();

    // expect: 토스트 `메시지를 입력해주세요.` 가 표시되고 `data-type` 이 `error` 이다.
    const errorToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "메시지를 입력해주세요." });
    await expect(errorToast).toBeVisible({ timeout: 15_000 });
    await expect(errorToast).toHaveAttribute("data-type", "error");

    // expect: 성공 토스트 `축하 메시지가 전해졌어요.` 는 나타나지 않는다.
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "축하 메시지가 전해졌어요." }),
    ).toHaveCount(0);

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 4. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후(서버 액션이 끝난 뒤) `messages`(`wishlistId = seed 의 wishlistId`)와 `funding_logs`(`wishItemId = items[0].id`)를 조회합니다.
    // expect: `messages` 가 0행이다.
    const savedMessages = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.wishlistId, wishlistId));
    expect(savedMessages).toHaveLength(0);

    // expect: `funding_logs` 가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.
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
