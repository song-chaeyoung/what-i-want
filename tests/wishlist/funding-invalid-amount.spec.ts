// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Funding Invalid Amount", () => {
  test("Funding Invalid Amount", async ({ page, seedWishlist, e2eDb }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. 카드 `무선 이어폰` 의 summary `이 선물에 마음 보태기` 를 클릭해 폼을 엽니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 금액 오류 위시리스트",
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
      page.getByRole("heading", { level: 1, name: "E2E 금액 오류 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const card = page.getByRole("article").filter({ hasText: "무선 이어폰" });
    const gatheredAmount = page.locator('dt:text-is("모인 마음") + dd');
    await card.getByText("이 선물에 마음 보태기", { exact: true }).click();

    // expect: 카드에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보이고 `보낼 마음` 스핀버튼이 보인다.
    await expect(card.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("30% 달성", { exact: true })).toBeVisible();
    const amountInput = card.getByRole("spinbutton", { name: "보낼 마음" });
    await expect(amountInput).toBeVisible();

    // 2. 카드 범위에서 `보낼 마음` 에 `100000001`, `이름` 에 `큰손친구`, `메시지` 에 `너무 큰 금액` 을 입력하고 `보낼 마음` 의 `validity` 를 확인합니다.
    await amountInput.fill("100000001");
    await card.getByRole("textbox", { name: "이름" }).fill("큰손친구");
    await card.getByRole("textbox", { name: "메시지" }).fill("너무 큰 금액");

    // expect: `보낼 마음` 의 `validity.valid` 가 true 이고 `rangeOverflow` 가 false 이며 `max` 속성이 비어 있다 (브라우저 검증을 통과해 서버까지 제출된다).
    const validity = await amountInput.evaluate(
      (element: HTMLInputElement) => ({
        valid: element.validity.valid,
        rangeOverflow: element.validity.rangeOverflow,
        max: element.getAttribute("max"),
      }),
    );
    expect(validity.valid).toBe(true);
    expect(validity.rangeOverflow).toBe(false);
    expect(validity.max).toBeNull();

    // 3. 카드 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    await card.getByRole("button", { name: "마음 보내기" }).click();

    // expect: 토스트 `금액은 1원부터 1억 원까지 입력할 수 있어요.` 가 표시되고 `data-type` 이 `error` 이다.
    const errorToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "금액은 1원부터 1억 원까지 입력할 수 있어요." });
    await expect(errorToast).toBeVisible({ timeout: 15_000 });
    await expect(errorToast).toHaveAttribute("data-type", "error");

    // expect: 성공 토스트(`마음이 전해졌어요.`)는 나타나지 않는다.
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "마음이 전해졌어요." }),
    ).toHaveCount(0);

    // expect: 계좌 모달(`role=dialog`)이 나타나지 않는다 (`getByRole('dialog')` count 0).
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 4. 화면의 금액을 확인합니다.
    // expect: 카드 `무선 이어폰` 이 `₩30,000`, `₩100,000 중`, `30% 달성` 그대로이다 (진행 막대 width `30%`).
    await expect(card.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("30% 달성", { exact: true })).toBeVisible();
    await expect(card.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*30%/,
    );

    // expect: 요약 `모인 마음` 이 `₩30,000` 그대로이다.
    await expect(gatheredAmount).toHaveText("₩30,000");

    // 5. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `wish_items`(`id = items[0].id`), `funding_logs`(`wishItemId = items[0].id`), `messages`(`wishlistId = seed 의 wishlistId`)를 조회합니다.
    // expect: `wish_items.funded_amount` 가 `30000` 그대로이다.
    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(savedItem.fundedAmount).toBe(30_000);

    // expect: `funding_logs` 가 0행이다.
    const savedFundingLogs = await e2eDb
      .select()
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, itemId));
    expect(savedFundingLogs).toHaveLength(0);

    // expect: `messages` 가 0행이다 (금액 검증이 DB 쓰기보다 먼저라 메시지도 저장되지 않음).
    const savedMessages = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.wishlistId, wishlistId));
    expect(savedMessages).toHaveLength(0);
  });
});
