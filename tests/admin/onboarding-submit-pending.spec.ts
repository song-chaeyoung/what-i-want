// spec: specs/admin-management.md
// seed: tests/admin/seed-onboarding.spec.ts

import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/admin";

test.describe("Onboarding", () => {
  test("Submit Button Pending", async ({ page, seedAdmin, signIn }) => {
    test.setTimeout(60_000);
    // 1. [사전 조건] `seedAdmin({ onboarded: false, displayName: "소셜 이름" })`, `signIn(admin)`. `/onboarding` 으로 이동해 제목이 보일 때까지 기다립니다.
    const admin = await seedAdmin({
      onboarded: false,
      displayName: "소셜 이름",
    });
    await signIn(admin);

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { level: 1, name: "기본 위시리스트 만들기" }),
    ).toBeVisible({ timeout: 30_000 });

    // 2. `표시 이름` 을 `E2E 생일자` 로 바꾸고 체크박스 `만 14세 이상입니다.` 를 체크합니다. 생일은 비워 둡니다.
    await page.getByRole("textbox", { name: "표시 이름" }).fill("E2E 생일자");
    await page.getByRole("checkbox", { name: /만 14세 이상입니다\./ }).check();

    let requestCount = 0;
    let releaseRequest: () => void = () => {};
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await page.route("**/api/onboarding", async (route) => {
      requestCount += 1;
      await requestGate;
      await route.continue();
    });

    const submitButton = page.locator(
      'form[action="/api/onboarding"] button[type="submit"]',
    );

    // 3. 버튼 `위시리스트 만들기` 를 누릅니다. 응답은 잠시 붙잡아 둡니다.
    // 이동이 끝나기 전에는 Playwright locator가 현재 페이지를 보지 않는다.
    await submitButton.click({ noWaitAfter: true });

    // expect: 버튼이 disabled이고 라벨이 `만드는 중…` 이다. 스피너는 없다.
    // expect: 잠긴 버튼을 한 번 더 눌러도 `/api/onboarding` 요청은 1번이다.
    const pending = await readPendingSubmit(page);
    expect(pending).toEqual({
      disabled: true,
      text: "만드는 중…",
      svgCount: 0,
    });
    await expect.poll(() => requestCount).toBe(1);

    // 4. 붙잡은 응답을 이어 줍니다.
    releaseRequest();

    // expect: URL 이 `/admin` 이 된다.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  });

  test("Underage Confirm Cancel Does Not Lock", async ({
    page,
    seedAdmin,
    signIn,
  }) => {
    // 1. [사전 조건] 온보딩 전 사용자로 `/onboarding` 에 들어갑니다.
    const admin = await seedAdmin({
      onboarded: false,
      displayName: "소셜 이름",
    });
    await signIn(admin);

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { level: 1, name: "기본 위시리스트 만들기" }),
    ).toBeVisible({ timeout: 30_000 });

    // 2. 만 14세 미만 생일(2015-03-15)을 고르고 나이 확인 체크를 합니다.
    await page.getByRole("textbox", { name: "표시 이름" }).fill("E2E 생일자");
    await page.getByRole("button", { name: "생일" }).click();
    await page.getByRole("combobox", { name: "연도 선택" }).selectOption("2015");
    await page
      .getByRole("combobox", { name: "월 선택" })
      .selectOption({ index: 2 });
    await page.getByRole("button", { name: /March 15th, 2015/ }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "2015년생" }),
    ).toBeVisible();
    await page.getByRole("checkbox", { name: /만 14세 이상입니다\./ }).check();

    let requestCount = 0;
    await page.route("**/api/onboarding", async (route) => {
      requestCount += 1;
      await route.abort();
    });

    const submitButton = page.locator(
      'form[action="/api/onboarding"] button[type="submit"]',
    );

    // 3. 제출하고 확인창을 취소합니다. 한 번 더 해도 같습니다.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      page.once("dialog", (dialog) => dialog.dismiss());
      await submitButton.click();

      // expect: 버튼은 잠기지 않고 요청은 나가지 않는다.
      await expect(submitButton).toBeEnabled();
      await expect(submitButton).toHaveText("위시리스트 만들기");
      await expect(page).toHaveURL(/\/onboarding$/);
      expect(requestCount).toBe(0);
    }
  });
});

type PendingSubmitState = {
  disabled: boolean;
  text: string;
  svgCount: number;
};

// 응답을 붙잡은 문서 이동 중에는 locator가 새 문서를 기다린다.
async function readPendingSubmit(page: Page): Promise<PendingSubmitState | null> {
  return evaluateOnPage<PendingSubmitState | null>(
    page,
    `new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const button = document.querySelector('form[action="/api/onboarding"] button[type="submit"]');
        if (!(button instanceof HTMLButtonElement)) {
          resolve(null);
          return;
        }
        if (!button.disabled && Date.now() - start < 1500) {
          setTimeout(tick, 50);
          return;
        }
        if (button.disabled) button.click();
        resolve({
          disabled: button.disabled,
          text: button.textContent,
          svgCount: button.querySelectorAll("svg").length,
        });
      };
      tick();
    })`,
    true,
  );
}

async function evaluateOnPage<T>(
  page: Page,
  expression: string,
  awaitPromise: boolean,
): Promise<T> {
  const client = await page.context().newCDPSession(page);
  const probed = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });

  return probed.result.value as T;
}
