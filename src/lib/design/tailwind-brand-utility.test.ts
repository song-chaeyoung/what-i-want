import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

/**
 * Tailwind 4 `@theme inline` copies the bridge value into the utility.
 * These class names stay in source so the compiler emits them.
 */
const brandUtilities = [
  ["text-ink", "color:var(--brand-ink)"],
  ["bg-ink", "background-color:var(--brand-ink)"],
  ["border-ink", "border-color:var(--brand-ink)"],
  ["bg-paper", "background-color:var(--brand-paper)"],
  ["border-line", "border-color:var(--brand-line)"],
  ["text-teal", "color:var(--brand-teal)"],
  ["bg-mint", "background-color:var(--brand-mint)"],
  ["text-purple", "color:var(--brand-purple)"],
  ["bg-orange", "background-color:var(--brand-orange)"],
] as const;

const fixedColors = {
  "text-ink": ["color", "#171717"],
  "bg-ink": ["backgroundColor", "#171717"],
  "border-ink": ["borderTopColor", "#171717"],
  "bg-paper": ["backgroundColor", "#fffdf7"],
  "border-line": ["borderTopColor", "#d1d5db"],
  "text-teal": ["color", "#0f766e"],
  "bg-mint": ["backgroundColor", "#ccfbf1"],
  "text-purple": ["color", "#4c1d95"],
  "bg-orange": ["backgroundColor", "#f97316"],
} as const;

const themeProbes = {
  pixel_y2k: { pubInk: "#171717", headline: "#4c1d95" },
  mono_bw: { pubInk: "#111111", headline: "#ffffff" },
  soft_pastel: { pubInk: "#5b5566", headline: "#bd6595" },
} as const;

const chromePath = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((path) => existsSync(path));

const require = createRequire(import.meta.url);
const tailwindEntry = realpathSync(require.resolve("@tailwindcss/postcss"));
const requireFromTailwind = createRequire(tailwindEntry);
const postcss = requireFromTailwind("postcss") as (
  plugins: unknown[],
) => {
  process: (css: string, options: { from: string }) => Promise<{ css: string }>;
};
const tailwindPlugin = requireFromTailwind("@tailwindcss/postcss") as (options?: {
  optimize?: boolean;
}) => unknown;

async function compileGlobals(optimize: boolean) {
  const sourcePath = join(process.cwd(), "app/globals.css");
  const source = readFileSync(sourcePath, "utf8");
  const result = await postcss([tailwindPlugin({ optimize })]).process(source, {
    from: sourcePath,
  });

  return result.css;
}

function compact(css: string) {
  return css.replace(/\s+/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hexToRgb(hex: string) {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
}

function normalizeColor(value: string) {
  return value.replace(/\s+/g, "").replace(/rgba\((\d+),(\d+),(\d+),1\)/, "rgb($1,$2,$3)");
}

describe("compiled Tailwind brand utilities", () => {
  let devCss = "";
  let prodCss = "";

  beforeAll(async () => {
    devCss = await compileGlobals(false);
    prodCss = await compileGlobals(true);
  }, 30000);

  test("keeps @theme inline utilities on --brand-* in dev and production output", () => {
    for (const css of [devCss, prodCss]) {
      const minified = compact(css);

      for (const [className, declaration] of brandUtilities) {
        expect(minified, className).toMatch(
          new RegExp(`\\.${escapeRegExp(className)}\\{${escapeRegExp(declaration)};?\\}`),
        );
      }

      expect(minified).not.toContain(".text-purple{color:var(--headline)}");
      expect(minified).not.toContain(".text-ink{color:var(--ink)}");
      expect(minified).not.toContain(".bg-paper{background-color:var(--surface)}");
      expect(minified).not.toContain(".text-teal{color:var(--accent-main)}");
      expect(minified).not.toContain(".bg-mint{background-color:var(--tint-mint)}");
      expect(minified).not.toContain(".bg-orange{background-color:var(--point)}");
    }
  });

  test.skipIf(!chromePath)(
    "keeps fixed brand utility colors inside every public theme",
    async () => {
      const { chromium } = await import("@playwright/test");
      const utilityMarkup = Object.keys(fixedColors)
        .map((className) => `<i class="${className}" data-probe="${className}"></i>`)
        .join("");
      const themeMarkup = Object.keys(themeProbes)
        .map(
          (themeId) => `<section class="pub-page" data-theme="${themeId}">
            ${utilityMarkup}
            <i data-probe="pub-ink" style="color: var(--pub-ink)"></i>
            <i data-probe="headline" style="color: var(--headline)"></i>
          </section>`,
        )
        .join("");
      const html = `<!doctype html><html><head><style>${devCss}</style></head><body>
        <section data-theme="root">${utilityMarkup}</section>
        ${themeMarkup}
      </body></html>`;
      const dir = mkdtempSync(join(tmpdir(), "brand-utilities-"));
      const file = join(dir, "index.html");
      writeFileSync(file, html);

      const browser = await chromium.launch({
        executablePath: chromePath,
        args: ["--no-sandbox", "--disable-gpu"],
      });

      try {
        const page = await browser.newPage();
        await page.goto(`file://${file}`);
        const probes = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("[data-probe]")].map((element) => {
            const style = getComputedStyle(element);
            const themeRoot = element.closest<HTMLElement>("[data-theme]");

            return {
              probe: element.dataset.probe ?? "",
              theme: themeRoot?.dataset.theme ?? "root",
              color: style.color,
              backgroundColor: style.backgroundColor,
              borderTopColor: style.borderTopColor,
              brandPurple: style.getPropertyValue("--brand-purple").trim(),
              pubInk: style.getPropertyValue("--pub-ink").trim(),
              headline: style.getPropertyValue("--headline").trim(),
            };
          }),
        );

        for (const probe of probes) {
          if (probe.probe in fixedColors) {
            const [property, hex] = fixedColors[probe.probe as keyof typeof fixedColors];
            const actual = probe[property];

            expect(normalizeColor(actual), `${probe.theme} ${probe.probe}`).toBe(
              normalizeColor(hexToRgb(hex)),
            );
            expect(probe.brandPurple.toLowerCase(), `${probe.theme} brand purple`).toBe("#4c1d95");
          }
        }

        for (const probe of probes.filter((item) => item.probe === "pub-ink")) {
          const expected = themeProbes[probe.theme as keyof typeof themeProbes];

          expect(expected, probe.theme).toBeTruthy();
          expect(normalizeColor(probe.color), `${probe.theme} pub ink`).toBe(
            normalizeColor(hexToRgb(expected.pubInk)),
          );
        }

        for (const probe of probes.filter((item) => item.probe === "headline")) {
          const expected = themeProbes[probe.theme as keyof typeof themeProbes];

          expect(normalizeColor(probe.color), `${probe.theme} headline`).toBe(
            normalizeColor(hexToRgb(expected.headline)),
          );
        }
      } finally {
        await browser.close();
      }
    },
    30000,
  );
});
