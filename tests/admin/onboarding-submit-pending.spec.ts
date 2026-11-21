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

    // 3. 버튼 `위시리스트 만들기` 를 누릅니다. 응답은 잠시 붙잡아 둡니다.
    await submitButton.click();

    // expect: 버튼이 disabled이고 라벨이 `만드는 중…` 이다. 스피너는 없다.
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText("만드는 중…");
    await expect(submitButton.locator("svg")).toHaveCount(0);

    // expect: 한 번 더 눌러도 `/api/onboarding` 요청은 1번이다.
    await submitButton.click({ force: true });
    await expect.poll(() => requestCount).toBe(1);

    // 4. 붙잡은 응답을 이어 줍니다.
    releaseRequest();

    // expect: URL 이 `/admin` 이 된다.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  });
});
