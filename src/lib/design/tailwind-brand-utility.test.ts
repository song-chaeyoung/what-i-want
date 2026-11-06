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

const semanticUtilities = [
  [String.raw`.text-\[var\(--headline\)\]`, "color:var(--headline)"],
  [String.raw`.text-\[var\(--ink\)\]`, "color:var(--ink)"],
  [String.raw`.text-\[var\(--ink-muted\)\]`, "color:var(--ink-muted)"],
  [String.raw`.text-\[var\(--accent-main\)\]`, "color:var(--accent-main)"],
] as const;

const removedPubAliasPattern =
  /--pub-(?:bg|header-bg|surface|ink|sub|headline-color|headline-on-header|accent|point|fallback-bg|msg-bg)(?![\w-])/;

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

const themeColors = {
  pixel_y2k: {
    ink: "#171717",
    inkMuted: "#3f3f46",
    surfacePage: "#fff7ed",
    surface: "#fffdf7",
    surfaceHeader: "#fef3c7",
    headline: "#4c1d95",
    accent: "#0f766e",
    point: "#f97316",
    tintMint: "#ccfbf1",
    tintBlush: "#ffe4e6",
  },
  mono_bw: {
    ink: "#111111",
    inkMuted: "#6b6b6b",
    surfacePage: "#ffffff",
    surface: "#ffffff",
    surfaceHeader: "#111111",
    headline: "#ffffff",
    accent: "#111111",
    point: "#111111",
    tintMint: "#f3f3f3",
    tintBlush: "#fafafa",
  },
  soft_pastel: {
    ink: "#5b5566",
    inkMuted: "#8b8398",
    surfacePage: "#fbf5ff",
    surface: "#ffffff",
    surfaceHeader: "#ffeaf3",
    headline: "#bd6595",
    accent: "#7fb8ab",
    point: "#f79f97",
    tintMint: "#fdeef5",
    tintBlush: "#fdeef5",
  },
} as const;

const toastColors = {
  default: {
    background: "#ffffff",
    border: "#d1d5db",
    success: "#0f766e",
    successBackground: "#ffffff",
    warning: "#f97316",
    info: "#4c1d95",
  },
  pixel_y2k: {
    background: "#fffdf7",
    color: "#171717",
    border: "#171717",
    success: "#0f766e",
    successBackground: "#ccfbf1",
    warning: "#f97316",
    info: "#4c1d95",
  },
  mono_bw: {
    background: "#ffffff",
    color: "#111111",
    border: "#111111",
    success: "#111111",
    successBackground: "#ffffff",
    warning: "#111111",
    info: "#111111",
  },
  soft_pastel: {
    background: "#fffafc",
    color: "#5b5566",
    border: "#f0dfe9",
    success: "#3f7a6e",
    successBackground: "#ffe1ec",
    warning: "#f97316",
    info: "#4c1d95",
  },
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

      for (const [selector, declaration] of semanticUtilities) {
        expect(minified, selector).toMatch(
          new RegExp(`${escapeRegExp(selector)}\\{${escapeRegExp(declaration)};?\\}`),
        );
      }

      expect(minified).toMatch(/\.pub-card\{[^}]*--headline:var\(--ink\)/);
      expect(minified).toMatch(/\.pub-headline\{[^}]*color:var\(--headline\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*background-color:var\(--surface-page\)/);
      expect(minified).not.toMatch(removedPubAliasPattern);
    }
  });

  test.skipIf(!chromePath)(
    "keeps computed public theme colors, card headline ink, and fixed brand colors",
    async () => {
      const { chromium } = await import("@playwright/test");
      const browser = await chromium.launch({
        executablePath: chromePath,
        args: ["--no-sandbox", "--disable-gpu"],
      });

      try {
        const page = await browser.newPage();

        for (const [label, css] of [
          ["dev", devCss],
          ["prod", prodCss],
        ] as const) {
          await expectDefaultComputedColors(page, css, label);
          for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
            await expectThemeComputedColors(page, css, label, themeId);
          }
        }
      } finally {
        await browser.close();
      }
    },
    60000,
  );
});

