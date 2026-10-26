// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Account", () => {
  test("Account Section", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 첫 번째 `details`(계좌 안내)를 확인합니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const accountDetails = page.locator("details").filter({ hasText: "gift account" });
    const messageDetails = page.locator("details").filter({ hasText: "gift note" });
    const accountSummary = accountDetails.locator("summary");
    const accountInfo = accountDetails.getByText("민지은행 0000-00-0000000", {
      exact: true,
    });
    const copyButton = accountDetails.getByRole("button", { name: "계좌번호 복사" });

    // expect: 해당 `details` 가 기본으로 열려 있다 (`open` 프로퍼티가 true).
    await expect(accountDetails).toHaveJSProperty("open", true);

    // expect: summary 에 `gift account`, `계좌 안내`, `마음은 이 계좌로 전할 수 있어요.` 가 보인다.
    await expect(accountSummary.getByText("gift account", { exact: true })).toBeVisible();
    await expect(accountSummary.getByText("계좌 안내", { exact: true })).toBeVisible();
    await expect(
      accountSummary.getByText("마음은 이 계좌로 전할 수 있어요.", { exact: true }),
    ).toBeVisible();

    // expect: 라벨 `예금주`, 예금주 이름 `김민지`, 계좌 정보 `민지은행 0000-00-0000000` 이 보인다.
    await expect(accountDetails.getByText("예금주", { exact: true })).toBeVisible();
    await expect(accountDetails.getByText("김민지", { exact: true })).toBeVisible();
    await expect(accountInfo).toBeVisible();

    // expect: 버튼 `계좌번호 복사` 가 보인다.
    await expect(copyButton).toBeVisible();

    // 2. summary 의 `계좌 안내` 텍스트를 클릭합니다.
    await accountSummary.getByText("계좌 안내", { exact: true }).click();

    // expect: `details` 가 닫힌다 (`open` 이 false).
    await expect(accountDetails).toHaveJSProperty("open", false);

    // expect: `민지은행 0000-00-0000000` 와 `계좌번호 복사` 버튼이 보이지 않는다.
    await expect(accountInfo).toBeHidden();
    await expect(copyButton).toBeHidden();

    // expect: 축하 메시지 details 와 선물 카드 상태에는 영향이 없다 (축하 메시지 details 는 여전히 닫혀 있음).
    await expect(messageDetails).toHaveJSProperty("open", false);
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(
      page.getByRole("article").locator("details[open]"),
    ).toHaveCount(0);

    // 3. summary 의 `계좌 안내` 텍스트를 다시 클릭합니다.
    await accountSummary.getByText("계좌 안내", { exact: true }).click();

    // expect: `details` 가 다시 열리고 `김민지`, `민지은행 0000-00-0000000`, `계좌번호 복사` 가 다시 보인다.
    await expect(accountDetails).toHaveJSProperty("open", true);
    await expect(accountDetails.getByText("김민지", { exact: true })).toBeVisible();
    await expect(accountInfo).toBeVisible();
    await expect(copyButton).toBeVisible();
  });
});
