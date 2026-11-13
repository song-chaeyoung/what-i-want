// spec: specs/wishlist-participation.md
// seed: tests/wishlist/seed.spec.ts

import { test, expect } from "../fixtures/wishlist";

test.describe("Rendering", () => {
  test("Render by Status", async ({ page, seedWishlist }) => {
    // 1. [사전 조건] `seedWishlist(...)` 를 호출합니다.
    const { slug, items } = await seedWishlist({
      title: "E2E 렌더링 위시리스트",
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
        { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 50_000 },
        {
          title: "캠핑 의자",
          targetAmount: 80_000,
          fundedAmount: 0,
          status: "paused",
        },
        {
          title: "보드게임",
          targetAmount: 40_000,
          fundedAmount: 0,
          status: "fulfilled",
        },
        {
          title: "숨긴 선물",
          targetAmount: 100_000,
          fundedAmount: 20_000,
          status: "hidden",
        },
      ],
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "김친구",
        accountNumber: "123-456-789012",
        visibility: "always_visible",
      },
    });

    // expect: `slug`(`e2e-` 로 시작)와 `items` 5개가 반환된다.
    expect(slug).toMatch(/^e2e-/);
    expect(items).toHaveLength(5);

    // expect: items 배열 순서가 카드 순서(NO. 1 ~ NO. 4, hidden 은 마지막이라 번호에 영향 없음)가 된다.
    expect(items.map((item) => item.title)).toEqual([
      "무선 이어폰",
      "필름 카메라",
      "캠핑 의자",
      "보드게임",
      "숨긴 선물",
    ]);

    // 2. 로그인하지 않은 새 페이지에서 `/wishlist/${slug}` 로 이동하고, 레벨 1 제목 `E2E 렌더링 위시리스트` 가 보일 때까지 대기합니다.
    await page.goto(`/wishlist/${slug}`);

    // expect: 레벨 1 제목이 `E2E 렌더링 위시리스트` 이고 URL pathname 이 `/wishlist/${slug}` 로 유지된다.
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E 렌더링 위시리스트" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(`/wishlist/${slug}`);

    // expect: 문서 title 이 `E2E 렌더링 위시리스트` 이다.
    await expect(page).toHaveTitle("E2E 렌더링 위시리스트");

    // expect: 소개문 `받고 싶은 선물을 모아둔 위시리스트예요.` 가 보인다.
    await expect(
      page.getByText("받고 싶은 선물을 모아둔 위시리스트예요.", { exact: true }),
    ).toBeVisible();

    // expect: not-found 화면(`위시리스트를 찾을 수 없어요`)이 아니다.
    await expect(
      page.getByRole("heading", { name: "위시리스트를 찾을 수 없어요" }),
    ).toHaveCount(0);

    // 3. 요약 정의 목록(dl)을 확인합니다.
    const giftCount = page.locator('dt:text-is("선물") + dd');
    const gatheredAmount = page.locator('dt:text-is("모인 마음") + dd');

    // expect: 용어 `선물` 의 정의가 `4개` 이다 (hidden 카드는 개수에서 제외).
    await expect(giftCount).toHaveText("4개");

    // expect: 용어 `모인 마음` 의 정의가 `₩80,000` 이다 (30,000 + 50,000 + 0 + 0, hidden 카드의 20,000 은 포함되지 않음. 기호는 U+20A9).
    await expect(gatheredAmount).toHaveText("₩80,000");

    // expect: 정의 값이 `₩100,000` 이 아니다 (hidden 의 fundedAmount 가 합산되지 않음).
    await expect(gatheredAmount).not.toHaveText("₩100,000");

    // 4. 카드 목록(`getByRole('article')`)과 제목(`getByRole('heading', { level: 2 })`)을 확인합니다.
    const articles = page.getByRole("article");
    const earphonesCard = articles.filter({ hasText: "무선 이어폰" });
    const cameraCard = articles.filter({ hasText: "필름 카메라" });
    const chairCard = articles.filter({ hasText: "캠핑 의자" });
    const boardGameCard = articles.filter({ hasText: "보드게임" });

    // expect: `article` 이 정확히 4개이다.
    await expect(articles).toHaveCount(4);

    // expect: 레벨 2 제목이 순서대로 `무선 이어폰`, `필름 카메라`, `캠핑 의자`, `보드게임` 이다.
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "무선 이어폰",
      "필름 카메라",
      "캠핑 의자",
      "보드게임",
    ]);

    // expect: 텍스트 `숨긴 선물` 이 페이지에 존재하지 않고(count 0), 상태 라벨 `숨김` 도 존재하지 않는다.
    await expect(page.getByText("숨긴 선물")).toHaveCount(0);
    await expect(page.getByText("숨김", { exact: true })).toHaveCount(0);

    // 5. 첫 번째 카드(`getByRole('article').filter({ hasText: '무선 이어폰' })`, open 이면서 미달성)를 확인합니다.
    // expect: `NO. 1` 과 상태 라벨 `마음 모으는 중` 이 보인다.
    await expect(earphonesCard.getByText("NO. 1", { exact: true })).toBeVisible();
    await expect(
      earphonesCard.getByText("마음 모으는 중", { exact: true }),
    ).toBeVisible();

    // expect: `₩30,000`, `₩100,000 중`, `30% 달성` 이 보이고 진행 막대(`.pub-progress i`)의 inline style width 가 `30%` 이다.
    await expect(earphonesCard.getByText("₩30,000", { exact: true })).toBeVisible();
    await expect(
      earphonesCard.getByText("₩100,000 중", { exact: true }),
    ).toBeVisible();
    await expect(earphonesCard.getByText("30% 달성", { exact: true })).toBeVisible();
    await expect(earphonesCard.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*30%/,
    );

    // expect: 카드 하단에 summary `이 선물에 마음 보태기` 가 보인다 (카드 안에 `form` 은 1개, 아직 닫혀 있어 `보낼 마음` 스핀버튼은 보이지 않는다).
    await expect(
      earphonesCard.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toBeVisible();
    await expect(earphonesCard.locator("form")).toHaveCount(1);
    await expect(
      earphonesCard.getByRole("spinbutton", { name: "보낼 마음" }),
    ).toBeHidden();

    // 6. 두 번째 카드(`필름 카메라`, status 는 open 이지만 금액 달성)를 확인합니다.
    // expect: `NO. 2` 와 상태 라벨 `완료` 가 보이고 `마음 모으는 중` 은 보이지 않는다.
    await expect(cameraCard.getByText("NO. 2", { exact: true })).toBeVisible();
    await expect(cameraCard.getByText("완료", { exact: true })).toBeVisible();
    await expect(
      cameraCard.getByText("마음 모으는 중", { exact: true }),
    ).toBeHidden();

    // expect: `₩50,000`, `₩50,000 중`, `100% 달성` 이 보이고 진행 막대 width 가 `100%` 이다.
    await expect(cameraCard.getByText("₩50,000", { exact: true })).toBeVisible();
    await expect(cameraCard.getByText("₩50,000 중", { exact: true })).toBeVisible();
    await expect(cameraCard.getByText("100% 달성", { exact: true })).toBeVisible();
    await expect(cameraCard.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*100%/,
    );

    // expect: 카드 안에 `이 선물에 마음 보태기` 가 없고 `form` 도 없다 (상태 라벨만 표시).
    await expect(
      cameraCard.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toHaveCount(0);
    await expect(cameraCard.locator("form")).toHaveCount(0);

    // 7. 세 번째 카드(`캠핑 의자`, paused)를 확인합니다.
    // expect: `NO. 3` 과 상태 라벨 `잠시 멈춤` 이 보인다.
    await expect(chairCard.getByText("NO. 3", { exact: true })).toBeVisible();
    await expect(chairCard.getByText("잠시 멈춤", { exact: true })).toBeVisible();

    // expect: `₩0`, `₩80,000 중`, `0% 달성` 이 보이고 진행 막대 width 가 `0%` 이다.
    await expect(chairCard.getByText("₩0", { exact: true })).toBeVisible();
    await expect(chairCard.getByText("₩80,000 중", { exact: true })).toBeVisible();
    await expect(chairCard.getByText("0% 달성", { exact: true })).toBeVisible();
    await expect(chairCard.locator(".pub-progress i")).toHaveAttribute(
      "style",
      /width:\s*0%/,
    );

    // expect: 카드 안에 `이 선물에 마음 보태기` 와 `form` 이 없다.
    await expect(
      chairCard.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toHaveCount(0);
    await expect(chairCard.locator("form")).toHaveCount(0);

    // 8. 네 번째 카드(`보드게임`, fulfilled)를 확인합니다.
    // expect: `NO. 4` 와 상태 라벨 `완료` 가 보인다 (진행률이 0% 여도 fulfilled 라 `완료` 로 표시).
    await expect(boardGameCard.getByText("NO. 4", { exact: true })).toBeVisible();
    await expect(boardGameCard.getByText("완료", { exact: true })).toBeVisible();

    // expect: `₩0`, `₩40,000 중`, `0% 달성` 이 보인다.
    await expect(boardGameCard.getByText("₩0", { exact: true })).toBeVisible();
    await expect(
      boardGameCard.getByText("₩40,000 중", { exact: true }),
    ).toBeVisible();
    await expect(boardGameCard.getByText("0% 달성", { exact: true })).toBeVisible();

    // expect: 카드 안에 `이 선물에 마음 보태기` 와 `form` 이 없다.
    await expect(
      boardGameCard.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toHaveCount(0);
    await expect(boardGameCard.locator("form")).toHaveCount(0);

    // 9. 페이지 전체에서 상태 라벨과 폼 진입점의 개수를 확인합니다.
    // expect: `완료` 라벨이 정확히 2개(필름 카메라, 보드게임), `잠시 멈춤` 이 1개, `마음 모으는 중` 이 1개이다.
    await expect(page.getByText("완료", { exact: true })).toHaveCount(2);
    await expect(page.getByText("잠시 멈춤", { exact: true })).toHaveCount(1);
    await expect(page.getByText("마음 모으는 중", { exact: true })).toHaveCount(1);

    // expect: `이 선물에 마음 보태기` 가 페이지 전체에 정확히 1개이고 `무선 이어폰` 카드 안에 있다.
    await expect(
      page.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toHaveCount(1);
    await expect(
      earphonesCard.getByText("이 선물에 마음 보태기", { exact: true }),
    ).toHaveCount(1);
  });
});
