// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect, type Locator } from "@playwright/test";

const SAMPLE_NOTICE = "샘플 페이지에서는 마음을 보낼 수 없어요.";
const PAYMENT_NOTICE =
  "여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.";

// `보낼 마음`, `이름`, `메시지`, `마음 보내기` 는 선물 카드마다 반복되므로 항상 카드(article) 범위로 좁힌다.
function giftForm(card: Locator) {
  return {
    details: card.locator("details"),
    summary: card.locator("summary"),
    // `마음 보내기` 소제목은 heading 역할이 아니라 <p> 이다 (버튼 `마음 보내기` 와 구분하기 위해 p 로 한정).
    subHeading: card.locator("p").filter({ hasText: /^마음 보내기$/ }),
    amount: card.getByRole("spinbutton", { name: "보낼 마음" }),
    sender: card.getByRole("textbox", { name: "이름", exact: true }),
    body: card.getByRole("textbox", { name: "메시지", exact: true }),
    paymentNotice: card.getByText(PAYMENT_NOTICE, { exact: true }),
    submit: card.getByRole("button", { name: "마음 보내기" }),
    sampleNotice: card.getByText(SAMPLE_NOTICE, { exact: true }),
  };
}

test.describe("Gift Form", () => {
  test("Gift Form Fields and Disabled Submit", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 선물 카드 `무선 헤드폰` 의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const headphonesCard = page.locator("article").filter({ hasText: "무선 헤드폰" });
    const cakeCard = page.locator("article").filter({ hasText: "생일 케이크" });
    const headphones = giftForm(headphonesCard);
    const cake = giftForm(cakeCard);

    await expect(headphones.summary).toHaveText("이 선물에 마음 보태기");
    await headphones.summary.click();
    await expect(headphones.details).toHaveJSProperty("open", true);

    // expect: 해당 카드 안에서 소제목 `마음 보내기` 가 보인다.
    await expect(headphones.subHeading).toBeVisible();

    // expect: 스핀버튼 `보낼 마음`(`#participation-amount-sample-headphones`)이 보이고 placeholder `10000`, min 1, step 1, required 이다.
    await expect(headphones.amount).toBeVisible();
    await expect(headphones.amount).toHaveAttribute("id", "participation-amount-sample-headphones");
    await expect(headphones.amount).toHaveAttribute("placeholder", "10000");
    await expect(headphones.amount).toHaveAttribute("min", "1");
    await expect(headphones.amount).toHaveAttribute("step", "1");
    await expect(headphones.amount).toHaveJSProperty("required", true);

    // expect: 텍스트박스 `이름`(placeholder `이름`, maxlength 80)과 `메시지`(textarea, maxlength 500, required)가 보인다.
    await expect(headphones.sender).toBeVisible();
    await expect(headphones.sender).toHaveAttribute("id", "participation-sender-sample-headphones");
    await expect(headphones.sender).toHaveAttribute("placeholder", "이름");
    await expect(headphones.sender).toHaveAttribute("maxlength", "80");
    await expect(headphones.body).toBeVisible();
    await expect(headphones.body).toHaveAttribute("id", "participation-body-sample-headphones");
    await expect(headphones.body).toHaveJSProperty("tagName", "TEXTAREA");
    await expect(headphones.body).toHaveAttribute("maxlength", "500");
    await expect(headphones.body).toHaveJSProperty("required", true);

    // expect: 안내 문구 `여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.` 가 보인다.
    await expect(headphones.paymentNotice).toBeVisible();

    // expect: 버튼 `마음 보내기` 가 disabled 이고 그 아래에 `샘플 페이지에서는 마음을 보낼 수 없어요.` 가 보인다.
    await expect(headphones.submit).toBeVisible();
    await expect(headphones.submit).toBeDisabled();
    await expect(headphones.sampleNotice).toBeVisible();
    const buttonBox = await headphones.submit.boundingBox();
    const noticeBox = await headphones.sampleNotice.boundingBox();
    if (!buttonBox || !noticeBox) {
      throw new Error("버튼 또는 안내 문구의 위치를 구할 수 없습니다.");
    }
    expect(noticeBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);

    // 2. 다른 카드 `생일 케이크` 의 폼 상태를 확인합니다.
    // expect: `생일 케이크` 카드의 폼은 아직 닫혀 있고 그 안의 필드가 보이지 않는다 (카드별 details 가 독립적이다).
    await expect(cake.details).toHaveJSProperty("open", false);
    await expect(cake.amount).toBeHidden();
    await expect(cake.sender).toBeHidden();
    await expect(cake.body).toBeHidden();
    await expect(cake.submit).toBeHidden();

    // 3. `생일 케이크` 카드의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    await expect(cake.summary).toHaveText("이 선물에 마음 보태기");
    await cake.summary.click();
    await expect(cake.details).toHaveJSProperty("open", true);

    // expect: `생일 케이크` 카드에도 동일한 구성의 폼(`보낼 마음`, `이름`, `메시지`, disabled `마음 보내기`, 샘플 안내 문구)이 열리고 필드 id 가 `participation-*-sample-cake` 이다.
    await expect(cake.subHeading).toBeVisible();
    await expect(cake.amount).toBeVisible();
    await expect(cake.amount).toHaveAttribute("id", "participation-amount-sample-cake");
    await expect(cake.amount).toHaveAttribute("placeholder", "10000");
    await expect(cake.amount).toHaveAttribute("min", "1");
    await expect(cake.amount).toHaveAttribute("step", "1");
    await expect(cake.amount).toHaveJSProperty("required", true);
    await expect(cake.sender).toBeVisible();
    await expect(cake.sender).toHaveAttribute("id", "participation-sender-sample-cake");
    await expect(cake.sender).toHaveAttribute("maxlength", "80");
    await expect(cake.body).toBeVisible();
    await expect(cake.body).toHaveAttribute("id", "participation-body-sample-cake");
    await expect(cake.body).toHaveAttribute("maxlength", "500");
    await expect(cake.body).toHaveJSProperty("required", true);
    await expect(cake.paymentNotice).toBeVisible();
    await expect(cake.submit).toBeVisible();
    await expect(cake.submit).toBeDisabled();
    await expect(cake.sampleNotice).toBeVisible();

    // expect: `무선 헤드폰` 카드의 폼은 계속 열려 있다 (동시에 두 폼이 열릴 수 있음).
    await expect(headphones.details).toHaveJSProperty("open", true);
    await expect(headphones.amount).toBeVisible();

    // 4. `무선 헤드폰` 폼에 `보낼 마음` 10000, `이름` `지민`, `메시지` `축하해` 를 입력합니다.
    await headphones.amount.fill("10000");
    await headphones.sender.fill("지민");
    await headphones.body.fill("축하해");
    await expect(headphones.amount).toHaveValue("10000");
    await expect(headphones.sender).toHaveValue("지민");
    await expect(headphones.body).toHaveValue("축하해");

    // expect: `무선 헤드폰` 폼의 버튼은 여전히 disabled 이다.
    await expect(headphones.submit).toBeDisabled();

    // expect: `생일 케이크` 폼의 필드는 비어 있다 (입력값이 카드 간에 공유되지 않음).
    await expect(cake.amount).toHaveValue("");
    await expect(cake.sender).toHaveValue("");
    await expect(cake.body).toHaveValue("");

    // 5. (부정 검증) POST 요청을 감시하면서 `무선 헤드폰` 폼의 disabled 버튼 `마음 보내기` 를 `click({ force: true })` 로 클릭합니다.
    const postRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") {
        postRequests.push(request.url());
      }
    });
    await headphones.submit.click({ force: true });

    // expect: URL 이 `/sample` 그대로이고 쿼리스트링이 붙지 않는다.
    await expect(page).toHaveURL("/sample");
    expect(new URL(page.url()).search).toBe("");

    // expect: POST 요청/토스트/모인 금액 변화가 없다 (`모인 마음` 이 `₩43,040`, `72% 달성` 그대로).
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page.getByRole("definition")).toHaveText(["2개", "₩43,040"]);
    await expect(headphonesCard.getByText("72% 달성", { exact: true })).toBeVisible();
    expect(postRequests).toEqual([]);

    // expect: 입력값이 유지된다.
    await expect(headphones.amount).toHaveValue("10000");
    await expect(headphones.sender).toHaveValue("지민");
    await expect(headphones.body).toHaveValue("축하해");

    // 6. `무선 헤드폰` 카드의 summary 를 다시 클릭합니다.
    await headphones.summary.click();

    // expect: 해당 카드의 폼만 닫히고 `생일 케이크` 폼은 열린 상태로 유지된다.
    await expect(headphones.details).toHaveJSProperty("open", false);
    await expect(headphones.amount).toBeHidden();
    await expect(headphones.sender).toBeHidden();
    await expect(headphones.body).toBeHidden();
    await expect(cake.details).toHaveJSProperty("open", true);
    await expect(cake.amount).toBeVisible();
    await expect(cake.sender).toBeVisible();
    await expect(cake.body).toBeVisible();
  });
});
