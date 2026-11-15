import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, test } from "vitest";
import { Input, inputVariants } from "@/components/ui/input";
import { Textarea, textareaVariants } from "@/components/ui/textarea";

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

const removedPubPrefix = "--" + "pub-";

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

      expect(minified).toMatch(/\.theme-card\{[^}]*--headline:var\(--ink\)/);
      expect(minified).not.toContain(".pub-card{");
      expect(minified).toMatch(/\.pub-headline\{[^}]*color:var\(--headline\)/);
      expect(minified).toMatch(/\.pub-headline\{[^}]*font-size:var\(--headline-size\)/);
      expect(minified).toMatch(/\.pub-label\{[^}]*font-size:var\(--label-size\)/);
      expect(minified).toMatch(/\.theme-pill\{[^}]*font-size:var\(--pill-size\)/);
      expect(minified).toMatch(/\.theme-btn\{[^}]*font-size:var\(--btn-size\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*background-color:var\(--surface-page\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*background-image:var\(--bg-dots\)/);
      expect(minified).toMatch(/\.pub-page\{[^}]*font-family:var\(--font-body,Arial,Helvetica,sans-serif\)/);
      expect(minified).toMatch(/\.theme-pill\{[^}]*background:var\(--pill-bg\)/);
      expect(minified).toMatch(/\.theme-pill\{[^}]*color:var\(--pill-color\)/);
      expect(minified).toMatch(/\.theme-pill-alt\{[^}]*background:var\(--pill-alt-bg\)/);
      expect(minified).toMatch(/\.theme-field\{[^}]*background:var\(--field-bg\)/);
      expect(minified).not.toContain(".pub-" + "field{");
      expect(minified).toMatch(/\.pub-bank\{[^}]*background:var\(--bank-bg\)/);
      expect(minified).toMatch(/\.theme-btn-primary\{[^}]*color:var\(--on-point\)/);
      expect(minified).not.toContain(removedPubPrefix);

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
        ["shadow-pixel-xs", "2px2px0var(--tw-shadow-color,#111827)"],
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
          ".shadow-xs{--tw-shadow:01px2px0var(--tw-shadow-color,rgb(000/0.05));",
          ".shadow-xs{--tw-shadow:01px2px0var(--tw-shadow-color,#0000000d);",
        ].some((value) => minified.includes(value)),
        "shadow-xs",
      ).toBe(true);
      expect(minified).not.toContain(".shadow-pub{");
      expect(minified).not.toContain("--radius-pub");
      expect(minified).toMatch(/\.theme-card\{[^}]*border:var\(--card-border\)/);
      expect(minified).toMatch(/\.theme-card\{[^}]*border-radius:var\(--card-radius\)/);
      expect(minified).toMatch(/\.theme-card\{[^}]*box-shadow:var\(--card-shadow\)/);
      expect(minified).toMatch(/\.pub-progress\{[^}]*border:var\(--progress-border\)/);
      expect(minified).toMatch(/\.pub-progress\{[^}]*height:var\(--progress-h\)/);
      expect(minified).toMatch(/\.pub-progress\{[^}]*background:var\(--progress-track\)/);
      expect(minified).toMatch(/\.pub-progress>i\{[^}]*background:var\(--progress-fill\)/);
      expect(minified).toMatch(/\.theme-pill\{[^}]*gap:var\(--pill-gap\)/);
      expect(minified).toMatch(/\.theme-pill\{[^}]*padding:var\(--pill-pad\)/);
      expect(minified).toMatch(/\.theme-btn\{[^}]*gap:var\(--btn-gap\)/);
      expect(minified).toMatch(/\.theme-btn\{[^}]*padding:var\(--btn-pad\)/);
      expect(minified).toContain(".bg-ink-deep{background-color:var(--ink-deep)");
      expect(minified).toContain(".text-danger{color:var(--danger)");
      expect(minified).toContain(".bg-danger-tint{background-color:var(--danger-tint)");
      expect(minified).toContain(".bg-kakao{background-color:var(--kakao)");
      expect(minified).toContain("background-color:var(--kakao-hover)");
      expect(minified).toContain(".border-line-strong{border-color:var(--line-strong)");
      expect(minified).toContain(".bg-accent-main{background-color:var(--accent-main)");
      expect(minified).toContain(".text-ink-soft{color:var(--ink-soft)");
      expect(minified).toContain(".text-ink-faint{color:var(--ink-faint)");
      expect(minified).toMatch(
        /\.bg-admin-bg(?:,\.bg-admin-bg\\\/95)?\{background-color:var\(--admin-bg\)/,
      );
      expect(minified).toContain("color-mix(inoklab,var(--admin-bg)95%,transparent)");
      expect(minified).toContain(".bg-admin-subtle{background-color:var(--admin-subtle)");
      expect(minified).toContain(".bg-success{background-color:var(--success)");
      expect(minified).toContain(".bg-success-tint{background-color:var(--success-tint)");
      expect(minified).toContain(".text-success-ink{color:var(--success-ink)");
      expect(minified).toContain(".bg-warn-tint{background-color:var(--warn-tint)");
      expect(minified).toContain(".text-warn-ink{color:var(--warn-ink)");
      expect(minified).toContain(".bg-info{background-color:var(--info)");
      expect(minified).toContain(".bg-info-tint{background-color:var(--info-tint)");
      expect(minified).toContain(".text-info-ink{color:var(--info-ink)");
      expect(minified).toContain(".bg-muted-tint{background-color:var(--muted-tint)");
      expect(minified).toContain(".bg-track{background-color:var(--track)");
      expect(minified).toContain(".bg-addon-bg{background-color:var(--addon-bg)");
      expect(minified).toContain(".bg-placeholder-bg{background-color:var(--placeholder-bg)");
      expect(minified).toContain(".bg-mock-field-bg{background-color:var(--mock-field-bg)");
      expect(minified).toContain(".bg-point{background-color:var(--point)");
      expect(minified).toContain(".border-point{border-color:var(--point)");
      expect(minified).toContain(".bg-blush{background-color:var(--tint-blush)");
      expect(minified).toContain(".bg-yellow{background-color:var(--tint-yellow)");
      expect(minified).toContain(".accent-ink-deep{accent-color:var(--ink-deep)");
      expect(minified).toContain("--confetti-violet:#7c3aed");
      expect(minified).toContain("--confetti-amber:#f59e0b");
      expect(minified).toContain("--confetti-pink:#ec4899");
      expect(minified).not.toContain("--color-confetti");
      expect(minified).not.toContain(".pub-pill{");
      expect(minified).not.toContain(".pub-pill-alt{");
      expect(minified).not.toContain(".pixel-board{");
      expect(minified).not.toContain(".pixel-card{");
      expect(minified).not.toContain(".pub-msg{");
      expect(minified).not.toContain(".pub-msg-title{");
      expect(minified).not.toContain(".pub-btn{");
      expect(minified).not.toContain(".pub-btn-primary{");
      expect(minified).toContain(".w-admin-sidebar{width:220px");
      expect(minified).toContain(".py-admin-sidebar{padding-block:22px");
      expect(minified).not.toContain(".w-\\[220px\\]");
      expect(minified).not.toContain(".py-\\[22px\\]");
      expect(minified).toContain(".shadow-\\[5px_5px_0_var\\(--ink-deep\\)");
      expect(minified).toContain("sm\\:shadow-\\[7px_7px_0_var\\(--ink-deep\\)");
      expect(minified).toContain("var(--ink-deep)");
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
          await expectGuideDialogShadow(page, css, label);
        }
      } finally {
        await browser.close();
      }
    },
    60000,
  );

  test.skipIf(!chromePath)(
    "keeps computed input styles identical to the previous field classes",
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
          const rows = await readInputSnapshots(page, css, inputProbeMarkup());
          expectInputSnapshots(rows, label);
        }
      } finally {
        await browser.close();
      }
    },
    60000,
  );
});

