import { chromium, expect, test, type Page } from "@playwright/test";

const titleLines = {
  "150%": ["민지님의", "공개 위시", "리스트"],
  "200%": ["민지님의", "공개", "위시", "리스트"],
} as const;

async function titleLinesOf(page: Page) {
  return page.getByRole("heading", { name: "민지님의 공개 위시리스트" }).evaluate((node) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const pieces: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      pieces.push(current as Text);
      current = walker.nextNode();
    }
    const range = document.createRange();
    const fontSize = Number.parseFloat(getComputedStyle(node).fontSize) || 16;
    const lines: string[] = [];
    let buffer = "";
    let lastTop: number | null = null;
    for (const piece of pieces) {
      const value = piece.textContent ?? "";
      for (let index = 0; index < value.length; index += 1) {
        range.setStart(piece, index);
        range.setEnd(piece, index + 1);
        const top = range.getBoundingClientRect().top;
        if (lastTop !== null && top - lastTop > fontSize * 0.6) {
          lines.push(buffer);
          buffer = "";
        }
        buffer += value[index] ?? "";
        lastTop = top;
      }
    }
    lines.push(buffer);
    return lines.map((line) => line.trim()).filter((line) => line.length > 0);
  });
}

test("keeps the default example title break at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const lines = await titleLinesOf(page);
  const zoom = await page.evaluate(() => window.matchMedia("(max-width: 17.5em)").matches);

  expect(zoom).toBe(false);
  expect(lines.join(" / ")).toContain("위시리 / 스트");
  expect(lines).not.toContain("리스트");
});

for (const [name, fontSize, lines] of [
  ["150%", 24, titleLines["150%"]],
  ["200%", 32, titleLines["200%"]],
] as const) {
  test(`wraps the example title on browser text ${name}`, async ({ baseURL }) => {
    const browser = await chromium.launch({
      args: [`--blink-settings=defaultFontSize=${fontSize}`],
    });
    const page = await browser.newPage({
      viewport: { width: 320, height: 800 },
      deviceScaleFactor: 1,
    });

    try {
      await page.goto(`${baseURL}/`);
      await page.evaluate(() => document.fonts.ready);
      const measured = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.fontSize = "medium";
        document.body.append(probe);
        const medium = getComputedStyle(probe).fontSize;
        probe.remove();
        return {
          medium,
          zoom: window.matchMedia("(max-width: 17.5em)").matches,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });

      expect(measured.medium).toBe(`${fontSize}px`);
      expect(measured.zoom).toBe(true);
      expect(measured.scrollWidth).toBeLessThanOrEqual(measured.innerWidth);
      expect(await titleLinesOf(page)).toEqual([...lines]);
    } finally {
      await browser.close();
    }
  });
}
