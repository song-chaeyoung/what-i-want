// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Message Form", () => {
  test("Message Form Fields and Disabled Submit", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 두 번째 `details`(축하 메시지) 를 확인합니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    // `이름`, `메시지`, `마음 보내기` 가 메시지 폼과 선물 카드에 중복되므로 축하 메시지 details 로 범위를 좁힌다.
    const messageDetails = page.locator("details").filter({ hasText: "gift note" });
    const summary = messageDetails.locator("summary");
    const senderInput = messageDetails.getByRole("textbox", {
      name: "이름",
      exact: true,
    });
    const bodyInput = messageDetails.getByRole("textbox", {
      name: "메시지",
      exact: true,
    });
    const submitButton = messageDetails.getByRole("button", { name: "마음 보내기" });
    const sampleNotice = messageDetails.getByText(
      "샘플 페이지에서는 마음을 보낼 수 없어요.",
      { exact: true },
    );

    // expect: summary 에 `gift note`, `축하 메시지 남기기`, `결제 없이 메시지만 전할 수 있어요.` 가 보인다.
    await expect(summary.getByText("gift note", { exact: true })).toBeVisible();
    await expect(summary.getByText("축하 메시지 남기기", { exact: true })).toBeVisible();
    await expect(
      summary.getByText("결제 없이 메시지만 전할 수 있어요.", { exact: true }),
    ).toBeVisible();

    // expect: `details` 가 기본으로 닫혀 있다 (`open` 이 false).
    await expect(messageDetails).toHaveJSProperty("open", false);

    // expect: 텍스트박스 `이름`, `메시지` 와 버튼 `마음 보내기` 는 아직 보이지 않는다.
    await expect(senderInput).toBeHidden();
    await expect(bodyInput).toBeHidden();
    await expect(submitButton).toBeHidden();

    // 2. summary 의 `축하 메시지 남기기` 를 클릭해 폼을 엽니다.
    await summary.click();
    await expect(messageDetails).toHaveJSProperty("open", true);

    // expect: 라벨 `이름` 의 텍스트박스(`#message-sender`)가 보이고 placeholder 가 `이름` 이며 maxlength 가 80 이다.
    await expect(senderInput).toBeVisible();
    await expect(senderInput).toHaveAttribute("id", "message-sender");
    await expect(senderInput).toHaveAttribute("placeholder", "이름");
    await expect(senderInput).toHaveAttribute("maxlength", "80");

    // expect: 라벨 `메시지` 의 텍스트박스(`#message-body`, textarea)가 보이고 maxlength 가 500 이며 `required` 이다.
    await expect(bodyInput).toBeVisible();
    await expect(bodyInput).toHaveAttribute("id", "message-body");
    await expect(bodyInput).toHaveJSProperty("tagName", "TEXTAREA");
    await expect(bodyInput).toHaveAttribute("maxlength", "500");
    await expect(bodyInput).toHaveJSProperty("required", true);

    // expect: 버튼 `마음 보내기` 가 보이고 비활성(disabled)이다.
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // expect: 안내 문구 `샘플 페이지에서는 마음을 보낼 수 없어요.` 가 버튼 아래에 보인다.
    await expect(sampleNotice).toBeVisible();
    const buttonBox = await submitButton.boundingBox();
    const noticeBox = await sampleNotice.boundingBox();
    if (!buttonBox || !noticeBox) {
      throw new Error("버튼 또는 안내 문구의 위치를 구할 수 없습니다.");
    }
    expect(noticeBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);

    // expect: `보낼 마음` 입력(금액)은 이 폼에 없다.
    await expect(messageDetails.getByLabel("보낼 마음")).toHaveCount(0);
    await expect(messageDetails.locator('input[type="number"]')).toHaveCount(0);

    // 3. `이름` 에 `지민`, `메시지` 에 `생일 축하해!` 를 입력합니다.
    await senderInput.fill("지민");
    await bodyInput.fill("생일 축하해!");

    // expect: 입력한 값이 각 필드에 그대로 표시된다.
    await expect(senderInput).toHaveValue("지민");
    await expect(bodyInput).toHaveValue("생일 축하해!");

    // expect: 버튼 `마음 보내기` 는 여전히 disabled 이다.
    await expect(submitButton).toBeDisabled();

    // expect: `메시지` 에 600자를 입력하면 값 길이가 500자로 제한되고, `이름` 에 100자를 입력하면 80자로 제한된다.
    await bodyInput.fill("나".repeat(600));
    await expect(bodyInput).toHaveValue("나".repeat(500));
    await senderInput.fill("가".repeat(100));
    await expect(senderInput).toHaveValue("가".repeat(80));

    // 이후 단계의 "입력값 유지" 확인을 위해 값을 원래대로 되돌린다.
    await senderInput.fill("지민");
    await bodyInput.fill("생일 축하해!");
    await expect(senderInput).toHaveValue("지민");
    await expect(bodyInput).toHaveValue("생일 축하해!");

    // 4. (부정 검증) 요청 감시를 켠 뒤(`page.on('request')`로 POST 기록) disabled 버튼 `마음 보내기` 를 `click({ force: true })` 로 클릭합니다.
    const postRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") {
        postRequests.push(request.url());
      }
    });
    await submitButton.click({ force: true });

    // expect: 페이지 URL 이 `/sample` 그대로이다 (쿼리스트링 없음).
    await expect(page).toHaveURL("/sample");
    expect(new URL(page.url()).search).toBe("");

    // expect: 성공/실패 토스트가 나타나지 않는다.
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

    // expect: `details` 는 열린 상태이고 입력값이 유지된다.
    await expect(messageDetails).toHaveJSProperty("open", true);
    await expect(senderInput).toHaveValue("지민");
    await expect(bodyInput).toHaveValue("생일 축하해!");

    // expect: POST 요청이 발생하지 않는다 (서버 액션 호출 없음).
    expect(postRequests).toEqual([]);

    // 5. summary 를 다시 클릭합니다.
    await summary.click();

    // expect: `details` 가 닫히고 `이름`/`메시지` 필드가 보이지 않는다.
    await expect(messageDetails).toHaveJSProperty("open", false);
    await expect(senderInput).toBeHidden();
    await expect(bodyInput).toBeHidden();
  });
});