const previousInputClasses = {
  admin:
    "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
  adminTextarea:
    "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
  onboarding:
    "h-11 w-full rounded-md border border-line px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
  onboardingTextarea:
    "w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
  theme: "theme-field h-10 w-full px-3 text-sm font-bold outline-none",
  themeTextarea: "theme-field w-full resize-none px-3 py-2 text-sm font-bold outline-none",
} as const;

const inputStyleKeys = [
  "height",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "color",
  "backgroundColor",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRadius",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
  "boxShadow",
  "opacity",
  "cursor",
  "pointerEvents",
] as const;

function renderedControlClass(
  variant: "admin" | "onboarding" | "theme",
  tag: "input" | "textarea",
) {
  const html =
    tag === "textarea"
      ? renderToStaticMarkup(
          createElement(Textarea, { variant, placeholder: "이름", rows: 3 }),
        )
      : renderToStaticMarkup(
          createElement(Input, { variant, placeholder: "이름", type: "text" }),
        );
  const match = /class="([^"]*)"/.exec(html);

  if (!match) {
    throw new Error(html);
  }

  return match[1];
}

function controlMarkup(
  tag: "input" | "textarea" | "select",
  pair: string,
  className: string,
  side: "legacy" | "next",
  state: "rest" | "focus" | "disabled",
  type = "text",
) {
  const disabled = state === "disabled" ? " disabled" : "";
  const placeholder = tag === "select" ? "" : ' placeholder="이름"';
  const rows = tag === "textarea" ? ' rows="3"' : "";
  const typeAttr = tag === "input" ? ` type="${type}"` : "";
  const body = tag === "select" ? "<option>공개</option>" : "";
  const attrs = ` class="${className}"${typeAttr}${placeholder}${rows}${disabled} data-pair="${pair}" data-state="${state}" data-side="${side}"`;

  if (tag === "input") {
    return `<input${attrs}>`;
  }

  return `<${tag}${attrs}>${body}</${tag}>`;
}