function themeMarkup(themeId?: string) {
  const themeAttribute = themeId ? ` data-theme="${themeId}"` : "";
  const utilities = Object.keys(fixedColors)
    .map((className) => `<i class="${className}" data-probe="${className}"></i>`)
    .join("");

  return `<section class="pub-page"${themeAttribute} data-probe="page">
    <header class="pub-header" data-probe="header">
      <h1 class="pub-headline" data-probe="header-title">제목</h1>
      <div class="pub-stat" data-probe="stat">
        <span class="text-[var(--headline)]" data-probe="stat-value">1</span>
      </div>
      ${utilities}
    </header>
    <article class="pub-card" data-probe="card">
      <h2 class="text-[var(--headline)]" data-probe="card-title">카드</h2>
      <p class="text-[var(--ink-muted)]" data-probe="muted">설명</p>
      <div class="pub-fallback" data-probe="fallback"></div>
      <div class="pub-msg" data-probe="msg"></div>
      <button class="pub-btn" data-probe="btn" type="button">버튼</button>
      <button class="pub-btn pub-btn-primary" data-probe="btn-primary" type="button">주요</button>
      <button class="pub-btn pub-btn-accent" data-probe="btn-accent" type="button">강조</button>
    </article>
  </section>`;
}

function toastMarkup() {
  return `<div data-sonner-toast class="cn-toast" data-probe="toast"></div>
    <div data-sonner-toast class="cn-toast" data-type="success" data-probe="toast-success">
      <span data-icon data-probe="toast-success-icon"></span>
    </div>
    <div data-sonner-toast class="cn-toast" data-type="warning" data-probe="toast-warning">
      <span data-icon data-probe="toast-warning-icon"></span>
    </div>
    <div data-sonner-toast class="cn-toast" data-type="info" data-probe="toast-info">
      <span data-icon data-probe="toast-info-icon"></span>
    </div>`;
}

async function readProbes(
  page: {
    goto: (url: string) => Promise<unknown>;
    evaluate: <T>(fn: () => T) => Promise<T>;
  },
  css: string,
  body: string,
) {
  const html = `<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`;
  const dir = mkdtempSync(join(tmpdir(), "theme-colors-"));
  const file = join(dir, "index.html");
  writeFileSync(file, html);
  await page.goto(`file://${file}`);

  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-probe]")].map((element) => {
      const style = getComputedStyle(element);

      return {
        probe: element.dataset.probe ?? "",
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        brandPurple: style.getPropertyValue("--brand-purple").trim(),
      };
    }),
  );
}

function expectRgb(actual: string, hex: string, label: string) {
  expect(normalizeColor(actual), label).toBe(normalizeColor(hexToRgb(hex)));
}

async function expectDefaultComputedColors(
  page: {
    goto: (url: string) => Promise<unknown>;
    evaluate: <T>(fn: () => T) => Promise<T>;
  },
  css: string,
  label: string,
) {
  const probes = await readProbes(
    page,
    css,
    `${themeMarkup()}${toastMarkup()}<section data-probe="root">${Object.keys(fixedColors)
      .map((className) => `<i class="${className}" data-probe="root-${className}"></i>`)
      .join("")}</section>`,
  );
  const byProbe = new Map(probes.map((probe) => [probe.probe, probe]));
  const colors = themeColors.pixel_y2k;

  expectThemeSurface(byProbe, colors, `${label} default`);
  expectBrandUtilities(byProbe, `${label} default`);
  for (const [className, [property, hex]] of Object.entries(fixedColors)) {
    const probe = byProbe.get(`root-${className}`);
    expect(probe, className).toBeTruthy();
    expectRgb(probe![property], hex, `${label} root ${className}`);
  }
  expectToast(byProbe, toastColors.default, `${label} default toast`);
}

