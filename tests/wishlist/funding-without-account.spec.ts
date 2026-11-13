// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Funding Without Account", () => {
  test("Funding Without Account", async ({ page, seedWishlist, e2eDb }) => {
    // 1. [사전 조건, 코드 근거] `seedWishlist(...)` 를 호출합니다 (`bankAccount` 생략). 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다.
    const { slug, items } = await seedWishlist({
      title: "E2E 계좌 없는 위시리스트",
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
    });
    const itemId = items[0].id;

    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 계좌 없는 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const card = page.getByRole("article").filter({ hasText: "무선 이어폰" });

    // expect: `계좌 안내` 섹션(`gift account`)이 없다.
    await expect(
      page.locator("details").filter({ hasText: "gift account" }),
    ).toHaveCount(0);
    await expect(page.getByText("계좌 안내", { exact: true })).toHaveCount(0);

    // expect: 카드 `무선 이어폰` 에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보인다.
    await expect(card.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("30% 달성", { exact: true })).toBeVisible();

    // 2. 카드 `무선 이어폰` 의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    await card.getByText("이 선물에 마음 보태기", { exact: true }).click();

    // expect: 폼이 열리고 안내 문구가 `실제 선물 전달 방법은 생일자에게 직접 확인해주세요.` 이다 (계좌가 있을 때의 `여기서 결제가 되는 건 아니에요...` 문구가 아님. 코드 근거).
    const amountInput = card.getByRole("spinbutton", { name: "보낼 마음" });
    await expect(amountInput).toBeVisible();
    await expect(
      card.getByText("실제 선물 전달 방법은 생일자에게 직접 확인해주세요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      card.getByText(
        "여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.",
        { exact: true },
      ),
    ).toHaveCount(0);

    // 3. 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `후원친구`, `메시지` 에 `계좌 없이 보태요` 를 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트와 모달 유무를 확인합니다.
    await amountInput.fill("10000");
    await card.getByRole("textbox", { name: "이름" }).fill("후원친구");
    await card.getByRole("textbox", { name: "메시지" }).fill("계좌 없이 보태요");
    await card.getByRole("button", { name: "마음 보내기" }).click();

    // expect: 토스트 `마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.`(전체 문구로 단언, 부분 일치 주의)가 표시되고 `data-type` 이 `success` 이다.
    const successToast = page.locator("[data-sonner-toast]").filter({
      hasText: "마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.",
    });
    await expect(successToast).toBeVisible({ timeout: 15_000 });
    await expect(successToast).toHaveAttribute("data-type", "success");

    // expect: 그 토스트 안에 액션 버튼 `나도 만들기` 가 보인다 (계좌가 없으면 모달 대신 토스트에 CTA 가 붙음. 클릭하지 않음).
    await expect(
      successToast.getByRole("button", { name: "나도 만들기" }),
    ).toBeVisible();

    // expect: `getByRole('dialog')` 가 0개이다 (계좌 모달이 뜨지 않음).
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 4. 카드의 금액·진행률을 확인합니다.
    // expect: 카드 `무선 이어폰` 이 `₩40,000`, `₩100,000 중`, `40% 달성` 으로 갱신된다.
    await expect(card.getByText("₩40,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("40% 달성", { exact: true })).toBeVisible();

    // expect: `계좌 안내` 섹션은 여전히 없다.
    await expect(
      page.locator("details").filter({ hasText: "gift account" }),
    ).toHaveCount(0);
    await expect(page.getByText("계좌 안내", { exact: true })).toHaveCount(0);

    // 5. [e2eDb 조회, 코드 근거] `funding_logs`(`wishItemId = items[0].id`)와 `wish_items`(`id = items[0].id`)를 조회합니다.
    const readFundingLogs = () =>
      e2eDb.select().from(fundingLogs).where(eq(fundingLogs.wishItemId, itemId));

    // expect: `funding_logs` 가 정확히 1행이고 `amount` 가 `10000` 이다.
    await expect.poll(async () => (await readFundingLogs()).length).toBe(1);
    const [savedFundingLog] = await readFundingLogs();
    expect(savedFundingLog.amount).toBe(10_000);

    // expect: `wish_items.funded_amount` 가 `40000` 이다.
    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(savedItem.fundedAmount).toBe(40_000);
  });
});