function controlPair(
  tag: "input" | "textarea" | "select",
  pair: string,
  legacyClass: string,
  nextClass: string,
  type = "text",
) {
  return (["rest", "focus", "disabled"] as const)
    .map(
      (state) =>
        controlMarkup(tag, pair, legacyClass, "legacy", state, type) +
        controlMarkup(tag, pair, nextClass, "next", state, type),
    )
    .join("");
}

function inputProbeMarkup() {
  const admin = renderedControlClass("admin", "input");
  const adminTextarea = renderedControlClass("admin", "textarea");
  const onboarding = renderedControlClass("onboarding", "input");
  const onboardingTextarea = renderedControlClass("onboarding", "textarea");
  const theme = renderedControlClass("theme", "input");
  const themeTextarea = renderedControlClass("theme", "textarea");
  const adminSelect = inputVariants({ variant: "admin" });

  expect(admin).toBe(previousInputClasses.admin);
  expect(adminTextarea).toBe(previousInputClasses.adminTextarea);
  expect(onboarding).toBe(previousInputClasses.onboarding);
  expect(onboardingTextarea).toBe(previousInputClasses.onboardingTextarea);
  expect(theme).toBe(previousInputClasses.theme);
  expect(themeTextarea).toBe(previousInputClasses.themeTextarea);
  expect(adminSelect).toBe(previousInputClasses.admin);
  expect(textareaVariants({ variant: "admin" })).toBe(previousInputClasses.adminTextarea);

  const surfaces = [
    ["addon", "bg-addon-bg"],
    ["placeholder", "bg-placeholder-bg"],
    ["mock", "bg-mock-field-bg"],
    ["white", "bg-white"],
    ["zinc-800", "text-zinc-800"],
    ["zinc-400", "text-zinc-400"],
    ["line", "border border-line"],
    ["zinc-border", "border border-zinc-400"],
  ]
    .map(([probe, className]) => `<i class="${className}" data-probe="${probe}"></i>`)
    .join("");

  const fixed = `<div style="width:320px">${surfaces}
    ${controlPair("input", "admin-text", previousInputClasses.admin, admin, "text")}
    ${controlPair("input", "admin-number", previousInputClasses.admin, admin, "number")}
    ${controlPair("input", "admin-url", previousInputClasses.admin, admin, "url")}
    ${controlPair("input", "admin-date", previousInputClasses.admin, admin, "date")}
    ${controlPair("textarea", "admin-textarea", previousInputClasses.adminTextarea, adminTextarea)}
    ${controlPair("select", "admin-select", previousInputClasses.admin, adminSelect)}
    ${controlPair("input", "onboarding-text", previousInputClasses.onboarding, onboarding, "text")}
    ${controlPair("textarea", "onboarding-textarea", previousInputClasses.onboardingTextarea, onboardingTextarea)}
  </div>`;

  const themed = (["pixel_y2k", "mono_bw", "soft_pastel"] as const)
    .map(
      (themeId) => `<section class="pub-page" data-theme="${themeId}" style="width:320px">
        ${controlPair("input", `theme-text-${themeId}`, previousInputClasses.theme, theme, "text")}
        ${controlPair("input", `theme-number-${themeId}`, previousInputClasses.theme, theme, "number")}
        ${controlPair("textarea", `theme-textarea-${themeId}`, previousInputClasses.themeTextarea, themeTextarea)}
      </section>`,
    )
    .join("");

  return fixed + themed;
}

type InputSnapshot = {
  pair: string;
  state: string;
  side: string;
  placeholderColor: string;
} & Record<(typeof inputStyleKeys)[number], string>;

