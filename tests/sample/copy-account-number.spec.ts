// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Account", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Copy Account Number", async ({ page }) => {
    // 1. [사전 조건] 브라우저 컨텍스트에 `clipboard-read`, `clipboard-write` 권한을 부여합니다 (위 `test.use({ permissions })`). 그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const accountDetails = page.locator("details").filter({ hasText: "gift account" });
    // 계좌 details 안에는 버튼이 하나뿐이며, 복사 후 라벨이 바뀌므로 이름 없이 찾는다.
    const copyButton = accountDetails.getByRole("button");

    // expect: 계좌 안내 details 가 열려 있고 버튼 `계좌번호 복사` 가 보인다.
    await expect(accountDetails).toHaveJSProperty("open", true);
    await expect(
      accountDetails.getByRole("button", { name: "계좌번호 복사" }),
    ).toBeVisible();

    // 2. 계좌 안내 영역의 버튼 `계좌번호 복사` 를 클릭합니다.
    await accountDetails.getByRole("button", { name: "계좌번호 복사" }).click();

    // expect: 버튼 라벨이 `복사 완료` 로 바뀐다 (계좌 details 범위 안에서 확인).
    await expect(copyButton).toHaveText("복사 완료");

    // expect: 토스트 `은행과 계좌번호를 복사했어요.` 가 표시된다.
    await expect(
      page.getByText("은행과 계좌번호를 복사했어요.", { exact: true }),
    ).toBeVisible();

    // expect: `navigator.clipboard.readText()` 결과가 정확히 `민지은행 0000-00-0000000` 이다.
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("민지은행 0000-00-0000000");

    // expect: 페이지 URL 은 `/sample` 그대로이다.
    expect(new URL(page.url()).pathname).toBe("/sample");
    expect(new URL(page.url()).search).toBe("");

    // 3. 약 2~3초 대기합니다.
    // expect: 버튼 라벨이 `계좌번호 복사` 로 되돌아간다.
    await expect(copyButton).toHaveText("계좌번호 복사", { timeout: 5000 });
  });
});
