// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect, errors } from "@playwright/test";

// Enter 이후의 상태(URL, details, 입력값)는 키 입력 직후 확정된다.
// 아래 단언이 실패하더라도 이어지는 변형 케이스가 실행되도록 짧은 timeout 을 쓴다.
const SETTLED = { timeout: 2_000 };

test.describe("Message Form", () => {
  test("Message Form Enter Key", async ({ page, context }) => {
    // 1. [회귀 테스트: Enter 로 GET 암묵 제출되던 버그] `/sample` 로 이동하고 summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다.
    //    `메시지` 에 `생일 축하해!` 를 입력한 뒤, `이름` 에 `지민` 을 입력하고 같은 필드에서 Enter 키를 누릅니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    // `이름`, `메시지` 가 메시지 폼과 선물 카드에 중복되므로 축하 메시지 details 로 범위를 좁힌다.
    const messageDetails = page.locator("details").filter({ hasText: "gift note" });
    const senderInput = messageDetails.getByRole("textbox", {
      name: "이름",
      exact: true,
    });
    const bodyInput = messageDetails.getByRole("textbox", {
      name: "메시지",
      exact: true,
    });

    await messageDetails.locator("summary").click();
    await expect(messageDetails).toHaveJSProperty("open", true);
    await bodyInput.fill("생일 축하해!");
    await senderInput.fill("지민");
    await expect(senderInput).toHaveValue("지민");
    await expect(bodyInput).toHaveValue("생일 축하해!");

    const historyLengthBefore = await page.evaluate(() => window.history.length);

    // [회귀 대상] 데모 버튼이 `type="button"` 이던 때는 폼에 submit 버튼이 없고 action 도 없으며
    // 텍스트 입력이 `이름` 하나뿐이라 브라우저의 암묵적 제출(implicit submission)이 일어났다.
    // 그 결과 Enter 를 누르면 form 이 GET 으로 제출되어
    // `/sample?clientRequestId=<uuid>&senderName=...&body=...` 로 이동하고, 폼이 닫히며 입력값이 사라졌다.
    // 지금은 데모 버튼이 disabled 인 `type="submit"` 이라 암묵적 제출이 일어나지 않아야 한다.
    // 실패하더라도 2번 변형 케이스가 실행되도록 expect.soft 를 쓴다.
    // Enter 직후에는 아직 이동이 시작되지 않았을 수 있으므로, SETTLED 동안 문서 이동 요청이 없는지 먼저 기다린다.
    const navigationRequest = page
      .waitForRequest((request) => request.isNavigationRequest(), SETTLED)
      .then(
        (request) => request.url(),
        (error: unknown) => {
          if (error instanceof errors.TimeoutError) {
            return null;
          }
          throw error;
        },
      );
    await senderInput.press("Enter");

    // expect: [기대] Enter 후 문서 이동(navigation) 요청이 발생하지 않는다.
    expect
      .soft(await navigationRequest, "Enter 로 폼이 GET 제출되면 안 된다")
      .toBeNull();

    // expect: [기대] 페이지 URL 이 `/sample` 그대로이며 쿼리스트링(`senderName`, `body`, `clientRequestId`)이 붙지 않는다.
    await expect.soft(page).toHaveURL("/sample", SETTLED);
    expect
      .soft(new URL(page.url()).search, "쿼리스트링이 붙지 않아야 한다")
      .toBe("");

    // expect: [기대] 폼이 열린 상태로 유지되고 입력값(`지민`, `생일 축하해!`)이 그대로 남는다.
    await expect.soft(messageDetails).toHaveJSProperty("open", true, SETTLED);
    await expect.soft(senderInput).toHaveValue("지민", SETTLED);
    await expect.soft(bodyInput).toHaveValue("생일 축하해!", SETTLED);

    // expect: [기대] 입력한 메시지 내용이 URL/히스토리에 노출되지 않는다 (README 의 '메시지는 비공개' 요구사항).
    expect
      .soft(page.url(), "입력한 이름/메시지가 URL 에 노출되면 안 된다")
      .not.toMatch(/senderName|body=|clientRequestId/);
    expect
      .soft(
        await page.evaluate(() => window.history.length),
        "히스토리 항목이 추가되면 안 된다",
      )
      .toBe(historyLengthBefore);

    // 2. (통과 예상 변형) 새 페이지에서 폼을 열고 `메시지` 를 비운 채 `이름` 에 `지민` 을 입력하고 Enter 를 누릅니다.
    const variantPage = await context.newPage();
    await variantPage.goto("/sample");
    await expect(
      variantPage.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const variantDetails = variantPage
      .locator("details")
      .filter({ hasText: "gift note" });
    const variantSender = variantDetails.getByRole("textbox", {
      name: "이름",
      exact: true,
    });
    const variantBody = variantDetails.getByRole("textbox", {
      name: "메시지",
      exact: true,
    });

    await variantDetails.locator("summary").click();
    await expect(variantDetails).toHaveJSProperty("open", true);
    await variantSender.fill("지민");
    await expect(variantBody).toHaveValue("");

    // 폼 제출(문서 네비게이션 요청)이 일어나는지 감시한다.
    const navigationRequests: string[] = [];
    variantPage.on("request", (request) => {
      if (request.isNavigationRequest()) {
        navigationRequests.push(request.url());
      }
    });

    await variantSender.press("Enter");

    // expect: `#message-body` 의 `validity.valueMissing` 이 true 이다.
    await expect
      .poll(() =>
        variantBody.evaluate(
          (element) => (element as HTMLTextAreaElement).validity.valueMissing,
        ),
      )
      .toBe(true);

    // expect: 필수 필드 검증(`required`)으로 제출이 차단되어 URL 이 `/sample` 그대로이다.
    await expect(variantPage).toHaveURL("/sample");
    expect(navigationRequests).toEqual([]);
    await expect(variantDetails).toHaveJSProperty("open", true);
    await expect(variantSender).toHaveValue("지민");
  });
});