async function readInputSnapshots(
  page: {
    goto: (url: string) => Promise<unknown>;
    evaluate: <T, A>(fn: (arg: A) => T, arg: A) => Promise<T>;
  },
  css: string,
  body: string,
) {
  const html = `<!doctype html><html style="--font-mona:cursive;--font-sans:serif"><head><style>${css}</style></head><body>${body}</body></html>`;
  const dir = mkdtempSync(join(tmpdir(), "input-styles-"));
  const file = join(dir, "index.html");
  writeFileSync(file, html);
  await page.goto(`file://${file}`);

  return page.evaluate((keys) => {
    const rows: InputSnapshot[] = [];

    for (const element of document.querySelectorAll<HTMLElement>("[data-side]")) {
      if (element.dataset.state === "focus") {
        element.focus();
      }

      const style = getComputedStyle(element);
      const placeholder = getComputedStyle(element, "::placeholder");
      const row = {
        pair: element.dataset.pair ?? "",
        state: element.dataset.state ?? "",
        side: element.dataset.side ?? "",
        placeholderColor: placeholder.color,
      } as InputSnapshot;

      for (const key of keys) {
        row[key] = style[key as keyof CSSStyleDeclaration] as string;
      }

      rows.push(row);

      if (document.activeElement === element) {
        (element as HTMLElement).blur();
      }
    }

    const probes = [...document.querySelectorAll<HTMLElement>("[data-probe]")].map((element) => {
      const style = getComputedStyle(element);
      return {
        probe: element.dataset.probe ?? "",
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderTopColor: style.borderTopColor,
      };
    });

    return { rows, probes };
  }, inputStyleKeys);
}

function styleOf(row: InputSnapshot) {
  return {
    placeholderColor: row.placeholderColor,
    ...Object.fromEntries(inputStyleKeys.map((key) => [key, row[key]])),
  };
}

