// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Page Overview", () => {
  test("Gift Cards", async ({ page }) => {
    // 1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기한 뒤 `article` 요소를 조회합니다.
    await page.goto("/sample");
    await expect(
      page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });

    const articles = page.getByRole("article");
    const headphonesCard = articles.filter({ hasText: "무선 헤드폰" });
    const cakeCard = articles.filter({ hasText: "생일 케이크" });

    // expect: `article` 이 정확히 2개이다.
    await expect(articles).toHaveCount(2);

    // expect: DOM 순서가 `계좌 안내` details -> `축하 메시지 남기기` details -> 선물 카드 2개 -> `make your own` CTA 순이다.
    const sections = articles.first().locator("..").locator(":scope > *");
    await expect(sections).toHaveCount(5);
    await expect(sections.nth(0)).toHaveJSProperty("tagName", "DETAILS");
    await expect(sections.nth(0)).toContainText("계좌 안내");
    await expect(sections.nth(1)).toHaveJSProperty("tagName", "DETAILS");
    await expect(sections.nth(1)).toContainText("축하 메시지 남기기");
    await expect(sections.nth(2)).toHaveJSProperty("tagName", "ARTICLE");
    await expect(sections.nth(3)).toHaveJSProperty("tagName", "ARTICLE");
    await expect(sections.nth(4)).toContainText("make your own");

    // expect: 카드 순서가 `무선 헤드폰`(1번째), `생일 케이크`(2번째) 이다.
    await expect(articles.nth(0)).toContainText("무선 헤드폰");
    await expect(articles.nth(1)).toContainText("생일 케이크");

    // 2. 첫 번째 카드(`무선 헤드폰`)의 내용을 확인합니다.
    // expect: `NO. 1` 과 상태 라벨 `마음 모으는 중` 이 보인다.
    await expect(headphonesCard.getByText("NO. 1", { exact: true })).toBeVisible();
    await expect(
      headphonesCard.getByText("마음 모으는 중", { exact: true }),
    ).toBeVisible();

    // expect: 레벨 2 제목 `무선 헤드폰` 이 보인다.
    await expect(
      headphonesCard.getByRole("heading", { level: 2, name: "무선 헤드폰" }),
    ).toBeVisible();

    // expect: 설명 `출퇴근길에 늘 쓰고 다닐 헤드폰이에요. 색은 크림색이 좋아요!` 가 보인다.
    await expect(
      headphonesCard.getByText(
        "출퇴근길에 늘 쓰고 다닐 헤드폰이에요. 색은 크림색이 좋아요!",
        { exact: true },
      ),
    ).toBeVisible();

    // expect: `gift progress` 라벨, 모인 금액 `₩32,400`, 목표 금액 `₩45,000 중`, 진행률 `72% 달성` 이 보인다.
    await expect(
      headphonesCard.getByText("gift progress", { exact: true }),
    ).toBeVisible();
    await expect(headphonesCard.getByText("₩32,400", { exact: true })).toBeVisible();
    await expect(
      headphonesCard.getByText("₩45,000 중", { exact: true }),
    ).toBeVisible();
    await expect(headphonesCard.getByText("72% 달성", { exact: true })).toBeVisible();

    // expect: 진행 막대(`.pub-progress i`)의 inline style width 가 `72%` 이다.
    await expect(headphonesCard.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*72%/,
    );

    // 3. 두 번째 카드(`생일 케이크`)의 내용을 확인합니다.
    // expect: `NO. 2` 와 상태 라벨 `마음 모으는 중` 이 보인다.
    await expect(cakeCard.getByText("NO. 2", { exact: true })).toBeVisible();
    await expect(cakeCard.getByText("마음 모으는 중", { exact: true })).toBeVisible();

    // expect: 레벨 2 제목 `생일 케이크` 가 보인다.
    await expect(
      cakeCard.getByRole("heading", { level: 2, name: "생일 케이크" }),
    ).toBeVisible();

    // expect: 설명 `올해는 딸기 생크림 케이크로 함께 축하해주세요.` 가 보인다.
    await expect(
      cakeCard.getByText("올해는 딸기 생크림 케이크로 함께 축하해주세요.", {
        exact: true,
      }),
    ).toBeVisible();

    // expect: `₩10,640`, `₩28,000 중`, `38% 달성` 이 보이고 진행 막대 width 가 `38%` 이다.
    await expect(cakeCard.getByText("₩10,640", { exact: true })).toBeVisible();
    await expect(cakeCard.getByText("₩28,000 중", { exact: true })).toBeVisible();
    await expect(cakeCard.getByText("38% 달성", { exact: true })).toBeVisible();
    await expect(cakeCard.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*38%/,
    );

    // 4. 두 카드에 없어야 하는 요소를 확인합니다. (부정 검증)
    // expect: 링크 `선물 링크 보기` 가 페이지에 존재하지 않는다 (productUrl 이 null).
    await expect(page.getByRole("link", { name: "선물 링크 보기" })).toHaveCount(0);

    // expect: 상태 라벨 `완료` 가 존재하지 않는다 (진행 중인 선물만 있음).
    await expect(page.getByText("완료", { exact: true })).toHaveCount(0);

    // expect: 카드 내부에 실제 `<img>` 는 없고 폴백 그래픽 텍스트 `GIFT` 가 각 카드에 있다 (기본 테마에서는 `.gm-pixel` 이 보인다).
    await expect(articles.locator("img")).toHaveCount(0);
    for (const card of [headphonesCard, cakeCard]) {
      const pixelFallback = card.locator(".gm-pixel");
      await expect(pixelFallback).toBeVisible();
      await expect(pixelFallback.getByText("GIFT", { exact: true })).toBeVisible();
    }

    // expect: 각 카드 하단에 summary `이 선물에 마음 보태기` 가 보이고 폼 필드는 아직 보이지 않는다.
    const cardFormFieldIds = [
      {
        card: headphonesCard,
        ids: [
          "#participation-amount-sample-headphones",
          "#participation-sender-sample-headphones",
          "#participation-body-sample-headphones",
        ],
      },
      {
        card: cakeCard,
        ids: [
          "#participation-amount-sample-cake",
          "#participation-sender-sample-cake",
          "#participation-body-sample-cake",
        ],
      },
    ];
    for (const { card, ids } of cardFormFieldIds) {
      await expect(card.getByText("이 선물에 마음 보태기", { exact: true })).toBeVisible();
      await expect(card.locator("details")).toHaveJSProperty("open", false);
      for (const id of ids) {
        await expect(card.locator(id)).toBeHidden();
      }
    }
  });
});
