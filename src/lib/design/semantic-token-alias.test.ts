import { readdirSync, readFileSync, statSync } from "node:fs";
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
  "--color-ink": "--brand-ink",
  "--color-paper": "--brand-paper",
  "--color-line": "--brand-line",
  "--color-teal": "--brand-teal",
  "--color-purple": "--brand-purple",
  "--color-mint": "--brand-mint",
  "--color-orange": "--brand-orange",
} as const;

/** 2단계에서 사용처를 옮긴 뒤 삭제한 --pub-* 별칭. 의미 토큰이 그 값을 직접 가진다. */
const migratedPub = {
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

const removedPubAliasPattern =
  /--pub-(?:bg|header-bg|surface|ink|sub|headline-color|headline-on-header|accent|point|fallback-bg|msg-bg)(?![\w-])/g;

/** 타이포 별칭. 값은 의미 토큰이 가지고, --pub-* 는 색 1단계처럼 잠시 남긴다. */
const typographyAliases = {
  "--pub-headline-font": "--headline-font",
  "--pub-headline-weight": "--headline-weight",
  "--pub-headline-size": "--headline-size",
  "--pub-headline-lh": "--headline-lh",
  "--pub-headline-ls": "--headline-ls",
  "--pub-label-font": "--label-font",
  "--pub-label-ls": "--label-ls",
  "--pub-label-transform": "--label-transform",
  "--pub-label-weight": "--label-weight",
  "--pub-pill-font": "--pill-font",
  "--pub-pill-weight": "--pill-weight",
  "--pub-pill-transform": "--pill-transform",
  "--pub-btn-font": "--btn-font",
  "--pub-btn-weight": "--btn-weight",
  "--pub-btn-size": "--btn-size",
} as const;

const rootFonts = {
  "--font-display": "var(--font-mona)",
  "--font-body": "var(--font-sans)",
} as const;

const themeFontSizes = {
  "--text-micro": "10px",
  "--text-caption": "11px",
  "--text-tab": "13px",
  "--text-nav": "13.5px",
} as const;

/** 모서리·테두리·그림자. 값은 의미 토큰이 가지고 --pub-* 는 별칭으로 남긴다. */
const shapeAliases = {
  "--pub-header-border": "--header-border",
  "--pub-border": "--card-border",
  "--pub-radius": "--card-radius",
  "--pub-shadow": "--card-shadow",
  "--pub-shadow-lg": "--card-shadow-lg",
  "--pub-shadow-sm": "--card-shadow-sm",
  "--pub-pill-border": "--pill-border",
  "--pub-pill-radius": "--pill-radius",
  "--pub-pill-shadow": "--pill-shadow",
  "--pub-btn-radius": "--btn-radius",
  "--pub-btn-border": "--btn-border",
  "--pub-btn-shadow": "--btn-shadow",
  "--pub-progress-border": "--progress-border",
  "--pub-progress-radius": "--progress-radius",
  "--pub-field-border": "--field-border",
  "--pub-field-radius": "--field-radius",
} as const;

const spacingAliases = {
  "--pub-pill-pad": "--pill-pad",
} as const;

const sharedSpacing = {
  "--btn-pad": "15px 18px",
  "--btn-gap": "8px",
  "--pill-gap": "6px",
} as const;

const pixelShadows = {
  "--shadow-pixel-sm": "3px 3px 0 #111827",
  "--shadow-pixel-md": "4px 4px 0 #111827",
  "--shadow-pixel-lg": "6px 6px 0 #111827",
  "--shadow-pixel-xl": "8px 8px 0 #111827",
  "--shadow-header-line": "0 1px 0 rgba(24, 24, 27, 0.02)",
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

/** --font-display / --font-body 는 next/font 변수의 별칭이다. 예전 리터럴과 맞출 때 한 단계만 되돌린다. */
function expandFontPurpose(value: string) {
  return value
    .replaceAll("var(--font-display,", "var(--font-mona,")
    .replaceAll("var(--font-body,", "var(--font-sans,");
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

function sourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
      continue;
    }

    if (/\.(css|tsx|ts)$/.test(entry)) {
      files.push(path);
    }
  }

  return files;
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

    for (const [name, value] of Object.entries(rootFonts)) {
      expect(rootVars.get(name), name).toBe(value);
    }
  });

  test("registers fixed arbitrary font sizes without replacing the default scale", () => {
    for (const [name, value] of Object.entries(themeFontSizes)) {
      expect(themeBridgeVars.get(name), name).toBe(value);
    }

    expect(themeBridgeVars.has("--text-sm")).toBe(false);
    expect(themeBridgeVars.has("--text-base")).toBe(false);
    expect(themeBridgeVars.has("--text-xs")).toBe(false);
    expect(themeBridgeVars.has("--font-display")).toBe(false);
    expect(themeBridgeVars.has("--font-body")).toBe(false);
    expect(themeBridgeVars.get("--font-sans")).toBe("var(--font-sans)");

    for (const [name, value] of Object.entries(pixelShadows)) {
      expect(rootVars.get(name), name).toBe(value);
      expect(themeBridgeVars.get(name), name).toBe(value);
    }

    expect(themeBridgeVars.get("--shadow-pub")).toBe("0 1px 2px rgba(0, 0, 0, 0.05)");
    expect(themeBridgeVars.get("--radius-pub")).toBe("0.375rem");
    expect(themeBridgeVars.get("--width-admin-sidebar")).toBe("220px");
    expect(themeBridgeVars.get("--spacing-admin-sidebar")).toBe("22px");
    expect(themeBridgeVars.has("--shadow-md")).toBe(false);
    expect(themeBridgeVars.get("--radius-md")).toBe("calc(var(--radius) * 0.8)");
  });

  test("points Tailwind color bridges at brand aliases", () => {
    const documentVars = mergedVars([rootVars, themeBridgeVars]);

    for (const [bridge, brand] of Object.entries(themeBridges)) {
      expect(themeBridgeVars.get(bridge), bridge).toBe(`var(${brand})`);
      expect(resolveVar(bridge, documentVars), bridge).toBe(
        previousBrand[brand as keyof typeof previousBrand],
      );
    }
  });

  test("resolves mapped colors from semantic tokens and keeps unmapped pub tokens", () => {
    expect(publicThemesCss).not.toMatch(/\.pub-page\s*\{[^}]*--brand-ink\s*:/);

    const basePubVars = themeBlocks.pixel_y2k;

    for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
      const themeVars = themeBlocks[themeId];
      const computed = mergedVars([rootVars, basePubVars, themeVars]);
      const previous = previousPub[themeId];

      for (const brand of Object.keys(previousBrand)) {
        expect(themeVars.has(brand), `${themeId} ${brand}`).toBe(false);
      }

      for (const [pubName, semantic] of Object.entries(migratedPub)) {
        const literal = previous[pubName as keyof typeof previous];

        expect(themeVars.has(pubName), `${themeId} ${pubName}`).toBe(false);
        expect(themeVars.get(semantic), `${themeId} ${semantic}`).toBe(literal);
        expect(resolveVar(semantic, computed), `${themeId} ${semantic}`).toBe(literal);
      }

      for (const [pubName, semantic] of Object.entries(typographyAliases)) {
        const literal = previous[pubName as keyof typeof previous];

        expect(computed.get(pubName), `${themeId} ${pubName}`).toBe(`var(${semantic})`);
        expect(expandFontPurpose(resolveVar(semantic, computed)), `${themeId} ${semantic}`).toBe(
          literal,
        );
        expect(expandFontPurpose(resolveVar(pubName, computed)), `${themeId} ${pubName}`).toBe(
          literal,
        );
      }

      expect(resolveVar("--label-size", computed), themeId).toBe("12px");
      expect(resolveVar("--pill-size", computed), themeId).toBe("12px");

      for (const [name, literal] of Object.entries(sharedSpacing)) {
        expect(basePubVars.get(name), name).toBe(literal);
        expect(resolveVar(name, computed), `${themeId} ${name}`).toBe(literal);
        if (themeId !== "pixel_y2k") {
          expect(themeVars.has(name), `${themeId} ${name}`).toBe(false);
        }
      }

      for (const [pubName, semantic] of Object.entries(spacingAliases)) {
        const literal = previous[pubName as keyof typeof previous];

        expect(computed.get(pubName), `${themeId} ${pubName}`).toBe(`var(${semantic})`);
        expect(resolveVar(semantic, computed), `${themeId} ${semantic}`).toBe(literal);
        expect(resolveVar(pubName, computed), `${themeId} ${pubName}`).toBe(literal);
      }

      for (const [pubName, semantic] of Object.entries(shapeAliases)) {
        const literal = previous[pubName as keyof typeof previous];

        expect(computed.get(pubName), `${themeId} ${pubName}`).toBe(`var(${semantic})`);
        expect(resolveVar(semantic, computed), `${themeId} ${semantic}`).toBe(literal);
        expect(resolveVar(pubName, computed), `${themeId} ${pubName}`).toBe(literal);
      }

      for (const [name, literal] of Object.entries(previous)) {
        if (
          name in migratedPub ||
          name in typographyAliases ||
          name in shapeAliases ||
          name in spacingAliases
        ) {
          continue;
        }

        expect(themeVars.get(name), `${themeId} ${name}`).toBe(literal);
        expect(resolveVar(name, computed), `${themeId} ${name}`).toBe(literal);
      }

      expect(resolveVar("--line", computed), themeId).toBe(rootSemantics["--line"]);
      expect(resolveVar("--line-strong", computed), themeId).toBe(rootSemantics["--line-strong"]);
      expect(resolveVar("--tint-yellow", computed), themeId).toBe(rootSemantics["--tint-yellow"]);
    }
  });

  test("keeps the card headline override on --headline and the header on the theme headline", () => {
    const cardBlock = extractBlock(publicThemesCss, /\.pub-card\s*\{/);
    const headlineBlock = extractBlock(publicThemesCss, /\.pub-headline\s*\{/);

    expect(cardBlock).toContain("--headline: var(--ink);");
    expect(headlineBlock).toContain("color: var(--headline);");
    expect(headlineBlock).toContain("font-family: var(--headline-font);");
    expect(headlineBlock).toContain("font-size: var(--headline-size);");
    expect(publicThemesCss).toContain("font-size: var(--label-size);");
    expect(publicThemesCss).toContain("font-size: var(--pill-size);");
    expect(publicThemesCss).toContain("font-size: var(--btn-size);");
    expect(publicThemesCss).toMatch(/\.pub-eyebrow\s*\{[^}]*font-size:\s*12px;/);
    expect(publicThemesCss).not.toMatch(/var\(--pub-headline-(?:font|weight|size|lh|ls)\)/);
    expect(publicThemesCss).not.toMatch(/var\(--pub-label-(?:font|ls|transform|weight)\)/);
    expect(publicThemesCss).not.toMatch(/var\(--pub-pill-(?:font|weight|transform)\)/);
    expect(publicThemesCss).not.toMatch(/var\(--pub-btn-(?:font|weight|size)\)/);
    expect(publicThemesCss).toContain("border: var(--card-border);");
    expect(publicThemesCss).toContain("border-radius: var(--card-radius);");
    expect(publicThemesCss).toContain("box-shadow: var(--card-shadow);");
    expect(publicThemesCss).toContain("border: var(--progress-border);");
    expect(publicThemesCss).toContain("background: var(--pub-progress-track);");
    expect(publicThemesCss).toContain("height: var(--pub-progress-h);");
    expect(publicThemesCss).toContain("gap: var(--pill-gap);");
    expect(publicThemesCss).toContain("padding: var(--pill-pad);");
    expect(publicThemesCss).toContain("gap: var(--btn-gap);");
    expect(publicThemesCss).toContain("padding: var(--btn-pad);");
    expect(publicThemesCss).toContain("border: 1.5px solid #f0dfe9;");
    expect(publicThemesCss).not.toMatch(
      /var\(--pub-(?:border|radius|shadow|shadow-lg|shadow-sm|header-border|pill-border|pill-radius|pill-shadow|btn-border|btn-radius|btn-shadow|progress-border|progress-radius|field-border|field-radius)\)/,
    );
    removedPubAliasPattern.lastIndex = 0;
    expect(publicThemesCss.match(removedPubAliasPattern)).toBeNull();

    for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
      const previous = previousPub[themeId];
      const computed = mergedVars([rootVars, themeBlocks[themeId]]);
      const cardVars = new Map(computed);
      cardVars.set("--headline", "var(--ink)");

      expect(resolveVar("--headline", computed), `${themeId} header`).toBe(
        previous["--pub-headline-color"],
      );
      expect(resolveVar("--headline", cardVars), `${themeId} card`).toBe(previous["--pub-ink"]);
    }
  });

  test("has no remaining mapped pub alias dependency in app or component sources", () => {
    const files = [
      ...sourceFiles(join(root, "app")),
      ...sourceFiles(join(root, "components")),
    ];

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      removedPubAliasPattern.lastIndex = 0;
      expect(source.match(removedPubAliasPattern), file).toBeNull();
    }
  });
});