function expectInputSnapshots(
  result: {
    rows: InputSnapshot[];
    probes: { probe: string; backgroundColor: string; color: string; borderTopColor: string }[];
  },
  label: string,
) {
  const byKey = new Map(result.rows.map((row) => [`${row.pair}|${row.state}|${row.side}`, row]));
  const pairs = [...new Set(result.rows.map((row) => `${row.pair}|${row.state}`))];

  expect(pairs.length).toBeGreaterThan(0);

  for (const pair of pairs) {
    const legacy = byKey.get(`${pair}|legacy`);
    const next = byKey.get(`${pair}|next`);
    expect(legacy, pair).toBeTruthy();
    expect(next, pair).toBeTruthy();
    expect(styleOf(next!), `${label} ${pair}`).toEqual(styleOf(legacy!));
  }

  const admin = byKey.get("admin-text|rest|next")!;
  expect(admin.height).toBe("40px");
  expect(admin.paddingLeft).toBe("12px");
  expect(admin.paddingRight).toBe("12px");
  expect(admin.fontSize).toBe("14px");
  expect(admin.fontWeight).toBe("400");
  expect(admin.borderTopWidth).toBe("1px");
  expect(admin.borderTopStyle).toBe("solid");
  expect(admin.borderRadius).toBe("8px");
  const probeColor = (name: string) =>
    result.probes.find((probe) => probe.probe === name);
  expect(admin.opacity).toBe("1");
  expect(admin.boxShadow).toBe("none");
  expect(admin.outlineStyle).toBe("none");
  expect(admin.backgroundColor).toBe(probeColor("white")!.backgroundColor);
  expect(admin.color).toBe(probeColor("zinc-800")!.color);
  expect(admin.borderTopColor).toBe(probeColor("line")!.borderTopColor);
  expect(admin.placeholderColor).toBe(probeColor("zinc-400")!.color);

  const focused = byKey.get("admin-text|focus|next")!;
  expect(focused.borderTopColor).toBe(probeColor("zinc-border")!.borderTopColor);
  expect(focused.boxShadow).toBe("none");
  expect(focused.outlineStyle).toBe("none");
  expect(focused.placeholderColor).toBe(probeColor("zinc-400")!.color);

  const disabled = byKey.get("admin-text|disabled|next")!;
  expect(disabled.opacity).toBe("1");
  expect(disabled.boxShadow).toBe("none");
  expect(disabled.backgroundColor).toBe(probeColor("white")!.backgroundColor);
  expect(disabled.color).toBe(probeColor("zinc-800")!.color);

  const onboarding = byKey.get("onboarding-text|rest|next")!;
  expect(onboarding.height).toBe("44px");
  expect(onboarding.paddingLeft).toBe("12px");
  expect(onboarding.fontSize).toBe("14px");
  expect(onboarding.fontWeight).toBe("400");
  expect(onboarding.borderTopWidth).toBe("1px");
  expect(onboarding.borderRadius).toBe("8px");
  expect(onboarding.backgroundColor).toBe(byKey.get("onboarding-text|rest|legacy")!.backgroundColor);

  const textarea = byKey.get("admin-textarea|rest|next")!;
  expect(textarea.paddingTop).toBe("8px");
  expect(textarea.paddingBottom).toBe("8px");
  expect(textarea.paddingLeft).toBe("12px");
  expect(textarea.fontSize).toBe("14px");
  expect(textarea.borderRadius).toBe("8px");
  expect(textarea.backgroundColor).toBe(probeColor("white")!.backgroundColor);
  expect(textarea.placeholderColor).toBe(probeColor("zinc-400")!.color);

  const select = byKey.get("admin-select|rest|next")!;
  expect(select.height).toBe("40px");
  expect(select.fontSize).toBe("14px");
  expect(select.paddingLeft).toBe("12px");
  expect(select.backgroundColor).toBe(probeColor("white")!.backgroundColor);
  expect(select.borderTopColor).toBe(probeColor("line")!.borderTopColor);

  const disabledSelect = byKey.get("admin-select|disabled|next")!;
  expect(disabledSelect.opacity).toBe("1");
  expect(disabledSelect.backgroundColor).toBe(
    byKey.get("admin-select|disabled|legacy")!.backgroundColor,
  );

  for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
    const field = byKey.get(`theme-text-${themeId}|rest|next`)!;
    const border = themeShape[themeId].fieldBorder.match(/^([\d.]+)px solid (#[0-9a-fA-F]{6})$/);
    expect(border, themeId).not.toBeNull();
    expect(field.height).toBe("40px");
    expect(field.fontSize).toBe("14px");
    expect(field.fontWeight).toBe("700");
    expect(field.paddingLeft).toBe("12px");
    expect(field.boxShadow).toBe("none");
    expect(field.outlineStyle).toBe("none");
    expect(field.borderTopStyle).toBe("solid");
    expect(field.borderTopWidth).toBe(
      byKey.get(`theme-text-${themeId}|rest|legacy`)!.borderTopWidth,
    );
    expectPx(field.borderRadius, themeShape[themeId].fieldRadius, `${label} ${themeId} radius`);
    expectRgb(field.borderTopColor, border![2], `${label} ${themeId} border`);
    expectRgb(field.backgroundColor, themeRole[themeId].fieldBg, `${label} ${themeId} bg`);

    const focusedField = byKey.get(`theme-text-${themeId}|focus|next`)!;
    expect(focusedField.boxShadow).toBe("none");
    expect(focusedField.outlineStyle).toBe("none");
    expectRgb(focusedField.borderTopColor, border![2], `${label} ${themeId} focus border`);

    const themeTextarea = byKey.get(`theme-textarea-${themeId}|rest|next`)!;
    expect(themeTextarea.paddingTop).toBe("8px");
    expect(themeTextarea.fontWeight).toBe("700");
    expectRgb(themeTextarea.backgroundColor, themeRole[themeId].fieldBg, `${label} ${themeId} textarea bg`);
  }

  expectRgb(
    result.probes.find((probe) => probe.probe === "addon")!.backgroundColor,
    "#f9fafb",
    `${label} addon bg`,
  );
  expectRgb(
    result.probes.find((probe) => probe.probe === "placeholder")!.backgroundColor,
    "#f4f4f3",
    `${label} placeholder bg`,
  );
  expectRgb(
    result.probes.find((probe) => probe.probe === "mock")!.backgroundColor,
    "#fafafa",
    `${label} mock field bg`,
  );
}

function themeMarkup(themeId?: string) {
  const themeAttribute = themeId ? ` data-theme="${themeId}"` : "";
  const utilities = Object.keys(fixedColors)
    .map((className) => `<i class="${className}" data-probe="${className}"></i>`)
    .join("");

  return `<section class="pub-page"${themeAttribute} data-probe="page">
    <header class="pub-header" data-probe="header">
      <h1 class="pub-headline" data-probe="header-title">제목</h1>
      <div class="theme-card pub-stat" data-probe="stat">
        <span class="text-[var(--headline)]" data-probe="stat-value">1</span>
      </div>
      ${utilities}
    </header>
    <article class="theme-card" data-probe="card">
      <h2 class="text-[var(--headline)]" data-probe="card-title">카드</h2>
      <p class="text-[var(--ink-muted)]" data-probe="muted">설명</p>
      <div class="pub-fallback" data-probe="fallback"></div>
      <button class="theme-btn" data-probe="btn" type="button">버튼</button>
      <button class="theme-btn theme-btn-primary" data-probe="btn-primary" type="button">주요</button>
      <button class="theme-btn theme-btn-accent" data-probe="btn-accent" type="button">강조</button>
      <p class="pub-label" data-probe="label">라벨</p>
      <span class="theme-pill" data-probe="pill">필</span>
      <span class="theme-pill theme-pill-alt" data-probe="pill-alt">대체</span>
      <i class="bg-blush" data-probe="blush"></i>
      <i class="bg-yellow" data-probe="yellow"></i>
      <i class="bg-point" data-probe="point"></i>
      <i class="bg-success" data-probe="success"></i>
      <i class="bg-(--gift-soft-bg) text-(--gift-soft-ink)" data-probe="gift-soft"></i>
      <div class="border-[1.5px] border-(--ink)" data-probe="theme-ink-border"></div>
      <p class="pub-eyebrow" data-probe="eyebrow">눈썹</p>
      <div class="pub-progress" data-probe="progress"><i data-probe="progress-fill"></i></div>
      <div class="theme-field" data-probe="field"></div>
      <div class="pub-bank" data-probe="bank">
        <p class="text-[var(--bank-ink)]" data-probe="bank-ink">계좌</p>
      </div>
      <div class="border-t-2 border-[var(--divider-color)]" data-probe="divider"></div>
    </article>
    <div class="shadow-xs" data-probe="shadow-xs"></div>
    <div class="shadow-pixel-xs" data-probe="util-xs"></div>
    <div class="shadow-pixel-sm" data-probe="util-sm"></div>
    <div class="shadow-header-line" data-probe="util-line"></div>
    <div style="box-shadow:2px 2px 0 #111827" data-probe="raw-xs"></div>
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

function guideShadowMarkup() {
  // 이전 클래스 문자열은 계산 box-shadow 비교용이다. 앱 .tsx에는 남지 않는다.
  return `<div class="shadow-[5px_5px_0_var(--ink-deep)] sm:shadow-[7px_7px_0_var(--ink-deep)]" data-probe="guide-next"></div>
    <div class="shadow-[5px_5px_0_#111827] sm:shadow-[7px_7px_0_#111827]" data-probe="guide-main"></div>`;
}

async function expectGuideDialogShadow(
  page: {
    setViewportSize: (size: { width: number; height: number }) => Promise<void>;
    goto: (url: string) => Promise<unknown>;
    evaluate: <T>(fn: () => T) => Promise<T>;
  },
  css: string,
  label: string,
) {
  for (const [width, offset] of [
    [1280, "7px 7px"],
    [390, "5px 5px"],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    const probes = await readProbes(page, css, guideShadowMarkup());
    const next = probes.find((probe) => probe.probe === "guide-next")!.boxShadow;
    const previous = probes.find((probe) => probe.probe === "guide-main")!.boxShadow;

    expect(next, `${label} ${width}px guide shadow`).toBe(previous);
    expect(next, `${label} ${width}px guide offset`).toContain(offset);
    expect(next, `${label} ${width}px ink-deep`).toContain("17, 24, 39");
  }
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
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        columnGap: style.columnGap,
        height: style.height,
        backgroundImage: style.backgroundImage,
        bgDots: style.getPropertyValue("--bg-dots").trim(),
        dotSize: style.getPropertyValue("--dot-size").trim(),
        headerDots: style.getPropertyValue("--header-dots").trim(),
        statAccent: style.getPropertyValue("--stat-accent").trim(),
        msgSub: style.getPropertyValue("--msg-sub").trim(),
      };
    }),
  );
}

function expectRgb(actual: string, hex: string, label: string) {
  expect(normalizeColor(actual), label).toBe(normalizeColor(hexToRgb(hex)));
}

const rootStatusColors = [
  ["bg-success", "backgroundColor", "#10b981"],
  ["bg-success-tint", "backgroundColor", "#ecfdf5"],
  ["text-success-ink", "color", "#047857"],
  ["bg-warn-tint", "backgroundColor", "#fff7ed"],
  ["text-warn-ink", "color", "#9a3412"],
  ["bg-info", "backgroundColor", "#3b82f6"],
  ["bg-info-tint", "backgroundColor", "#eff6ff"],
  ["text-info-ink", "color", "#1d4ed8"],
  ["bg-muted-tint", "backgroundColor", "#f4f4f5"],
  ["bg-track", "backgroundColor", "#f3f4f6"],
  ["bg-blush", "backgroundColor", "#ffe4e6"],
  ["bg-yellow", "backgroundColor", "#fef3c7"],
  ["bg-point", "backgroundColor", "#f97316"],
  ["border-point", "borderTopColor", "#f97316"],
] as const;

function rootStatusMarkup() {
  return rootStatusColors
    .map(([className]) => `<i class="${className}" data-probe="root-${className}"></i>`)
    .join("");
}

function expectRootStatusColors(
  probes: Map<string, { color: string; backgroundColor: string; borderTopColor: string }>,
  label: string,
) {
  for (const [className, property, hex] of rootStatusColors) {
    const probe = probes.get(`root-${className}`);
    expect(probe, className).toBeTruthy();
    expectRgb(probe![property], hex, `${label} root ${className}`);
  }
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
      .join("")}${rootStatusMarkup()}</section>`,
  );
  const byProbe = new Map(probes.map((probe) => [probe.probe, probe]));
  const colors = themeColors.pixel_y2k;

  expectThemeSurface(byProbe, colors, `${label} default`);
  expectBrandUtilities(byProbe, `${label} default`);
  expectTypography(byProbe, "pixel_y2k", `${label} default`);
  expectShape(byProbe, "pixel_y2k", `${label} default`);
  expectRoleTokens(byProbe, "pixel_y2k", `${label} default`);
  for (const [className, [property, hex]] of Object.entries(fixedColors)) {
    const probe = byProbe.get(`root-${className}`);
    expect(probe, className).toBeTruthy();
    expectRgb(probe![property], hex, `${label} root ${className}`);
  }
  expectToast(byProbe, toastColors.default, `${label} default toast`);
  expectRootStatusColors(byProbe, label);
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
  expectRoleTokens(byProbe, themeId, prefix);
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
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  columnGap: string;
};

