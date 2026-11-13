// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Funding Paused Item", () => {
  test("Funding Paused Item", async ({ page, seedWishlist, e2eDb }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 일시정지 위시리스트",
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

    const title = page.getByRole("heading", {
      level: 1,
      name: "E2E 일시정지 위시리스트",
    });
    await page.goto(`/wishlist/${slug}`);
    await expect(title).toBeVisible({ timeout: 30_000 });

    const card = page.getByRole("article").filter({ hasText: "무선 이어폰" });

    // expect: 카드 `무선 이어폰` 에 상태 라벨 `마음 모으는 중`, `₩30,000`, `30% 달성` 과 summary `이 선물에 마음 보태기` 가 보인다.
    await expect(card.getByText("마음 모으는 중", { exact: true })).toBeVisible();
    await expect(card.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(card.getByText("30% 달성", { exact: true })).toBeVisible();
    await expect(
      card.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toBeVisible();

    // 2. 카드의 summary `이 선물에 마음 보태기` 를 클릭하고 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `늦은친구`, `메시지` 에 `멈춘 선물에 보태요` 를 입력합니다. **아직 제출하지 않습니다.**
    await card.getByText("이 선물에 마음 보태기", { exact: true }).click();

    const amountInput = card.getByRole("spinbutton", { name: "보낼 마음" });
    const senderInput = card.getByRole("textbox", { name: "이름" });
    const bodyInput = card.getByRole("textbox", { name: "메시지" });
    const sendButton = card.getByRole("button", { name: "마음 보내기" });
    await amountInput.fill("10000");
    await senderInput.fill("늦은친구");
    await bodyInput.fill("멈춘 선물에 보태요");

    // expect: 입력값이 그대로 표시되고 버튼 `마음 보내기` 가 활성이다.
    await expect(amountInput).toHaveValue("10000");
    await expect(senderInput).toHaveValue("늦은친구");
    await expect(bodyInput).toHaveValue("멈춘 선물에 보태요");
    await expect(sendButton).toBeEnabled();

    // 3. [e2eDb 변경] 페이지를 연 채로 `e2eDb.update(wishItems).set({ status: "paused" }).where(eq(wishItems.id, items[0].id))` 로 그 소원을 `paused` 로 바꿉니다. (페이지는 이미 `open` 상태로 렌더링돼 있고 새로고침하지 않음)
    await e2eDb
      .update(wishItems)
      .set({ status: "paused" })
      .where(eq(wishItems.id, items[0].id));

    // expect: `wish_items.status` 가 `paused` 이다 (DB 조회로 확인).
    const [pausedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(pausedItem.status).toBe("paused");

    // expect: 화면의 폼은 변하지 않고 그대로 열려 있다.
    await expect(card.locator("details")).toHaveJSProperty("open", true);
    await expect(amountInput).toHaveValue("10000");
    await expect(senderInput).toHaveValue("늦은친구");
    await expect(bodyInput).toHaveValue("멈춘 선물에 보태요");

    // 4. 카드 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    await sendButton.click();

    // expect: 토스트 `지금은 마음을 보탤 수 없는 선물이에요.` 가 표시되고 `data-type` 이 `error` 이다.
    const errorToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "지금은 마음을 보탤 수 없는 선물이에요." });
    await expect(errorToast).toBeVisible({ timeout: 15_000 });
    await expect(errorToast).toHaveAttribute("data-type", "error");

    // expect: 성공 토스트와 계좌 모달(`role=dialog`)이 나타나지 않는다.
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "마음이 전해졌어요." }),
    ).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다 (`expect(page).toHaveURL(...)` 로 대기).
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 5. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `wish_items`, `funding_logs`, `messages` 를 조회합니다.
    // expect: `wish_items.funded_amount` 가 `30000` 그대로이다.
    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(savedItem.fundedAmount).toBe(30_000);

    // expect: `funding_logs`(`wishItemId = items[0].id`)가 0행이다.
    const savedFundingLogs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, itemId));
    expect(savedFundingLogs).toHaveLength(0);

    // expect: `messages`(`wishlistId = seed 의 wishlistId`)가 0행이다 (롤백).
    const savedMessages = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.wishlistId, wishlistId));
    expect(savedMessages).toHaveLength(0);
  });
});
