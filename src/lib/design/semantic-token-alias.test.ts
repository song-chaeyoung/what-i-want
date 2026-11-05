import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const globalsCss = readFileSync(join(root, "app/globals.css"), "utf8");
const publicThemesCss = readFileSync(join(root, "app/public-themes.css"), "utf8");

const brandAliases = {
  "--brand-ink": "--ink",
  "--brand-paper": "--surface",
  "--brand-cream": "--surface-page",
  "--brand-yellow": "--tint-yellow",
  "--brand-mint": "--tint-mint",
  "--brand-blush": "--tint-blush",
  "--brand-orange": "--point",
  "--brand-teal": "--accent-main",
  "--brand-purple": "--headline",
  "--brand-line": "--line",
} as const;

const rootSemantics = {
  "--ink": "#171717",
  "--ink-muted": "#3f3f46",
  "--surface": "#fffdf7",
  "--surface-page": "#fff7ed",
  "--surface-header": "#fef3c7",
  "--headline": "#4c1d95",
  "--accent-main": "#0f766e",
  "--point": "#f97316",
  "--line": "#d1d5db",
  "--line-strong": "#171717",
  "--tint-mint": "#ccfbf1",
  "--tint-blush": "#ffe4e6",
  "--tint-yellow": "#fef3c7",
} as const;

const themeBridges = {
  "--color-ink": "--ink",
  "--color-paper": "--surface",
  "--color-line": "--line",
  "--color-teal": "--accent-main",
  "--color-purple": "--headline",
  "--color-mint": "--tint-mint",
  "--color-orange": "--point",
} as const;

const pubAliases = {
  "--pub-bg": "--surface-page",
  "--pub-header-bg": "--surface-header",
  "--pub-surface": "--surface",
  "--pub-ink": "--ink",
  "--pub-sub": "--ink-muted",
  "--pub-headline-color": "--headline",
  "--pub-headline-on-header": "--headline",
  "--pub-accent": "--accent-main",
  "--pub-point": "--point",
  "--pub-fallback-bg": "--tint-mint",
  "--pub-msg-bg": "--tint-blush",
} as const;