const themeSpacing = {
  pixel_y2k: ["7px", "10px", "6px", "10px"],
  mono_bw: ["6px", "10px", "6px", "10px"],
  soft_pastel: ["7px", "12px", "7px", "12px"],
} as const;

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
  const sticker = probes.get("sticker");
  const rawXs = probes.get("raw-xs");
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
  const [padTop, padRight, padBottom, padLeft] = themeSpacing[themeId];
  expectPx(pill!.paddingTop, padTop, `${label} pill pad top`);
  expectPx(pill!.paddingRight, padRight, `${label} pill pad right`);
  expectPx(pill!.paddingBottom, padBottom, `${label} pill pad bottom`);
  expectPx(pill!.paddingLeft, padLeft, `${label} pill pad left`);
  expectPx(pill!.columnGap, "6px", `${label} pill gap`);
  expectPx(button!.paddingTop, "15px", `${label} button pad`);
  expectPx(button!.paddingRight, "18px", `${label} button pad inline`);
  expectPx(button!.paddingBottom, "15px", `${label} button pad bottom`);
  expectPx(button!.paddingLeft, "18px", `${label} button pad left`);
  expectPx(button!.columnGap, "8px", `${label} button gap`);
  expectEdge(progress!, expected.progressBorder, `${label} progress border`, probes);
  expectPx(progress!.borderRadius, expected.progressRadius, `${label} progress radius`);
  expectEdge(field!, expected.fieldBorder, `${label} field border`, probes);
  expectPx(field!.borderRadius, expected.fieldRadius, `${label} field radius`);
  expectBox(sticker!.boxShadow, rawXs!.boxShadow, `${label} sticker`);
  expect(probes.get("shadow-xs")!.boxShadow, `${label} shadow-xs`).toBe(
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
  );
  expect(probes.get("util-xs")!.boxShadow, `${label} pixel xs utility`).toContain("2px 2px");
  expect(probes.get("util-sm")!.boxShadow, `${label} pixel sm utility`).toContain("3px");
  expect(probes.get("util-line")!.boxShadow, `${label} header line utility`).not.toBe("none");
}

