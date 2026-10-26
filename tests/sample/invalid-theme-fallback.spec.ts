// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from "@playwright/test";

// 테마 값은 대소문자를 구분하고, 중복 파라미터는 유효값으로 인정되지 않는다.
const invalidQueries = [
  "theme=invalid",
  "theme=MONO_BW",
  "theme=",
  "theme=mono_bw&theme=soft_pastel",
  "theme=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
] as const;

async function waitForSamplePage(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("Theme", () => {
  test("Invalid Theme Fallback", async ({ page }) => {
    // alert/confirm/prompt 다이얼로그가 하나라도 열리면 기록하고 닫는다.
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    const main = page.locator("main[data-theme]");

    // 1. 다음 각 쿼리에 대해(파라미터화) `/sample?<쿼리>` 로 이동하고 응답 상태와 `main[data-theme]` 를 확인합니다.
    for (const query of invalidQueries) {
      await test.step(query, async () => {
        const response = await page.goto(`/sample?${query}`);
        await waitForSamplePage(page);

        // expect: 모든 경우에 응답이 HTTP 200 이고 오류 화면이 아니다.
        expect(response?.status()).toBe(200);

        // expect: `main[data-theme]` 의 `data-theme` 이 `pixel_y2k` 로 폴백된다.
        await expect(main).toHaveCount(1);
        await expect(main).toHaveAttribute("data-theme", "pixel_y2k");

        // expect: 현재 URL 의 쿼리스트링이 입력한 그대로 유지된다 (리다이렉트 없음).
        const url = new URL(page.url());
        expect(url.pathname).toBe("/sample");
        expect(url.search).toBe(`?${query}`);

        // expect: 콘텐츠가 정상 렌더링된다: 제목 `민지님의 위시리스트`, `SAMPLE` pill, 카드 2개.
        await expect(
          page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
        ).toBeVisible();
        await expect(page.getByText("SAMPLE", { exact: true })).toBeVisible();
        await expect(page.locator("article")).toHaveCount(2);

        // expect: 스크립트 형태의 값이 DOM 에 실행/삽입되지 않고 `window` 의 alert 다이얼로그가 발생하지 않는다.
        await expect(main.locator("script", { hasText: "alert(1)" })).toHaveCount(0);
        await expect(main).not.toContainText("alert(1)");
        expect(dialogs).toEqual([]);
      });
    }

    // 2. 유효 테마 후 무효 테마로 이동합니다: `/sample?theme=soft_pastel` 로 이동해 `data-theme` 이 `soft_pastel` 인 것을 확인한 뒤 `/sample?theme=nope` 로 이동합니다.
    await test.step("soft_pastel 이후 theme=nope", async () => {
      await page.goto("/sample?theme=soft_pastel");
      await waitForSamplePage(page);
      await expect(main).toHaveAttribute("data-theme", "soft_pastel");

      await page.goto("/sample?theme=nope");
      await waitForSamplePage(page);

      // expect: 두 번째 페이지의 `data-theme` 은 `pixel_y2k` 이다 (이전 테마가 남지 않음).
      await expect(main).toHaveCount(1);
      await expect(main).toHaveAttribute("data-theme", "pixel_y2k");
      expect(new URL(page.url()).search).toBe("?theme=nope");
      expect(dialogs).toEqual([]);
    });
  });
});
