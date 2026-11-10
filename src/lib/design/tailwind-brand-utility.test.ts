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

const fixedFontSizes = [
  ["text-micro", "font-size:10px"],
  ["text-caption", "font-size:11px"],
  ["text-tab", "font-size:13px"],
  ["text-nav", "font-size:13.5px"],
] as const;

const defaultFontScale = [
  ["text-xs", "font-size:var(--text-xs)", "line-height:var(--tw-leading,var(--text-xs--line-height))"],
  ["text-sm", "font-size:var(--text-sm)", "line-height:var(--tw-leading,var(--text-sm--line-height))"],
  ["text-base", "font-size:var(--text-base)", "line-height:var(--tw-leading,var(--text-base--line-height))"],
  ["text-6xl", "font-size:var(--text-6xl)", "line-height:var(--tw-leading,var(--text-6xl--line-height))"],
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
      expect(minified).toMatch(/\.pub-headline\{[^}]*font-size:var\(--headline-size\)/);
      expect(minified).toMatch(/\.pub-label\{[^}]*font-size:var\(--label-size\)/);
      expect(minified).toMatch(/\.pub-pill\{[^}]*font-size:var\(--pill-size\)/);
      expect(minified).toMatch(/\.pub-btn\{[^}]*font-size:var\(--btn-size\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*background-color:var\(--surface-page\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*font-family:var\(--font-body,Arial,Helvetica,sans-serif\)/);
      expect(minified).not.toMatch(removedPubAliasPattern);
      expect(minified).not.toMatch(/var\(--pub-headline-(?:font|weight|size|lh|ls)\)/);
      expect(minified).not.toMatch(/var\(--pub-btn-(?:font|weight|size)\)/);

      for (const [className, declaration] of fixedFontSizes) {
        expect(minified, className).toMatch(
          new RegExp(`\\.${className}\\{${escapeRegExp(declaration)};?\\}`),
        );
      }

      for (const [className, fontSize, lineHeight] of defaultFontScale) {
        expect(minified, className).toContain(`.${className}{${fontSize};${lineHeight}`);
      }

      expect(minified).not.toContain(".text-\\[10px\\]");
      expect(minified).not.toContain(".text-\\[11px\\]");
      expect(minified).not.toContain(".text-\\[13px\\]");
      expect(minified).not.toContain(".text-\\[13\\.5px\\]");
      expect(minified).not.toContain(".text-\\[14px\\]");
      expect(minified).not.toContain(".text-\\[16px\\]");
      expect(minified).toContain(".text-\\[0\\.8rem\\]{font-size:");
      expect(minified).toContain("letter-spacing:1.6px");

      for (const [className, shadow] of [
        ["shadow-pixel-sm", "3px3px0var(--tw-shadow-color,#111827)"],
        ["shadow-pixel-md", "4px4px0var(--tw-shadow-color,#111827)"],
        ["shadow-pixel-lg", "6px6px0var(--tw-shadow-color,#111827)"],
        ["shadow-pixel-xl", "8px8px0var(--tw-shadow-color,#111827)"],
      ] as const) {
        expect(minified, className).toContain(
          `.${className}{--tw-shadow:${shadow};box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)`,
        );
      }

      const headerLine = [
        "01px0var(--tw-shadow-color,rgba(24,24,27,0.02))",
        "01px0var(--tw-shadow-color,#18181b05)",
      ].find((shadow) =>
        minified.includes(
          `.shadow-header-line{--tw-shadow:${shadow};box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)`,
        ),
      );

      expect(headerLine, "shadow-header-line").toBeTruthy();

      expect(
        [
          ".shadow-md{--tw-shadow:04px6px-1pxvar(--tw-shadow-color,rgb(000/0.1)),02px4px-2pxvar(--tw-shadow-color,rgb(000/0.1));",
          ".shadow-md{--tw-shadow:04px6px-1pxvar(--tw-shadow-color,#0000001a),02px4px-2pxvar(--tw-shadow-color,#0000001a);",
        ].some((value) => minified.includes(value)),
        "shadow-md",
      ).toBe(true);
      expect(
        [
          ".shadow-pub{--tw-shadow:01px2pxvar(--tw-shadow-color,rgba(0,0,0,0.05));",
          ".shadow-pub{--tw-shadow:01px2pxvar(--tw-shadow-color,#0000000d);",
        ].some((value) => minified.includes(value)),
        "shadow-pub",
      ).toBe(true);
      expect(minified).toMatch(/\.pub-card\{[^}]*border:var\(--card-border\)/);
      expect(minified).toMatch(/\.pub-card\{[^}]*border-radius:var\(--card-radius\)/);
      expect(minified).toMatch(/\.pub-card\{[^}]*box-shadow:var\(--card-shadow\)/);
      expect(minified).toMatch(/\.pub-progress\{[^}]*border:var\(--progress-border\)/);
      expect(minified).toMatch(/\.pub-progress\{[^}]*height:var\(--pub-progress-h\)/);
      expect(minified).toContain(".shadow-\\[5px_5px_0");
      expect(minified).toContain("shadow-\\[7px_7px_0");
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
      <p class="pub-label" data-probe="label">라벨</p>
      <span class="pub-pill" data-probe="pill">필</span>
      <p class="pub-eyebrow" data-probe="eyebrow">눈썹</p>
      <div class="pub-progress" data-probe="progress"><i data-probe="progress-fill"></i></div>
      <div class="pub-field" data-probe="field"></div>
    </article>
    <div class="pixel-card" data-probe="pixel-card"></div>
    <div class="pixel-board" data-probe="pixel-board"></div>
    <div class="shadow-pixel-sm" data-probe="util-sm"></div>
    <div class="shadow-header-line" data-probe="util-line"></div>
    <div style="box-shadow:3px 3px 0 #111827" data-probe="raw-sm"></div>
    <div style="border:2px solid #171717" data-probe="raw-border-2"></div>
    <div style="border:1.5px solid #111" data-probe="raw-border-15"></div>
    <div style="border:1.5px solid #f0dfe9" data-probe="raw-border-pastel"></div>
    <p class="font-pixel" data-probe="pixel">픽셀</p>
    <p class="sticker-label" data-probe="sticker">스티커</p>
    <p class="text-micro" data-probe="micro">m</p>
    <p class="text-caption" data-probe="caption">c</p>
    <p class="text-tab" data-probe="tab">t</p>
    <p class="text-nav" data-probe="nav">n</p>
    <p class="text-sm" data-probe="text-sm">s</p>
    <p class="text-base" data-probe="text-base">b</p>
    <p style="font-size:10px" data-probe="px-10">10</p>
    <p style="font-size:14px" data-probe="px-14">14</p>
    <p style="font-size:16px" data-probe="px-16">16</p>
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
  const html = `<!doctype html><html style="--font-mona:cursive;--font-sans:serif"><head><style>${css}</style></head><body>${body}</body></html>`;
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
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        borderTopWidth: style.borderTopWidth,
        borderTopStyle: style.borderTopStyle,
        borderBottomWidth: style.borderBottomWidth,
        borderBottomStyle: style.borderBottomStyle,
        borderBottomColor: style.borderBottomColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
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
  expectTypography(byProbe, "pixel_y2k", `${label} default`);
  expectShape(byProbe, "pixel_y2k", `${label} default`);
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
  expectTypography(byProbe, themeId, prefix);
  expectShape(byProbe, themeId, prefix);
  expectToast(byProbe, toastColors[themeId], `${prefix} toast`);
}

const themeType = {
  pixel_y2k: {
    headlineSize: "36px",
    headlineWeight: "700",
    headlineLineHeight: "50.4px",
    headlineTracking: "0px",
    roleFamily: "cursive",
    labelTracking: "0px",
    labelTransform: "none",
    pillTransform: "none",
    buttonSize: "15px",
  },
  mono_bw: {
    headlineSize: "30px",
    headlineWeight: "900",
    headlineLineHeight: "35.4px",
    headlineTracking: "-1px",
    roleFamily: "serif",
    labelTracking: "1.6px",
    labelTransform: "uppercase",
    pillTransform: "uppercase",
    buttonSize: "14px",
  },
  soft_pastel: {
    headlineSize: "30px",
    headlineWeight: "800",
    headlineLineHeight: "39px",
    headlineTracking: "-0.4px",
    roleFamily: "serif",
    labelTracking: "0.4px",
    labelTransform: "none",
    pillTransform: "none",
    buttonSize: "15px",
  },
} as const;

type TypeProbe = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
};

function expectPx(actual: string, expected: string, label: string) {
  const measured = Number.parseFloat(actual);
  const target = Number.parseFloat(expected);

  expect(Number.isFinite(measured), `${label} ${actual}`).toBe(true);
  expect(Math.abs(measured - target), `${label} ${actual} vs ${expected}`).toBeLessThan(0.05);
}

function expectTracking(actual: string, expected: string, label: string) {
  if (expected === "0px" && (actual === "0px" || actual === "normal")) {
    return;
  }

  expectPx(actual, expected, label);
}

function expectFamily(actual: string, expected: string, label: string) {
  expect(actual.replace(/["']/g, "").replace(/\s+/g, "").toLowerCase(), label).toBe(
    expected.replace(/\s+/g, "").toLowerCase(),
  );
}

function expectTypography(
  probes: Map<string, TypeProbe>,
  themeId: keyof typeof themeType,
  label: string,
) {
  const expected = themeType[themeId];
  const page = probes.get("page");
  const headline = probes.get("header-title");
  const labelProbe = probes.get("label");
  const pill = probes.get("pill");
  const eyebrow = probes.get("eyebrow");
  const button = probes.get("btn");
  const pixel = probes.get("pixel");
  const sticker = probes.get("sticker");
  const micro = probes.get("micro");
  const caption = probes.get("caption");
  const tab = probes.get("tab");
  const nav = probes.get("nav");
  const small = probes.get("text-sm");
  const base = probes.get("text-base");
  const px10 = probes.get("px-10");
  const px14 = probes.get("px-14");
  const px16 = probes.get("px-16");

  expectFamily(page!.fontFamily, "serif", `${label} page family`);
  expectFamily(headline!.fontFamily, expected.roleFamily, `${label} headline family`);
  expectPx(headline!.fontSize, expected.headlineSize, `${label} headline size`);
  expect(headline!.fontWeight, `${label} headline weight`).toBe(expected.headlineWeight);
  expectPx(headline!.lineHeight, expected.headlineLineHeight, `${label} headline line-height`);
  expectTracking(headline!.letterSpacing, expected.headlineTracking, `${label} headline tracking`);

  expectFamily(labelProbe!.fontFamily, expected.roleFamily, `${label} label family`);
  expectPx(labelProbe!.fontSize, "12px", `${label} label size`);
  expect(labelProbe!.fontWeight, `${label} label weight`).toBe("700");
  expectTracking(labelProbe!.letterSpacing, expected.labelTracking, `${label} label tracking`);
  expect(labelProbe!.textTransform, `${label} label transform`).toBe(expected.labelTransform);

  expectFamily(pill!.fontFamily, expected.roleFamily, `${label} pill family`);
  expectPx(pill!.fontSize, "12px", `${label} pill size`);
  expect(pill!.fontWeight, `${label} pill weight`).toBe("700");
  expectPx(pill!.lineHeight, "12px", `${label} pill line-height`);
  expect(pill!.textTransform, `${label} pill transform`).toBe(expected.pillTransform);

  expectFamily(eyebrow!.fontFamily, expected.roleFamily, `${label} eyebrow family`);
  expectPx(eyebrow!.fontSize, "12px", `${label} eyebrow size`);
  expect(eyebrow!.textTransform, `${label} eyebrow transform`).toBe("uppercase");

  expectFamily(button!.fontFamily, expected.roleFamily, `${label} button family`);
  expectPx(button!.fontSize, expected.buttonSize, `${label} button size`);
  expect(button!.fontWeight, `${label} button weight`).toBe("700");
  expectPx(button!.lineHeight, expected.buttonSize, `${label} button line-height`);

  expectFamily(pixel!.fontFamily, "cursive, Arial, Helvetica, sans-serif", `${label} pixel family`);
  expect(pixel!.fontWeight, `${label} pixel weight`).toBe("700");
  expectFamily(
    sticker!.fontFamily,
    "cursive, Arial, Helvetica, sans-serif",
    `${label} sticker family`,
  );
  expectPx(sticker!.fontSize, "12px", `${label} sticker size`);
  expect(sticker!.fontWeight, `${label} sticker weight`).toBe("900");

  expectPx(micro!.fontSize, "10px", `${label} micro`);
  expectPx(caption!.fontSize, "11px", `${label} caption`);
  expectPx(tab!.fontSize, "13px", `${label} tab`);
  expectPx(nav!.fontSize, "13.5px", `${label} nav`);
  expectPx(micro!.lineHeight, px10!.lineHeight, `${label} micro line-height`);
  expectPx(base!.fontSize, px16!.fontSize, `${label} text-base size`);
  expectPx(base!.lineHeight, px16!.lineHeight, `${label} text-base line-height`);
  expectPx(small!.fontSize, px14!.fontSize, `${label} text-sm size`);
  expect(small!.lineHeight, `${label} text-sm keeps its own line-height`).not.toBe(px14!.lineHeight);
}

const themeShape = {
  pixel_y2k: {
    cardBorder: "2px solid #171717",
    cardRadius: "4px",
    cardShadow: "rgb(17, 24, 39) 6px 6px 0px 0px",
    headerBorder: "2px solid #171717",
    pillBorder: "2px solid #171717",
    pillRadius: "0px",
    pillShadow: "rgb(17, 24, 39) 3px 3px 0px 0px",
    buttonBorder: "2px solid #171717",
    buttonRadius: "4px",
    buttonShadow: "rgb(17, 24, 39) 3px 3px 0px 0px",
    progressBorder: "2px solid #171717",
    progressRadius: "2px",
    fieldBorder: "2px solid #171717",
    fieldRadius: "4px",
  },
  mono_bw: {
    cardBorder: "1.5px solid #111111",
    cardRadius: "0px",
    cardShadow: "none",
    headerBorder: "1.5px solid #111111",
    pillBorder: "1.5px solid #111111",
    pillRadius: "0px",
    pillShadow: "none",
    buttonBorder: "1.5px solid #111111",
    buttonRadius: "0px",
    buttonShadow: "none",
    progressBorder: "1.5px solid #111111",
    progressRadius: "0px",
    fieldBorder: "1.5px solid #111111",
    fieldRadius: "0px",
  },
  soft_pastel: {
    cardBorder: "none",
    cardRadius: "22px",
    cardShadow: "rgba(150, 120, 160, 0.16) 0px 10px 28px 0px",
    headerBorder: "none",
    pillBorder: "none",
    pillRadius: "999px",
    pillShadow: "none",
    buttonBorder: "none",
    buttonRadius: "16px",
    buttonShadow: "rgba(150, 120, 160, 0.2) 0px 6px 16px 0px",
    progressBorder: "none",
    progressRadius: "999px",
    fieldBorder: "1.5px solid #f0dfe9",
    fieldRadius: "14px",
  },
} as const;

type ShapeProbe = {
  borderTopWidth: string;
  borderTopStyle: string;
  borderTopColor: string;
  borderBottomWidth: string;
  borderBottomStyle: string;
  borderBottomColor: string;
  borderRadius: string;
  boxShadow: string;
};

function expectBox(actual: string, expected: string, label: string) {
  const normalize = (value: string) =>
    value.replace(/\s+/g, "").replace(/rgba\((\d+),(\d+),(\d+),1\)/, "rgb($1,$2,$3)");

  expect(normalize(actual), label).toBe(normalize(expected));
}

function expectEdge(
  probe: ShapeProbe,
  expected: string,
  label: string,
  references: Map<string, ShapeProbe>,
  side: "top" | "bottom" = "top",
) {
  const width = side === "top" ? probe.borderTopWidth : probe.borderBottomWidth;
  const styleName = side === "top" ? probe.borderTopStyle : probe.borderBottomStyle;
  const color = side === "top" ? probe.borderTopColor : probe.borderBottomColor;

  if (expected === "none") {
    expect(styleName, label).toBe("none");
    return;
  }

  const match = expected.match(/^([\d.]+)px solid (#[0-9a-fA-F]{6})$/);
  expect(match, `${label} ${expected}`).not.toBeNull();
  const referenceName =
    match![1] === "1.5"
      ? match![2].toLowerCase() === "#f0dfe9"
        ? "raw-border-pastel"
        : "raw-border-15"
      : match![1] === "2"
        ? "raw-border-2"
        : "";
  const reference = referenceName ? references.get(referenceName) : undefined;

  expect(width, `${label} width`).toBe(reference ? reference.borderTopWidth : `${match![1]}px`);
  expect(styleName, label).toBe("solid");
  expectRgb(color, match![2], `${label} color`);
}

function expectShape(
  probes: Map<string, ShapeProbe>,
  themeId: keyof typeof themeShape,
  label: string,
) {
  const expected = themeShape[themeId];
  const card = probes.get("card");
  const header = probes.get("header");
  const pill = probes.get("pill");
  const button = probes.get("btn");
  const progress = probes.get("progress");
  const field = probes.get("field");
  const pixelCard = probes.get("pixel-card");
  const pixelBoard = probes.get("pixel-board");
  const sticker = probes.get("sticker");
  const rawSm = probes.get("raw-sm");
  const primary = probes.get("btn-primary");

  expectEdge(card!, expected.cardBorder, `${label} card border`, probes);
  expectPx(card!.borderRadius, expected.cardRadius, `${label} card radius`);
  expectBox(card!.boxShadow, expected.cardShadow, `${label} card shadow`);
  expectEdge(header!, expected.headerBorder, `${label} header border`, probes, "bottom");
  expectEdge(pill!, expected.pillBorder, `${label} pill border`, probes);
  expectPx(pill!.borderRadius, expected.pillRadius, `${label} pill radius`);
  expectBox(pill!.boxShadow, expected.pillShadow, `${label} pill shadow`);
  if (themeId === "soft_pastel") {
    expectEdge(button!, "1.5px solid #f0dfe9", `${label} plain button border`, probes);
    expectBox(button!.boxShadow, "none", `${label} plain button shadow`);
    expectEdge(primary!, "none", `${label} primary border`, probes);
    expectBox(primary!.boxShadow, expected.buttonShadow, `${label} primary shadow`);
  } else {
    expectEdge(button!, expected.buttonBorder, `${label} button border`, probes);
    expectBox(button!.boxShadow, expected.buttonShadow, `${label} button shadow`);
  }
  expectPx(button!.borderRadius, expected.buttonRadius, `${label} button radius`);
  expectEdge(progress!, expected.progressBorder, `${label} progress border`, probes);
  expectPx(progress!.borderRadius, expected.progressRadius, `${label} progress radius`);
  expectEdge(field!, expected.fieldBorder, `${label} field border`, probes);
  expectPx(field!.borderRadius, expected.fieldRadius, `${label} field radius`);
  expectBox(pixelCard!.boxShadow, "rgb(17, 24, 39) 6px 6px 0px 0px", `${label} pixel card`);
  expectBox(pixelBoard!.boxShadow, "rgb(17, 24, 39) 8px 8px 0px 0px", `${label} pixel board`);
  expectBox(sticker!.boxShadow, rawSm!.boxShadow, `${label} sticker`);
  expect(probes.get("util-sm")!.boxShadow, `${label} pixel sm utility`).toContain("3px");
  expect(probes.get("util-line")!.boxShadow, `${label} header line utility`).not.toBe("none");
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