const themeRole = {
  pixel_y2k: {
    pillBg: "#f97316",
    pillColor: "#ffffff",
    pillAltBg: "#ccfbf1",
    pillAltColor: "#171717",
    fieldBg: "#ffffff",
    bankBg: "#ccfbf1",
    bankInk: "#134e4a",
    progressHeight: "18px",
    progressTrack: "#ffffff",
    progressFill: "#0f766e",
    labelColor: "#0f766e",
    headerSub: "#0f766e",
    divider: "#171717",
    dots: "dots",
    dotSize: "18px",
    statAccent: "#0f766e",
    msgSub: "#9d174d",
  },
  mono_bw: {
    pillBg: "transparent",
    pillColor: "#111111",
    pillAltBg: "#111111",
    pillAltColor: "#ffffff",
    fieldBg: "#ffffff",
    bankBg: "#f6f6f6",
    bankInk: "#333333",
    progressHeight: "12px",
    progressTrack: "#ededed",
    progressFill: "#111111",
    labelColor: "#9a9a9a",
    headerSub: "rgba(255, 255, 255, 0.6)",
    divider: "#111111",
    dots: "none",
    dotSize: "0",
    statAccent: "#fff",
    msgSub: "#6b6b6b",
  },
  soft_pastel: {
    pillBg: "#ffe1ec",
    pillColor: "#bd6595",
    pillAltBg: "#dff1ec",
    pillAltColor: "#3f7a6e",
    fieldBg: "#fffafc",
    bankBg: "#dff1ec",
    bankInk: "#3f7a6e",
    progressHeight: "10px",
    progressTrack: "#f1eaf6",
    progressFill: "#7fb8ab",
    labelColor: "#bd6595",
    headerSub: "#7fb8ab",
    divider: "#f0dfe9",
    dots: "none",
    dotSize: "0",
    statAccent: "#7fb8ab",
    msgSub: "#c77ba0",
  },
} as const;

type RoleProbe = {
  color: string;
  backgroundColor: string;
  borderTopColor: string;
  height: string;
  backgroundImage: string;
  bgDots: string;
  dotSize: string;
  headerDots: string;
  statAccent: string;
  msgSub: string;
};

