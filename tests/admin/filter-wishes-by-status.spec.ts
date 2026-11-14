// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Filter Wishes By Status", async ({ page, seedAdmin, signIn }) => {
    // 1. [사전 조건] `seedAdmin({ items: [무선 이어폰, 필름 카메라, 캠핑 의자, 보드게임] })`, `signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `무선 이어폰` 을 기다립니다.
    const admin = await seedAdmin({
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
        { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 50_000 },
        { title: "캠핑 의자", targetAmount: 80_000, status: "paused" },
        { title: "보드게임", targetAmount: 40_000, status: "fulfilled" },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(
      page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    ).toBeVisible({ timeout: 30_000 });

    const tabs = page.getByRole("navigation", { name: "선물 상태 필터" });
    const cardHeadings = page.getByRole("heading", { level: 3 });

    // expect: 필터 탭 링크가 순서대로 `전체 4`, `마음 모으는 중 2`, `잠시 멈춤 1`, `완료 1`, `숨김 0` 이다.
    await expect(tabs.getByRole("link")).toHaveText([
      /^전체\s*4$/,
      /^마음 모으는 중\s*2$/,
      /^잠시 멈춤\s*1$/,
      /^완료\s*1$/,
      /^숨김\s*0$/,
    ]);

    // expect: 카드 4개가 보이고 `필름 카메라` 카드 배지는 `완료` 이다(status open 이지만 금액 달성, 코드 근거).
    await expect(cardHeadings).toHaveCount(4);
    const cameraCard = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "필름 카메라" }),
    });
    await expect(
      cameraCard.locator("summary").getByText("완료", { exact: true }),
    ).toBeVisible();

    // 2. 탭 `마음 모으는 중` 을 누릅니다.
    await tabs.getByRole("link", { name: /^마음 모으는 중/ }).click();

    // expect: URL 이 `/admin/wishes?status=open` 이다.
    await expect(page).toHaveURL(/\/admin\/wishes\?status=open$/);

    // expect: 레벨 3 제목이 `무선 이어폰`, `필름 카메라` 2개뿐이다(필름 카메라는 배지가 `완료` 여도 DB status 가 open 이라 이 탭에 있음).
    await expect(cardHeadings).toHaveText(["무선 이어폰", "필름 카메라"]);

    // expect: 지표 `총 선물` 은 `4개` 그대로이다(전체 기준).
    await expect(page.getByText("총 선물", { exact: true })).toBeVisible();
    await expect(page.getByText("4개", { exact: true })).toBeVisible();

    // expect: `details#create-wish` 가 닫혀 있다.
    await expect(page.locator("details#create-wish")).toHaveJSProperty(
      "open",
      false,
    );

    // 3. 탭 `완료` 를 누릅니다.
    await tabs.getByRole("link", { name: /^완료/ }).click();

    // expect: URL 이 `/admin/wishes?status=fulfilled` 이고 레벨 3 제목이 `보드게임` 하나뿐이다(`필름 카메라` 없음).
    await expect(page).toHaveURL(/\/admin\/wishes\?status=fulfilled$/);
    await expect(cardHeadings).toHaveText(["보드게임"]);
    await expect(
      page.getByRole("heading", { level: 3, name: "필름 카메라" }),
    ).toHaveCount(0);

    // 4. 탭 `숨김` 을 누릅니다.
    await tabs.getByRole("link", { name: /^숨김/ }).click();

    // expect: URL 이 `/admin/wishes?status=hidden` 이고 카드가 없으며 문구 `숨김 상태의 선물이 없습니다.` 와 링크 `전체 선물 보기`(href `/admin/wishes`)가 보인다.
    await expect(page).toHaveURL(/\/admin\/wishes\?status=hidden$/);
    await expect(cardHeadings).toHaveCount(0);
    await expect(page.getByText("숨김 상태의 선물이 없습니다.")).toBeVisible();
    const showAllLink = page.getByRole("link", { name: "전체 선물 보기" });
    await expect(showAllLink).toHaveAttribute("href", "/admin/wishes");

    // 5. 링크 `전체 선물 보기` 를 누릅니다.
    await showAllLink.click();

    // expect: URL 이 `/admin/wishes` 이고 카드 4개가 보인다.
    await expect(page).toHaveURL(/\/admin\/wishes$/);
    await expect(cardHeadings).toHaveCount(4);
  });
});
