// spec: specs/admin-management-2.md
// seed: tests/admin/seed-guide.spec.ts

import { test, expect } from "../fixtures/admin";

const GUIDE_KEY = "mwagotgo:admin-guide-seen";

test.describe("Admin Guide", () => {
  test("First Visit Guide", async ({ page, seedAdmin, signIn }) => {
    const readSeen = () =>
      page.evaluate((key) => localStorage.getItem(key), GUIDE_KEY);

    // 1. [사전 조건] seedAdmin(), signIn(admin, { showAdminGuide: true }). `/admin` 으로 이동해 안내 dialog 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin, { showAdminGuide: true });

    await page.goto("/admin");
    const dialog = page.getByRole("dialog", {
      name: "이제 위시리스트를 만들어볼까요?",
    });
    await expect(dialog).toBeVisible({ timeout: 30_000 });

    // expect: localStorage `mwagotgo:admin-guide-seen` 이 `null` 이다.
    expect(await readSeen()).toBeNull();

    // expect: 진행 표시 `01 / 03`, 단계 제목, 버튼 3개가 있고 `이전` 은 없으며 초기 포커스는 `다음` 이다.
    await expect(dialog.getByText("01 / 03", { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "갖고 싶은 선물을 담아요" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "관리 화면 먼저 둘러보기" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "다음" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "안내 닫기" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "이전" })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "다음" })).toBeFocused();

    // 2. `다음` → `이전` → `다음` → `다음` 순서로 누릅니다.
    await dialog.getByRole("button", { name: "다음" }).click();

    // expect: 첫 `다음` 후 `02 / 03`, 단계 제목 `친구에게 보일 페이지를 확인해요`, 버튼 `이전` 이 나타난다.
    await expect(dialog.getByText("02 / 03", { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "친구에게 보일 페이지를 확인해요" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "이전" })).toBeVisible();

    // expect: `이전` 후 `01 / 03` 으로 돌아온다.
    await dialog.getByRole("button", { name: "이전" }).click();
    await expect(dialog.getByText("01 / 03", { exact: true })).toBeVisible();

    // expect: `다음` 두 번 뒤 `03 / 03`, 단계 제목, 버튼 구성이 맞고 `다음` 은 없다.
    await dialog.getByRole("button", { name: "다음" }).click();
    await expect(dialog.getByText("02 / 03", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "다음" }).click();
    await expect(dialog.getByText("03 / 03", { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "링크를 보내고 마음을 기다려요" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "관리 화면 먼저 둘러보기" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "이전" })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "첫 선물 담기" }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "안내 닫기" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "다음" })).toHaveCount(0);

    // expect: 단계를 넘기는 동안 localStorage 는 여전히 `null` 이다.
    expect(await readSeen()).toBeNull();

    // 3. 버튼 `안내 닫기` 를 누릅니다.
    await dialog.getByRole("button", { name: "안내 닫기" }).click();

    // expect: dialog 가 닫힌다.
    await expect(dialog).toHaveCount(0);

    // expect: localStorage 가 `"1"` 이고 URL 은 `/admin` 그대로이다.
    expect(await readSeen()).toBe("1");
    await expect(page).toHaveURL(/\/admin$/);

    // 4. 다시 들어오면 안 보이는지 확인. `/admin/settings` 로 전체 이동해 `저장하기` 를 누릅니다(폼 POST → 문서 전체 재로드).
    const saveButton = page.getByRole("button", { name: "저장하기" });
    const savedToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    const anyDialog = page.getByRole("dialog");

    await page.goto("/admin/settings");
    await expect(saveButton).toBeVisible({ timeout: 30_000 });
    await saveButton.click();

    // expect: 토스트와 URL 정리(hydration 이후의 신호)가 끝난 시점에 dialog 가 0개이고 localStorage 는 `"1"` 그대로이다.
    await expect(savedToast).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 15_000 });
    await expect(anyDialog).toHaveCount(0);
    expect(await readSeen()).toBe("1");

    // expect: [대조] 토스트가 사라진 뒤 localStorage 를 지우고 다시 저장하면 같은 신호 시점에 dialog 가 열려 있다.
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
      timeout: 10_000,
    });
    await page.evaluate((key) => localStorage.removeItem(key), GUIDE_KEY);

    await expect(saveButton).toBeVisible({ timeout: 30_000 });
    await saveButton.click();
    await expect(savedToast).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 15_000 });
    // 재시도 없이 같은 시점의 개수를 읽어, 위의 0개 단언과 같은 조건에서 비교한다.
    expect(await dialog.count()).toBe(1);
    await expect(dialog).toBeVisible();
  });
});
