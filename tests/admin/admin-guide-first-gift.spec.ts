// spec: specs/admin-management-2.md
// seed: tests/admin/seed-guide.spec.ts

import { test, expect } from "../fixtures/admin";

const GUIDE_KEY = "mwagotgo:admin-guide-seen";

test.describe("Admin Guide", () => {
  test("Guide First Gift Action", async ({ page, seedAdmin, signIn }) => {
    const readSeen = () =>
      page.evaluate((key) => localStorage.getItem(key), GUIDE_KEY);

    // 1. [사전 조건] seedAdmin()(선물 없음), signIn(admin, { showAdminGuide: true }). `/admin` 으로 이동해 dialog 를 기다리고 `다음` 을 두 번 눌러 `03 / 03` 으로 갑니다.
    const admin = await seedAdmin();
    await signIn(admin, { showAdminGuide: true });

    await page.goto("/admin");
    const dialog = page.getByRole("dialog", {
      name: "이제 위시리스트를 만들어볼까요?",
    });
    await expect(dialog).toBeVisible({ timeout: 30_000 });

    await dialog.getByRole("button", { name: "다음" }).click();
    await expect(dialog.getByText("02 / 03", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "다음" }).click();

    // expect: 진행 표시 `03 / 03`, 버튼 `첫 선물 담기` 가 보인다.
    await expect(dialog.getByText("03 / 03", { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "첫 선물 담기" }),
    ).toBeVisible();

    // expect: localStorage `mwagotgo:admin-guide-seen` 이 `null` 이다.
    expect(await readSeen()).toBeNull();

    // 2. 버튼 `첫 선물 담기` 를 누릅니다.
    await dialog.getByRole("button", { name: "첫 선물 담기" }).click();

    // expect: URL 이 `/admin/wishes#create-wish` 가 된다.
    await expect(page).toHaveURL(/\/admin\/wishes#create-wish$/, {
      timeout: 30_000,
    });

    // expect: `details#create-wish` 가 열려 있고(summary `선물 추가`·`접기`) `선물 이름` 입력과 `등록된 선물이 없습니다.` 가 보인다.
    const createPanel = page.locator("details#create-wish");
    await expect(createPanel).toBeVisible({ timeout: 30_000 });
    await expect(createPanel).toHaveJSProperty("open", true);
    await expect(createPanel.locator("summary")).toContainText("선물 추가");
    await expect(createPanel.locator("summary")).toContainText("접기");
    await expect(page.getByLabel("선물 이름")).toBeVisible();
    await expect(page.getByText("등록된 선물이 없습니다.")).toBeVisible();

    // expect: localStorage 가 `"1"` 이다(닫기가 이동 전에 기록됨).
    expect(await readSeen()).toBe("1");

    // expect: 위 요소가 보인 뒤 dialog 가 없다(보조 단언).
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
