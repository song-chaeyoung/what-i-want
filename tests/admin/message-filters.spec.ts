// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { test, expect } from "../fixtures/admin";

test.describe("Message Management", () => {
  test("Message Filters", async ({ page, seedAdmin, signIn }) => {
    // 1. [사전 조건] seedAdmin({ items: [무선 이어폰], messages: [김친구 생일 축하해!, 익명 익명으로 보태요 30,000원, 박친구 숨긴 메시지 숨김] }), signIn(admin). `/admin/messages` 로 이동해 `navigation "메시지 필터"` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin({
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
      messages: [
        { senderName: "김친구", body: "생일 축하해!" },
        {
          senderName: null,
          body: "익명으로 보태요",
          wishItemIndex: 0,
          amount: 30_000,
        },
        { senderName: "박친구", body: "숨긴 메시지", isHidden: true },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/messages");
    const filterNav = page.getByRole("navigation", { name: "메시지 필터" });
    await expect(filterNav).toBeVisible({ timeout: 30_000 });

    const articles = page.getByRole("article");
    const birthdayRow = articles.filter({ hasText: "생일 축하해!" });
    const anonymousRow = articles.filter({ hasText: "익명으로 보태요" });
    const hiddenRow = articles.filter({ hasText: "숨긴 메시지" });

    // expect: 탭 `받은 메시지` 가 활성(링크 href `/admin/messages`)이고, 지표 값 `2개`, 행이 `생일 축하해!`, `익명으로 보태요` 이다.
    await expect(
      filterNav.getByRole("link", { name: "받은 메시지" }),
    ).toHaveAttribute("href", "/admin/messages");
    await expect(page.getByText("2개", { exact: true })).toBeVisible();
    await expect(articles).toHaveCount(2);
    await expect(articles.nth(0)).toContainText("생일 축하해!");
    await expect(articles.nth(1)).toContainText("익명으로 보태요");

    // expect: `익명으로 보태요` 행의 보낸 사람이 `익명`, 금액이 `₩30,000` 이다.
    await expect(
      anonymousRow.getByRole("heading", { name: "익명", exact: true }),
    ).toBeVisible();
    await expect(anonymousRow).toContainText("₩30,000");

    // expect: `숨긴 메시지` 본문 행이 없다.
    await expect(hiddenRow).toHaveCount(0);

    // 2. 탭 `숨긴 메시지` 를 누릅니다.
    await filterNav.getByRole("link", { name: "숨긴 메시지" }).click();

    // expect: URL 이 `/admin/messages?filter=hidden` 이고 지표 값 `1개`, 행이 본문 `숨긴 메시지`(박친구) 하나이며 버튼 `숨김 해제` 가 있다.
    await expect(page).toHaveURL(/\/admin\/messages\?filter=hidden$/);
    await expect(page.getByText("1개", { exact: true })).toBeVisible();
    await expect(articles).toHaveCount(1);
    await expect(articles.first()).toContainText("숨긴 메시지");
    await expect(articles.first()).toContainText("박친구");
    await expect(
      articles.first().getByRole("button", { name: "숨김 해제" }),
    ).toBeVisible();

    // expect: `생일 축하해!`, `익명으로 보태요` 행이 없다.
    await expect(birthdayRow).toHaveCount(0);
    await expect(anonymousRow).toHaveCount(0);

    // 3. 탭 `받은 메시지` 를 누릅니다.
    await filterNav.getByRole("link", { name: "받은 메시지" }).click();

    // expect: URL 이 `/admin/messages` 이고 행 2개가 다시 보인다.
    await expect(page).toHaveURL(/\/admin\/messages$/);
    await expect(articles).toHaveCount(2);
    await expect(birthdayRow).toBeVisible();
    await expect(anonymousRow).toBeVisible();
  });
});