/** 별칭 도입 전에 테마 블록에 적혀 있던 --pub-* 리터럴. */
const previousPub = {
  pixel_y2k: {
    "--pub-bg": "#fff7ed",
    "--pub-bg-dots": "radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)",
    "--pub-dot-size": "18px",
    "--pub-header-bg": "#fef3c7",
    "--pub-header-dots": "radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)",
    "--pub-header-border": "2px solid #171717",
    "--pub-surface": "#fffdf7",
    "--pub-ink": "#171717",
    "--pub-sub": "#3f3f46",
    "--pub-headline-color": "#4c1d95",
    "--pub-headline-on-header": "#4c1d95",
    "--pub-headline-font": "var(--font-mona, Arial, Helvetica, sans-serif)",
    "--pub-headline-weight": "700",
    "--pub-headline-size": "36px",
    "--pub-headline-lh": "1.4",
    "--pub-headline-ls": "0",
    "--pub-header-sub": "#0f766e",
    "--pub-label-font": "var(--font-mona, Arial, Helvetica, sans-serif)",
    "--pub-label-color": "#0f766e",
    "--pub-label-ls": "0",
    "--pub-label-transform": "none",
    "--pub-label-weight": "700",
    "--pub-accent": "#0f766e",
    "--pub-stat-accent": "#0f766e",
    "--pub-point": "#f97316",
    "--pub-on-point": "#fff",
    "--pub-border": "2px solid #171717",
    "--pub-divider-color": "#171717",
    "--pub-shadow": "6px 6px 0 #111827",
    "--pub-shadow-lg": "8px 8px 0 #111827",
    "--pub-shadow-sm": "3px 3px 0 #111827",
    "--pub-radius": "4px",
    "--pub-fallback-bg": "#ccfbf1",
    "--pub-pill-bg": "#f97316",
    "--pub-pill-color": "#fff",
    "--pub-pill-alt-bg": "#ccfbf1",
    "--pub-pill-alt-color": "#171717",
    "--pub-pill-border": "2px solid #171717",
    "--pub-pill-radius": "0",
    "--pub-pill-shadow": "3px 3px 0 #111827",
    "--pub-pill-font": "var(--font-mona, Arial, Helvetica, sans-serif)",
    "--pub-pill-weight": "700",
    "--pub-pill-transform": "none",
    "--pub-pill-pad": "7px 10px 6px",
    "--pub-btn-font": "var(--font-mona, Arial, Helvetica, sans-serif)",
    "--pub-btn-weight": "700",
    "--pub-btn-size": "15px",
    "--pub-btn-radius": "4px",
    "--pub-btn-border": "2px solid #171717",
    "--pub-btn-shadow": "3px 3px 0 #111827",
    "--pub-progress-track": "#fff",
    "--pub-progress-border": "2px solid #171717",
    "--pub-progress-radius": "2px",
    "--pub-progress-h": "18px",
    "--pub-progress-fill": "#0f766e",
    "--pub-field-border": "2px solid #171717",
    "--pub-field-radius": "4px",
    "--pub-field-bg": "#fff",
    "--pub-bank-bg": "#ccfbf1",
    "--pub-bank-ink": "#134e4a",
    "--pub-msg-bg": "#ffe4e6",
    "--pub-msg-title": "#171717",
    "--pub-msg-sub": "#9d174d",
  },
  mono_bw: {
    "--pub-bg": "#ffffff",
    "--pub-bg-dots": "none",
    "--pub-dot-size": "0",
    "--pub-header-bg": "#111111",
    "--pub-header-dots": "none",
    "--pub-header-border": "1.5px solid #111",
    "--pub-surface": "#fff",
    "--pub-ink": "#111",
    "--pub-sub": "#6b6b6b",
    "--pub-headline-color": "#fff",
    "--pub-headline-on-header": "#fff",
    "--pub-headline-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-headline-weight": "900",
    "--pub-headline-size": "30px",
    "--pub-headline-lh": "1.18",
    "--pub-headline-ls": "-1px",
    "--pub-header-sub": "rgba(255, 255, 255, 0.6)",
    "--pub-label-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-label-color": "#9a9a9a",
    "--pub-label-ls": "1.6px",
    "--pub-label-transform": "uppercase",
    "--pub-label-weight": "700",
    "--pub-accent": "#111",
    "--pub-stat-accent": "#fff",
    "--pub-point": "#111",
    "--pub-on-point": "#fff",
    "--pub-border": "1.5px solid #111",
    "--pub-divider-color": "#111",
    "--pub-shadow": "none",
    "--pub-shadow-lg": "none",
    "--pub-shadow-sm": "none",
    "--pub-radius": "0",
    "--pub-fallback-bg": "#f3f3f3",
    "--pub-pill-bg": "transparent",
    "--pub-pill-color": "#111",
    "--pub-pill-alt-bg": "#111",
    "--pub-pill-alt-color": "#fff",
    "--pub-pill-border": "1.5px solid #111",
    "--pub-pill-radius": "0",
    "--pub-pill-shadow": "none",
    "--pub-pill-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-pill-weight": "700",
    "--pub-pill-transform": "uppercase",
    "--pub-pill-pad": "6px 10px",
    "--pub-btn-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-btn-weight": "700",
    "--pub-btn-size": "14px",
    "--pub-btn-radius": "0",
    "--pub-btn-border": "1.5px solid #111",
    "--pub-btn-shadow": "none",
    "--pub-progress-track": "#ededed",
    "--pub-progress-border": "1.5px solid #111",
    "--pub-progress-radius": "0",
    "--pub-progress-h": "12px",
    "--pub-progress-fill": "#111",
    "--pub-field-border": "1.5px solid #111",
    "--pub-field-radius": "0",
    "--pub-field-bg": "#fff",
    "--pub-bank-bg": "#f6f6f6",
    "--pub-bank-ink": "#333",
    "--pub-msg-bg": "#fafafa",
    "--pub-msg-title": "#111",
    "--pub-msg-sub": "#6b6b6b",
  },
  soft_pastel: {
    "--pub-bg": "#fbf5ff",
    "--pub-bg-dots": "none",
    "--pub-dot-size": "0",
    "--pub-header-bg": "#ffeaf3",
    "--pub-header-dots": "none",
    "--pub-header-border": "none",
    "--pub-surface": "#ffffff",
    "--pub-ink": "#5b5566",
    "--pub-sub": "#8b8398",
    "--pub-headline-color": "#bd6595",
    "--pub-headline-on-header": "#bd6595",
    "--pub-headline-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-headline-weight": "800",
    "--pub-headline-size": "30px",
    "--pub-headline-lh": "1.3",
    "--pub-headline-ls": "-0.4px",
    "--pub-header-sub": "#7fb8ab",
    "--pub-label-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-label-color": "#bd6595",
    "--pub-label-ls": "0.4px",
    "--pub-label-transform": "none",
    "--pub-label-weight": "700",
    "--pub-accent": "#7fb8ab",
    "--pub-stat-accent": "#7fb8ab",
    "--pub-point": "#f79f97",
    "--pub-on-point": "#fff",
    "--pub-border": "none",
    "--pub-divider-color": "#f0dfe9",
    "--pub-shadow": "0 10px 28px rgba(150, 120, 160, 0.16)",
    "--pub-shadow-lg": "0 14px 32px rgba(150, 120, 160, 0.18)",
    "--pub-shadow-sm": "0 6px 16px rgba(150, 120, 160, 0.2)",
    "--pub-radius": "22px",
    "--pub-fallback-bg": "#fdeef5",
    "--pub-pill-bg": "#ffe1ec",
    "--pub-pill-color": "#bd6595",
    "--pub-pill-alt-bg": "#dff1ec",
    "--pub-pill-alt-color": "#3f7a6e",
    "--pub-pill-border": "none",
    "--pub-pill-radius": "999px",
    "--pub-pill-shadow": "none",
    "--pub-pill-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-pill-weight": "700",
    "--pub-pill-transform": "none",
    "--pub-pill-pad": "7px 12px",
    "--pub-btn-font": "var(--font-sans, Arial, Helvetica, sans-serif)",
    "--pub-btn-weight": "700",
    "--pub-btn-size": "15px",
    "--pub-btn-radius": "16px",
    "--pub-btn-border": "none",
    "--pub-btn-shadow": "0 6px 16px rgba(150, 120, 160, 0.2)",
    "--pub-progress-track": "#f1eaf6",
    "--pub-progress-border": "none",
    "--pub-progress-radius": "999px",
    "--pub-progress-h": "10px",
    "--pub-progress-fill": "#7fb8ab",
    "--pub-field-border": "1.5px solid #f0dfe9",
    "--pub-field-radius": "14px",
    "--pub-field-bg": "#fffafc",
    "--pub-bank-bg": "#dff1ec",
    "--pub-bank-ink": "#3f7a6e",
    "--pub-msg-bg": "#fdeef5",
    "--pub-msg-title": "#bd6595",
    "--pub-msg-sub": "#c77ba0",
  },
} as const;

