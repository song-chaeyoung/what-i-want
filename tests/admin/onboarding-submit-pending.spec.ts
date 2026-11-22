// spec: specs/admin-management.md
// seed: tests/admin/seed-onboarding.spec.ts

import { test, expect } from "../fixtures/admin";

test.describe("Onboarding", () => {
  test("Submit Button Pending", async ({ page, seedAdmin, signIn }) => {
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

    // 이동 중에는 locator가 새 문서를 기다리므로, 현재 문서가 콘솔로 상태를 알린다.
    // disabled 버튼의 click()은 무시된다. requestSubmit은 disabled여도 submit 이벤트를 만든다.
    // 첫 POST가 나가기 전에 다시 호출하면 브라우저가 두 번째 POST를 만들지 않는다.
    await page.evaluate(() => {
      const form = document.querySelector('form[action="/api/onboarding"]');
      if (!(form instanceof HTMLFormElement)) return;

      const observer = new MutationObserver(() => {
        const button = form.querySelector('button[type="submit"]');
        if (
          !(button instanceof HTMLButtonElement) ||
          !button.disabled ||
          button.textContent !== "만드는 중…" ||
          button.querySelectorAll("svg").length !== 0
        ) {
          return;
        }
        observer.disconnect();
        console.info("PENDING_READY");
        window.setTimeout(() => {
          form.requestSubmit(button);
          console.info("SECOND_SUBMIT_DONE");
        }, 300);
      });
      observer.observe(form, {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
      });
    });
    const pendingReady = page.waitForEvent("console", {
      predicate: (message) => message.text() === "PENDING_READY",
      timeout: 10_000,
    });
    const secondSubmitDone = page.waitForEvent("console", {
      predicate: (message) => message.text() === "SECOND_SUBMIT_DONE",
      timeout: 10_000,
    });

    // 3. 버튼 `위시리스트 만들기` 를 누릅니다. 응답은 잠시 붙잡아 둡니다.
    await submitButton.click({ noWaitAfter: true });

    // expect: 버튼이 disabled이고 라벨이 `만드는 중…` 이다. 스피너는 없다.
    // expect: disabled 뒤 300ms에 requestSubmit을 한 번 더 해도 `/api/onboarding` 요청은 1번이다.
    await pendingReady;
    await secondSubmitDone;
    await page.waitForTimeout(800);
    expect(requestCount).toBe(1);

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
