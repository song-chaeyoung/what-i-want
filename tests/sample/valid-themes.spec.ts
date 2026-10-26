// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from "@playwright/test";

// 선물 폴백 그래픽(`.gm-*`)은 카드마다 하나씩(총 2개) 있고, 테마별로 하나만 display: block 이다.
const FALLBACK_GRAPHICS = [".gm-pixel", ".gm-line", ".gm-soft"] as const;

const themes = [
  { name: "pixel_y2k", visibleGraphic: ".gm-pixel" },
  { name: "mono_bw", visibleGraphic: ".gm-line" },
  { name: "soft_pastel", visibleGraphic: ".gm-soft" },
] as const;

async function waitForSamplePage(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("Theme", () => {
  test("Valid Themes", async ({ page }) => {
    const main = page.locator("main[data-theme]");

    // 1. 쿼리 없이 `/sample` 로 이동합니다.
    await page.goto("/sample");
    await waitForSamplePage(page);

    // expect: `main[data-theme]` 의 `data-theme` 이 기본값 `pixel_y2k` 이다.
    await expect(main).toHaveCount(1);
    await expect(main).toHaveAttribute("data-theme", "pixel_y2k");

    // 2. 각 테마 값 `pixel_y2k`, `mono_bw`, `soft_pastel` 에 대해(파라미터화) `/sample?theme=<값>` 로 이동하고 `main[data-theme]` 가 나타날 때까지 대기합니다.
    // 3. 각 테마에서 선물 폴백 그래픽의 표시 상태를 확인합니다.
    for (const { name, visibleGraphic } of themes) {
      await test.step(`theme=${name}`, async () => {
        await page.goto(`/sample?theme=${name}`);
        await waitForSamplePage(page);

        // expect: `main[data-theme]` 의 `data-theme` 값이 요청한 테마와 정확히 일치한다.
        await expect(main).toHaveCount(1);
        await expect(main).toHaveAttribute("data-theme", name);

        // expect: 현재 URL 이 `/sample?theme=<값>` 그대로이다 (리다이렉트/정규화 없음).
        const url = new URL(page.url());
        expect(url.pathname).toBe("/sample");
        expect(url.search).toBe(`?theme=${name}`);

        // expect: 테마와 무관하게 콘텐츠가 동일하다: 제목 `민지님의 위시리스트`, `SAMPLE` pill, `2개`, `₩43,040`, 카드 2개, 계좌 `민지은행 0000-00-0000000` 이 모두 보인다.
        await expect(
          page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
        ).toBeVisible();
        await expect(page.getByText("SAMPLE", { exact: true })).toBeVisible();
        await expect(page.getByRole("definition")).toHaveText(["2개", "₩43,040"]);
        await expect(page.locator("article")).toHaveCount(2);
        await expect(
          page.getByText("민지은행 0000-00-0000000", { exact: true }),
        ).toBeVisible();

        // expect: `pixel_y2k`: `.gm-pixel` 만 block, `mono_bw`: `.gm-line` 만 block, `soft_pastel`: `.gm-soft` 만 block 이다.
        for (const graphic of FALLBACK_GRAPHICS) {
          const expectedDisplay = graphic === visibleGraphic ? "block" : "none";
          const graphics = page.locator(graphic);
          await expect(graphics).toHaveCount(2);
          await expect(graphics.nth(0)).toHaveCSS("display", expectedDisplay);
          await expect(graphics.nth(1)).toHaveCSS("display", expectedDisplay);
        }
      });
    }
  });
});
