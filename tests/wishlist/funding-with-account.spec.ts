// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { eq } from "drizzle-orm";
import { fundingLogs, messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/wishlist";

test.describe("Funding With Account", () => {
  test("Funding With Account", async ({ page, seedWishlist, e2eDb }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목 `E2E 후원 위시리스트` 가 보일 때까지 대기합니다.
    const { slug, wishlistId, items } = await seedWishlist({
      title: "E2E 후원 위시리스트",
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
      page.getByRole("heading", { level: 1, name: "E2E 후원 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const card = page.getByRole("article").filter({ hasText: "무선 이어폰" });
    const gatheredAmount = page.locator('dt:text-is("모인 마음") + dd');
    const giftCount = page.locator('dt:text-is("선물") + dd');
    const accountSection = page
      .locator("details")
      .filter({ hasText: "gift account" });

    // expect: 카드 `무선 이어폰` 에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보인다.
    await expect(card.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("30% 달성", { exact: true })).toBeVisible();

    // expect: 요약 `모인 마음` 이 `₩30,000`, `선물` 이 `1개` 이다.
    await expect(gatheredAmount).toHaveText("₩30,000");
    await expect(giftCount).toHaveText("1개");

    // expect: `계좌 안내` 섹션이 열려 있고 `김친구`, `E2E은행 123-456-789012` 가 보인다.
    await expect(accountSection).toHaveJSProperty("open", true);
    await expect(accountSection.getByText("계좌 안내", { exact: true })).toBeVisible();
    await expect(accountSection.getByText("김친구", { exact: true })).toBeVisible();
    await expect(
      accountSection.getByText("E2E은행 123-456-789012", { exact: true }),
    ).toBeVisible();

    // expect: `getByRole('dialog')` 가 0개이다.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // 2. 카드 `무선 이어폰` 안의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    await card.getByText("이 선물에 마음 보태기", { exact: true }).click();

    // expect: 카드 안에 소제목 `마음 보내기` 가 보인다.
    await expect(
      card.locator("p").filter({ hasText: /^마음 보내기$/ }),
    ).toBeVisible();

    // expect: 스핀버튼 `보낼 마음`(`#participation-amount-<itemId>`, placeholder `10000`, min 1)과 텍스트박스 `이름`, `메시지` 가 보인다.
    const amountInput = card.getByRole("spinbutton", { name: "보낼 마음" });
    const senderInput = card.getByRole("textbox", { name: "이름" });
    const bodyInput = card.getByRole("textbox", { name: "메시지" });
    await expect(amountInput).toBeVisible();
    await expect(amountInput).toHaveAttribute(
      "id",
      `participation-amount-${itemId}`,
    );
    await expect(amountInput).toHaveAttribute("placeholder", "10000");
    await expect(amountInput).toHaveAttribute("min", "1");
    await expect(senderInput).toBeVisible();
    await expect(bodyInput).toBeVisible();

    // expect: 안내 문구 `여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.` 가 보인다.
    await expect(
      card.getByText(
        "여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.",
        { exact: true },
      ),
    ).toBeVisible();

    // expect: 카드 범위의 버튼 `마음 보내기` 가 활성이다.
    const sendButton = card.getByRole("button", { name: "마음 보내기" });
    await expect(sendButton).toBeEnabled();

    // 3. 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `후원친구`, `메시지` 에 `이어폰 사는 데 보태세요` 를 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트와 모달을 확인합니다.
    await amountInput.fill("10000");
    await senderInput.fill("후원친구");
    await bodyInput.fill("이어폰 사는 데 보태세요");
    await sendButton.click();

    // expect: 토스트 `마음이 전해졌어요.` 가 표시되고 `data-type` 이 `success` 이다.
    const successToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "마음이 전해졌어요." });
    await expect(successToast).toBeVisible({ timeout: 15_000 });
    await expect(successToast).toHaveAttribute("data-type", "success");

    // expect: 그 토스트에는 액션 버튼이 없다 (`나도 만들기` 버튼은 토스트가 아니라 모달 안 링크로만 나온다).
    await expect(successToast.getByRole("button")).toHaveCount(0);

    // expect: `getByRole('dialog', { name: '마음이 전해졌어요' })` 가 보인다.
    const dialog = page.getByRole("dialog", { name: "마음이 전해졌어요" });
    await expect(dialog).toBeVisible();

    // expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    expect(new URL(page.url()).search).toBe("");

    // 4. 모달 범위(`dialog`)로 좁혀 내용을 확인합니다. (본문 `계좌 안내` 섹션에도 같은 계좌가 있으므로 반드시 `dialog` 안에서 찾기)
    // expect: dialog 안에 h2 `마음이 전해졌어요` 와 `아래 계좌로 보내주시면 전달이 완료돼요.` 가 보인다.
    await expect(
      dialog.getByRole("heading", { level: 2, name: "마음이 전해졌어요" }),
    ).toBeVisible();
    await expect(
      dialog.getByText("아래 계좌로 보내주시면 전달이 완료돼요.", {
        exact: true,
      }),
    ).toBeVisible();

    // expect: dialog 안에 `예금주`, `김친구`, `E2E은행 123-456-789012` 가 보인다.
    await expect(dialog.getByText("예금주", { exact: true })).toBeVisible();
    await expect(dialog.getByText("김친구", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText("E2E은행 123-456-789012", { exact: true }),
    ).toBeVisible();

    // expect: dialog 안에 버튼 `계좌번호 복사`, 문구 `잘못 보냈다면 생일자에게 알려주세요.`, 링크 `나도 만들기`(href `/login?utm_source=post_participation&utm_medium=cta`, 클릭하지 않음), 버튼 `닫기` 가 보인다.
    await expect(
      dialog.getByRole("button", { name: "계좌번호 복사" }),
    ).toBeVisible();
    await expect(
      dialog.getByText("잘못 보냈다면 생일자에게 알려주세요.", { exact: true }),
    ).toBeVisible();
    const createLink = dialog.getByRole("link", { name: "나도 만들기" });
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute(
      "href",
      "/login?utm_source=post_participation&utm_medium=cta",
    );
    const closeButton = dialog.getByRole("button", { name: "닫기" });
    await expect(closeButton).toBeVisible();

    // 5. 카드와 요약의 금액·진행률을 확인합니다. (페이지 캐시는 성공 제출에서 즉시 무효화됨)
    // expect: 카드 `무선 이어폰` 의 모인 금액이 `₩40,000` 으로 바뀌고(30,000 -> 40,000), `₩100,000 중`, `40% 달성` 이며 진행 막대 width 가 `40%` 이다.
    await expect(card.getByText("₩40,000", { exact: true })).toBeVisible();
    await expect(card.getByText("₩100,000 중", { exact: true })).toBeVisible();
    await expect(card.getByText("40% 달성", { exact: true })).toBeVisible();
    await expect(card.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*40%/,
    );

    // expect: 상태 라벨은 `마음 모으는 중` 그대로이고 `이 선물에 마음 보태기` summary 도 계속 보인다 (아직 미달성).
    await expect(card.getByText("마음 모으는 중", { exact: true })).toBeVisible();
    await expect(
      card.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toBeVisible();

    // expect: 요약 `모인 마음` 이 `₩40,000` 이다.
    await expect(gatheredAmount).toHaveText("₩40,000");

    // 6. dialog 의 버튼 `닫기` 를 클릭합니다.
    await closeButton.click();

    // expect: `getByRole('dialog')` 가 0개가 된다 (모달이 닫힘).
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: URL 은 `/wishlist/${slug}` 그대로이고 카드 금액 `₩40,000` 도 그대로이다.
    await expect(page).toHaveURL(new RegExp(`/wishlist/${slug}$`));
    await expect(card.getByText("₩40,000", { exact: true })).toBeVisible();

    // 7. [e2eDb 조회, 코드 근거] `funding_logs`(`wishItemId = items[0].id`), `messages`(`wishlistId = seed 의 wishlistId`), `wish_items`(`id = items[0].id`)를 조회합니다. (`expect.poll` 로 대기)
    const readFundingLogs = () =>
      e2eDb.select().from(fundingLogs).where(eq(fundingLogs.wishItemId, itemId));
    const readMessages = () =>
      e2eDb.select().from(messages).where(eq(messages.wishlistId, wishlistId));

    // expect: `funding_logs` 가 정확히 1행이고 `amount` 가 `10000` 이다.
    await expect.poll(async () => (await readFundingLogs()).length).toBe(1);
    const [savedFundingLog] = await readFundingLogs();
    expect(savedFundingLog.amount).toBe(10_000);

    // expect: `messages` 가 정확히 1행이고 `wishItemId` 가 `items[0].id` 이며 `senderName` 이 `후원친구`, `body` 가 `이어폰 사는 데 보태세요` 이다.
    await expect.poll(async () => (await readMessages()).length).toBe(1);
    const [savedMessage] = await readMessages();
    expect(savedMessage.wishItemId).toBe(itemId);
    expect(savedMessage.senderName).toBe("후원친구");
    expect(savedMessage.body).toBe("이어폰 사는 데 보태세요");

    // expect: `wish_items.funded_amount` 가 `40000` 이다.
    const [savedItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, itemId));
    expect(savedItem.fundedAmount).toBe(40_000);
  });
});
