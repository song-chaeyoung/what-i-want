// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect, type Locator } from "@playwright/test";

async function readValidity(input: Locator) {
  return input.evaluate((element) => {
    const { validity } = element as HTMLInputElement;
    return {
      valid: validity.valid,
      rangeUnderflow: validity.rangeUnderflow,
      stepMismatch: validity.stepMismatch,
      valueMissing: validity.valueMissing,
    };
  });
}

test.describe("Gift Form", () => {
  test("Gift Form Input Constraints", async ({ page }) => {
    // 1. `/sample` 로 이동하고 `생일 케이크` 카드의 summary `이 선물에 마음 보태기` 를 클릭해 폼을 엽니다. 이후 모든 요소는 `생일 케이크` article 범위로 좁혀 찾습니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    // `보낼 마음`, `이름`, `메시지`, `마음 보내기` 는 선물 카드마다 반복되므로 `생일 케이크` article 로 범위를 좁힌다.
    const cakeCard = page.locator("article").filter({ hasText: "생일 케이크" });
    const summary = cakeCard.locator("summary");
    const details = cakeCard.locator("details");
    const amountInput = cakeCard.getByRole("spinbutton", { name: "보낼 마음" });
    const senderInput = cakeCard.getByRole("textbox", { name: "이름", exact: true });
    const bodyInput = cakeCard.getByRole("textbox", { name: "메시지", exact: true });
    const submitButton = cakeCard.getByRole("button", { name: "마음 보내기" });

    await summary.click();
    await expect(details).toHaveJSProperty("open", true);

    // expect: 폼 필드 `보낼 마음`, `이름`, `메시지` 가 보인다.
    await expect(amountInput).toBeVisible();
    await expect(senderInput).toBeVisible();
    await expect(bodyInput).toBeVisible();

    // 2. `보낼 마음` 에 `pressSequentially('abc')` 로 문자를 입력합니다 (number 입력에는 `fill('abc')` 를 쓰면 에러).
    await amountInput.pressSequentially("abc");

    // expect: 입력값이 빈 문자열이다 (숫자가 아닌 문자는 입력되지 않음).
    await expect(amountInput).toHaveValue("");

    // 3. `보낼 마음` 에 `-5`, `0`, `1.5`, `12000` 을 차례로 `fill` 하고 각 값에서 `input.validity` 를 확인합니다.
    // expect: `-5` 와 `0`: `validity.valid` 가 false 이고 `rangeUnderflow` 가 true 이다 (최솟값 1 미만).
    for (const value of ["-5", "0"]) {
      await amountInput.fill(value);
      await expect(amountInput).toHaveValue(value);
      const validity = await readValidity(amountInput);
      expect(validity.valid, `값 ${value} 은 유효하지 않아야 한다`).toBe(false);
      expect(validity.rangeUnderflow, `값 ${value} 은 최솟값 1 미만이다`).toBe(true);
    }

    // expect: `1.5`: `validity.valid` 가 false 이고 `stepMismatch` 가 true 이다 (정수 단위만 허용).
    await amountInput.fill("1.5");
    await expect(amountInput).toHaveValue("1.5");
    const decimalValidity = await readValidity(amountInput);
    expect(decimalValidity.valid).toBe(false);
    expect(decimalValidity.stepMismatch).toBe(true);

    // expect: `12000`: `validity.valid` 가 true 이다.
    await amountInput.fill("12000");
    await expect(amountInput).toHaveValue("12000");
    const validAmountValidity = await readValidity(amountInput);
    expect(validAmountValidity.valid).toBe(true);

    // 4. `이름` 에 `'가'` 100자, `메시지` 에 `'나'` 600자를 `fill` 합니다.
    await senderInput.fill("가".repeat(100));
    await bodyInput.fill("나".repeat(600));

    // expect: `이름` 값 길이가 80자로 제한된다.
    await expect(senderInput).toHaveValue("가".repeat(80));

    // expect: `메시지` 값 길이가 500자로 제한된다.
    await expect(bodyInput).toHaveValue("나".repeat(500));

    // 5. 새로 고침 후 폼을 다시 열고 `보낼 마음` 과 `메시지` 를 비운 상태로 필수 검증 상태를 확인합니다.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });
    await summary.click();
    await expect(details).toHaveJSProperty("open", true);
    await expect(amountInput).toHaveValue("");
    await expect(senderInput).toHaveValue("");
    await expect(bodyInput).toHaveValue("");

    // expect: `보낼 마음` 과 `메시지` 의 `validity.valueMissing` 이 true 이다 (required).
    expect((await readValidity(amountInput)).valueMissing).toBe(true);
    expect((await readValidity(bodyInput)).valueMissing).toBe(true);

    // expect: `이름` 은 필수가 아니며 비어 있어도 `validity.valueMissing` 이 false 이다.
    await expect(senderInput).toHaveJSProperty("required", false);
    expect((await readValidity(senderInput)).valueMissing).toBe(false);

    // 6. (부정 검증) `보낼 마음` 12000, `이름` `지민`, `메시지` `축하해` 를 모두 유효하게 채운 뒤, `이름` 필드에서 Enter 키를 누르고 이어서 `보낼 마음` 필드에서도 Enter 를 누릅니다.
    await amountInput.fill("12000");
    await senderInput.fill("지민");
    await bodyInput.fill("축하해");

    await senderInput.press("Enter");

    // expect: 두 경우 모두 페이지 URL 이 `/sample` 그대로이고 쿼리스트링이 붙지 않는다 (카드 폼은 암묵적 제출이 일어나지 않음).
    await expect(page).toHaveURL("/sample");
    expect(new URL(page.url()).search).toBe("");

    await amountInput.press("Enter");
    await expect(page).toHaveURL("/sample");
    expect(new URL(page.url()).search).toBe("");

    // expect: 버튼 `마음 보내기` 는 계속 disabled 이며 입력값이 유지된다.
    await expect(details).toHaveJSProperty("open", true);
    await expect(submitButton).toBeDisabled();
    await expect(amountInput).toHaveValue("12000");
    await expect(senderInput).toHaveValue("지민");
    await expect(bodyInput).toHaveValue("축하해");
  });
});