const previousBrand = {
  "--brand-ink": "#171717",
  "--brand-paper": "#fffdf7",
  "--brand-cream": "#fff7ed",
  "--brand-yellow": "#fef3c7",
  "--brand-mint": "#ccfbf1",
  "--brand-blush": "#ffe4e6",
  "--brand-orange": "#f97316",
  "--brand-teal": "#0f766e",
  "--brand-purple": "#4c1d95",
  "--brand-line": "#d1d5db",
} as const;

function extractBlock(source: string, pattern: RegExp) {
  const match = pattern.exec(source);

  if (!match || match.index === undefined) {
    throw new Error(`CSS block not found: ${pattern}`);
  }

  const start = source.indexOf("{", match.index);
  let depth = 0;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start + 1, index);
      }
    }
  }

  throw new Error(`Unclosed CSS block: ${pattern}`);
}

function parseVars(block: string) {
  const vars = new Map<string, string>();

  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim());
  }

  return vars;
}

function resolveVar(name: string, vars: Map<string, string>, seen = new Set<string>()): string {
  const value = vars.get(name);

  if (value === undefined) {
    throw new Error(`Missing custom property ${name}`);
  }

  const alias = value.match(/^var\((--[\w-]+)\)$/);

  if (!alias) {
    return value;
  }

  if (seen.has(name)) {
    throw new Error(`Cycle at ${name}`);
  }

  seen.add(name);
  return resolveVar(alias[1], vars, seen);
}

