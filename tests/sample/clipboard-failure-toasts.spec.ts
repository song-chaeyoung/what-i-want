// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Share", () => {
  test("Clipboard Failure Toasts", async ({ page }) => {
    // 1. [사전 조건] `addInitScript` 로 `navigator.share` 를 `undefined` 로, `navigator.clipboard` 를
    //    `writeText` 가 `Promise.reject(new Error('denied'))` 를 반환하는 객체로 덮어씁니다.
    //    그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
        configurable: true,
      });
    });
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const header = page.locator("header");
    const accountDetails = page.locator("details").filter({ hasText: "gift account" });
    // 헤더와 계좌 details 안에는 각각 버튼이 하나뿐이다.
    const shareButton = header.getByRole("button");
    const copyButton = accountDetails.getByRole("button");

    // expect: 헤더의 `공유하기` 버튼과 계좌 영역의 `계좌번호 복사` 버튼이 보인다.
    await expect(header.getByRole("button", { name: "공유하기" })).toBeVisible();
    await expect(
      accountDetails.getByRole("button", { name: "계좌번호 복사" }),
    ).toBeVisible();

    // 2. 헤더의 버튼 `공유하기` 를 클릭합니다.
    await header.getByRole("button", { name: "공유하기" }).click();

    // expect: 에러 토스트 `링크 복사에 실패했어요. 주소를 직접 복사해주세요.` 가 표시된다 (`data-type="error"`).
    // 토스트는 약 4초 뒤 사라지므로 클릭 직후에 단언한다.
    await expect(
      page.getByText("링크 복사에 실패했어요. 주소를 직접 복사해주세요.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-sonner-toast][data-type="error"]')
        .filter({ hasText: "링크 복사에 실패했어요. 주소를 직접 복사해주세요." }),
    ).toBeVisible();

    // expect: 버튼 라벨은 `공유하기` 그대로이다 (`복사 완료` 로 바뀌지 않음).
    await expect(shareButton).toHaveText("공유하기");

    // 3. 계좌 영역의 버튼 `계좌번호 복사` 를 클릭합니다.
    await accountDetails.getByRole("button", { name: "계좌번호 복사" }).click();

    // expect: 에러 토스트 `계좌번호 복사에 실패했어요.` 가 표시된다.
    // 토스트가 겹쳐 쌓일 수 있으므로 개수가 아니라 정확한 문구로 단언한다.
    await expect(
      page.getByText("계좌번호 복사에 실패했어요.", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-sonner-toast][data-type="error"]')
        .filter({ hasText: "계좌번호 복사에 실패했어요." }),
    ).toBeVisible();

    // expect: 버튼 라벨은 `계좌번호 복사` 그대로이다.
    await expect(copyButton).toHaveText("계좌번호 복사");

    // expect: 페이지가 계속 정상 동작한다 (URL 이 `/sample` 그대로이고 제목 `민지님의 위시리스트` 가 보임).
    expect(new URL(page.url()).pathname).toBe("/sample");
    expect(new URL(page.url()).search).toBe("");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible();
  });
});