async function expectThemeComputedColors(
  page: {
    goto: (url: string) => Promise<unknown>;
    evaluate: <T>(fn: () => T) => Promise<T>;
  },
  css: string,
  label: string,
  themeId: keyof typeof themeColors,
) {
  const probes = await readProbes(page, css, `${themeMarkup(themeId)}${toastMarkup()}`);
  const byProbe = new Map(probes.map((probe) => [probe.probe, probe]));
  const colors = themeColors[themeId];
  const prefix = `${label} ${themeId}`;

  expectThemeSurface(byProbe, colors, prefix);
  expectBrandUtilities(byProbe, prefix);
  expectToast(byProbe, toastColors[themeId], `${prefix} toast`);
}

function expectThemeSurface(
  probes: Map<string, { color: string; backgroundColor: string; brandPurple: string }>,
  colors: (typeof themeColors)[keyof typeof themeColors],
  label: string,
) {
  const page = probes.get("page");
  const header = probes.get("header");
  const headerTitle = probes.get("header-title");
  const statValue = probes.get("stat-value");
  const card = probes.get("card");
  const cardTitle = probes.get("card-title");
  const muted = probes.get("muted");
  const fallback = probes.get("fallback");
  const message = probes.get("msg");
  const button = probes.get("btn");
  const primary = probes.get("btn-primary");
  const accent = probes.get("btn-accent");

  expect(page, label).toBeTruthy();
  expectRgb(page!.backgroundColor, colors.surfacePage, `${label} page`);
  expectRgb(page!.color, colors.ink, `${label} page ink`);
  expectRgb(header!.backgroundColor, colors.surfaceHeader, `${label} header`);
  expectRgb(headerTitle!.color, colors.headline, `${label} header title`);
  expectRgb(statValue!.color, colors.headline, `${label} stat`);
  expectRgb(card!.backgroundColor, colors.surface, `${label} card`);
  expectRgb(cardTitle!.color, colors.ink, `${label} card title`);
  expectRgb(muted!.color, colors.inkMuted, `${label} muted`);
  expectRgb(fallback!.backgroundColor, colors.tintMint, `${label} fallback`);
  expectRgb(message!.backgroundColor, colors.tintBlush, `${label} message`);
  expectRgb(button!.backgroundColor, colors.surface, `${label} button`);
  expectRgb(button!.color, colors.ink, `${label} button ink`);
  expectRgb(primary!.backgroundColor, colors.point, `${label} primary`);
  expectRgb(primary!.color, "#ffffff", `${label} primary ink`);
  expectRgb(accent!.backgroundColor, colors.accent, `${label} accent`);
  expectRgb(accent!.color, "#ffffff", `${label} accent ink`);
  expect(cardTitle!.brandPurple.toLowerCase(), `${label} inherited brand`).toBe("#4c1d95");
}

function expectBrandUtilities(
  probes: Map<string, { color: string; backgroundColor: string; borderTopColor: string; brandPurple: string }>,
  label: string,
) {
  for (const [className, [property, hex]] of Object.entries(fixedColors)) {
    const probe = probes.get(className);
    expect(probe, `${label} ${className}`).toBeTruthy();
    expectRgb(probe![property], hex, `${label} ${className}`);
    expect(probe!.brandPurple.toLowerCase(), `${label} ${className} brand`).toBe("#4c1d95");
  }
}

function expectToast(
  probes: Map<string, { color: string; backgroundColor: string; borderTopColor: string }>,
  expected: {
    background: string;
    color?: string;
    border: string;
    success: string;
    successBackground: string;
    warning: string;
    info: string;
  },
  label: string,
) {
  const toast = probes.get("toast");
  const success = probes.get("toast-success");
  const successIcon = probes.get("toast-success-icon");
  const warningIcon = probes.get("toast-warning-icon");
  const infoIcon = probes.get("toast-info-icon");

  expectRgb(toast!.backgroundColor, expected.background, `${label} background`);
  expectRgb(toast!.borderTopColor, expected.border, `${label} border`);
  if (expected.color) {
    expectRgb(toast!.color, expected.color, `${label} ink`);
  }
  expectRgb(success!.backgroundColor, expected.successBackground, `${label} success background`);
  expectRgb(successIcon!.color, expected.success, `${label} success`);
  expectRgb(warningIcon!.color, expected.warning, `${label} warning`);
  expectRgb(infoIcon!.color, expected.info, `${label} info`);
}