function mergedVars(layers: Map<string, string>[]) {
  const vars = new Map<string, string>();

  for (const layer of layers) {
    for (const [name, value] of layer) {
      vars.set(name, value);
    }
  }

  return vars;
}

const rootVars = parseVars(extractBlock(globalsCss, /:root\s*\{/));
const themeBridgeVars = parseVars(extractBlock(globalsCss, /@theme inline\s*\{/));
const themeBlocks = {
  pixel_y2k: parseVars(
    extractBlock(publicThemesCss, /\.pub-page,\s*\.pub-page\[data-theme="pixel_y2k"\]\s*\{/),
  ),
  mono_bw: parseVars(
    extractBlock(publicThemesCss, /\.pub-page\[data-theme="mono_bw"\]\s*\{/),
  ),
  soft_pastel: parseVars(
    extractBlock(publicThemesCss, /\.pub-page\[data-theme="soft_pastel"\]\s*\{/),
  ),
} as const;
const pubPageGuard = parseVars(
  extractBlock(publicThemesCss, /\.pub-page \{\s*--brand-ink:/),
);

describe("semantic token aliases", () => {
  test("keeps :root semantics as the brand source of truth", () => {
    for (const [name, literal] of Object.entries(rootSemantics)) {
      expect(rootVars.get(name), name).toBe(literal);
    }

    for (const [brand, semantic] of Object.entries(brandAliases)) {
      expect(rootVars.get(brand), brand).toBe(`var(${semantic})`);
      expect(resolveVar(brand, rootVars), brand).toBe(
        previousBrand[brand as keyof typeof previousBrand],
      );
    }
  });

  test("points Tailwind color bridges at the same root values", () => {
    const documentVars = mergedVars([rootVars, themeBridgeVars]);

    for (const [bridge, semantic] of Object.entries(themeBridges)) {
      expect(themeBridgeVars.get(bridge), bridge).toBe(`var(${semantic})`);
      expect(resolveVar(bridge, documentVars), bridge).toBe(
        rootSemantics[semantic as keyof typeof rootSemantics],
      );
    }
  });

  test("resolves every previous public token and brand token inside each theme", () => {
    for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
      const themeVars = themeBlocks[themeId];
      const computed = mergedVars([rootVars, themeBridgeVars, themeVars, pubPageGuard]);
      const previous = previousPub[themeId];

      for (const [name, literal] of Object.entries(previous)) {
        const alias = pubAliases[name as keyof typeof pubAliases];

        expect(themeVars.get(name), `${themeId} ${name}`).toBe(
          alias ? `var(${alias})` : literal,
        );
        expect(resolveVar(name, computed), `${themeId} ${name}`).toBe(literal);
      }

      for (const [brand, literal] of Object.entries(previousBrand)) {
        expect(resolveVar(brand, computed), `${themeId} ${brand}`).toBe(literal);
      }

      expect(resolveVar("--ink-muted", computed), themeId).toBe(previous["--pub-sub"]);
      expect(resolveVar("--line", computed), themeId).toBe(rootSemantics["--line"]);
      expect(resolveVar("--line-strong", computed), themeId).toBe(rootSemantics["--line-strong"]);
      expect(resolveVar("--tint-yellow", computed), themeId).toBe(rootSemantics["--tint-yellow"]);

      const cardVars = new Map(computed);
      cardVars.set("--pub-headline-color", "var(--pub-ink)");
      expect(resolveVar("--pub-headline-color", cardVars), themeId).toBe(previous["--pub-ink"]);
    }
  });
});