function expectPaint(actual: string, expected: string, label: string) {
  if (expected === "transparent") {
    expect(normalizeColor(actual), label).toBe("rgba(0,0,0,0)");
    return;
  }

  if (expected.startsWith("rgba") || expected.startsWith("rgb")) {
    expect(normalizeColor(actual), label).toBe(normalizeColor(expected));
    return;
  }

  expectRgb(actual, expected, label);
}

function expectDots(actual: string, kind: "dots" | "none", label: string) {
  const compact = actual.replace(/\s+/g, "").toLowerCase();

  if (kind === "none") {
    expect(compact, label).toBe("none");
    return;
  }

  expect(
    [
      "radial-gradient(rgba(23,23,23,0.1)1.4px,transparent1.4px)",
      "radial-gradient(#1717171a1.4px,transparent1.4px)",
      "radial-gradient(rgba(23,23,23,0.1)1.4px,rgba(0,0,0,0)1.4px)",
      "radial-gradient(#1717171a1.4px,rgba(0,0,0,0)1.4px)",
    ],
    `${label}: ${actual}`,
  ).toContain(compact);
}

function expectRoleTokens(
  probes: Map<string, RoleProbe>,
  themeId: keyof typeof themeRole,
  label: string,
) {
  const expected = themeRole[themeId];
  const page = probes.get("page");
  const header = probes.get("header");
  const pill = probes.get("pill");
  const pillAlt = probes.get("pill-alt");
  const field = probes.get("field");
  const bank = probes.get("bank");
  const bankInk = probes.get("bank-ink");
  const progress = probes.get("progress");
  const progressFill = probes.get("progress-fill");
  const labelProbe = probes.get("label");
  const eyebrow = probes.get("eyebrow");
  const divider = probes.get("divider");

  expectPaint(pill!.backgroundColor, expected.pillBg, `${label} pill bg`);
  expectPaint(pill!.color, expected.pillColor, `${label} pill color`);
  expectPaint(pillAlt!.backgroundColor, expected.pillAltBg, `${label} pill alt bg`);
  expectPaint(pillAlt!.color, expected.pillAltColor, `${label} pill alt color`);
  expectPaint(
    probes.get("blush")!.backgroundColor,
    themeColors[themeId].tintBlush,
    `${label} blush`,
  );
  expectPaint(probes.get("yellow")!.backgroundColor, "#fef3c7", `${label} yellow`);
  expectPaint(probes.get("point")!.backgroundColor, themeColors[themeId].point, `${label} point`);
  expectPaint(probes.get("success")!.backgroundColor, "#10b981", `${label} success`);
  expectPaint(
    probes.get("theme-ink-border")!.borderTopColor,
    themeColors[themeId].ink,
    `${label} theme ink border`,
  );
  if (themeId === "soft_pastel") {
    expectPaint(probes.get("gift-soft")!.backgroundColor, "#ffe1ec", `${label} gift soft bg`);
    expectPaint(probes.get("gift-soft")!.color, "#bd6595", `${label} gift soft ink`);
  } else {
    expectPaint(probes.get("gift-soft")!.backgroundColor, "transparent", `${label} gift soft bg`);
    expectPaint(probes.get("gift-soft")!.color, themeColors[themeId].ink, `${label} gift soft ink`);
  }
  expectPaint(field!.backgroundColor, expected.fieldBg, `${label} field bg`);
  expectPaint(bank!.backgroundColor, expected.bankBg, `${label} bank bg`);
  expectPaint(bankInk!.color, expected.bankInk, `${label} bank ink`);
  expectPx(progress!.height, expected.progressHeight, `${label} progress height`);
  expectPaint(progress!.backgroundColor, expected.progressTrack, `${label} progress track`);
  expectPaint(progressFill!.backgroundColor, expected.progressFill, `${label} progress fill`);
  expectPaint(labelProbe!.color, expected.labelColor, `${label} label color`);
  expectPaint(eyebrow!.color, expected.headerSub, `${label} header sub`);
  expectPaint(divider!.borderTopColor, expected.divider, `${label} divider`);
  expectDots(page!.bgDots, expected.dots, `${label} bg dots`);
  expectDots(page!.backgroundImage, expected.dots, `${label} page image`);
  expect(page!.dotSize, `${label} dot size`).toBe(expected.dotSize);
  expectDots(header!.headerDots, expected.dots, `${label} header dots`);
  expectDots(header!.backgroundImage, expected.dots, `${label} header image`);
  expect(page!.statAccent.replace(/\s+/g, "").toLowerCase(), `${label} stat accent`).toBe(
    expected.statAccent.replace(/\s+/g, "").toLowerCase(),
  );
  expect(page!.msgSub.replace(/\s+/g, "").toLowerCase(), `${label} message sub`).toBe(
    expected.msgSub.replace(/\s+/g, "").toLowerCase(),
  );
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
