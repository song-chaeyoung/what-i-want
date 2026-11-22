// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { test, expect } from "../fixtures/admin";

const WON = "₩";

test.describe("Admin Dashboard", () => {
  test("Dashboard Empty State", async ({ page, seedAdmin, signIn }) => {
    // 1. [사전 조건] 선물·메시지·계좌 없는 seedAdmin, signIn(기본값이라 안내 모달 없음). `/admin` 에서 `등록된 선물이 없습니다.` 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin");
    await expect(
      page.getByText("등록된 선물이 없습니다.", { exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const main = page.getByRole("main");
    const metric = (label: string) =>
      main.getByText(label, { exact: true }).locator("xpath=..");

    // expect: 지표 `선물` 0개, `메시지` 0개, `모인 금액` ₩0 이다.
    await expect(metric("선물").locator("p").nth(1)).toHaveText("0개");
    await expect(metric("메시지").locator("p").nth(1)).toHaveText("0개");
    await expect(metric("모인 금액").locator("p").nth(1)).toHaveText(`${WON}0`);

    // expect: `공유하기` 버튼과 `열어 보기` 링크(href `/wishlist/${admin.slug}`)가 있다.
    await expect(main.getByRole("button", { name: "공유하기" })).toBeVisible();
    await expect(main.getByRole("link", { name: "열어 보기" })).toHaveAttribute(
      "href",
      `/wishlist/${admin.slug}`,
    );

    // 2. `최근 선물` 빈 상태를 확인합니다.
    const wishPanel = main
      .getByRole("heading", { level: 3, name: "최근 선물" })
      .locator("xpath=ancestor::section[1]");

    // expect: 문구와 설명이 보인다.
    await expect(
      wishPanel.getByText("등록된 선물이 없습니다.", { exact: true }),
    ).toBeVisible();
    await expect(
      wishPanel.getByText(
        "첫 선물을 추가하면 운영 목록과 공개 페이지에 바로 반영됩니다.",
        { exact: true },
      ),
    ).toBeVisible();

    // expect: 링크 `선물 추가` 와 `전체 보기` 의 href 가 `/admin/wishes` 이다.
    await expect(wishPanel.getByRole("link", { name: "선물 추가" })).toHaveAttribute(
      "href",
      "/admin/wishes",
    );
    await expect(wishPanel.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/admin/wishes",
    );

    // 3. `최근 메시지` 빈 상태를 확인합니다.
    const messagePanel = main
      .getByRole("heading", { level: 3, name: "최근 메시지" })
      .locator("xpath=ancestor::section[1]");

    // expect: 문구와 설명이 보인다.
    await expect(
      messagePanel.getByText("아직 메시지가 없습니다.", { exact: true }),
    ).toBeVisible();
    await expect(
      messagePanel.getByText(
        "공개 페이지에서 마음이 도착하면 이곳에서 빠르게 확인합니다.",
        { exact: true },
      ),
    ).toBeVisible();

    // expect: 링크 `공개 페이지 보기` 가 헤더와 빈 상태에 2개이고 둘 다 href 가 `/wishlist/${admin.slug}` 이다.
    const publicLinks = main.getByRole("link", { name: "공개 페이지 보기" });
    await expect(publicLinks).toHaveCount(2);
    for (const link of await publicLinks.all()) {
      await expect(link).toHaveAttribute("href", `/wishlist/${admin.slug}`);
    }
    await expect(
      messagePanel.getByRole("link", { name: "공개 페이지 보기" }),
    ).toHaveAttribute("href", `/wishlist/${admin.slug}`);

    // 4. 링크 `선물 추가` 를 누릅니다.
    await wishPanel.getByRole("link", { name: "선물 추가" }).click();

    // expect: URL 이 `/admin/wishes` 가 되고 `details#create-wish` 가 열려 있다.
    await expect(page).toHaveURL(/\/admin\/wishes$/, { timeout: 30_000 });
    await expect(page.locator("details#create-wish")).toHaveJSProperty(
      "open",
      true,
      { timeout: 30_000 },
    );
  });
});
