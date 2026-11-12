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

const sharedSpacing = {
  "--btn-pad": "15px 18px",
  "--btn-gap": "8px",
  "--pill-gap": "6px",
} as const;

const pixelShadows = {
  "--shadow-pixel-xs": "2px 2px 0 #111827",
  "--shadow-pixel-sm": "3px 3px 0 #111827",
  "--shadow-pixel-md": "4px 4px 0 #111827",
  "--shadow-pixel-lg": "6px 6px 0 #111827",
  "--shadow-pixel-xl": "8px 8px 0 #111827",
  "--shadow-header-line": "0 1px 0 rgba(24, 24, 27, 0.02)",
} as const;

/** 세 테마 블록이 직접 가진 커스텀 속성 리터럴. */
const previousPub = {
  pixel_y2k: {
    "--surface-page": "#fff7ed",
    "--bg-dots": "radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)",
    "--dot-size": "18px",
    "--surface-header": "#fef3c7",
    "--header-dots": "radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)",
    "--header-border": "2px solid #171717",
    "--surface": "#fffdf7",
    "--ink": "#171717",
    "--ink-muted": "#3f3f46",
    "--headline": "#4c1d95",
    "--headline-font": "var(--font-display, Arial, Helvetica, sans-serif)",
    "--headline-weight": "700",
    "--headline-size": "36px",
    "--headline-lh": "1.4",
    "--headline-ls": "0",
    "--header-sub": "#0f766e",
    "--label-font": "var(--font-display, Arial, Helvetica, sans-serif)",
    "--label-color": "#0f766e",
    "--label-ls": "0",
    "--label-transform": "none",
    "--label-weight": "700",
    "--accent-main": "#0f766e",
    "--stat-accent": "#0f766e",
    "--point": "#f97316",
    "--on-point": "#fff",
    "--card-border": "2px solid #171717",
    "--divider-color": "#171717",
    "--card-shadow": "6px 6px 0 #111827",
    "--card-shadow-lg": "8px 8px 0 #111827",
    "--card-shadow-sm": "3px 3px 0 #111827",
    "--card-radius": "4px",
    "--tint-mint": "#ccfbf1",
    "--pill-bg": "#f97316",
    "--pill-color": "#fff",
    "--pill-alt-bg": "#ccfbf1",
    "--pill-alt-color": "#171717",
    "--pill-border": "2px solid #171717",
    "--pill-radius": "0",
    "--pill-shadow": "3px 3px 0 #111827",
    "--pill-font": "var(--font-display, Arial, Helvetica, sans-serif)",
    "--pill-weight": "700",
    "--pill-transform": "none",
    "--pill-pad": "7px 10px 6px",
    "--btn-font": "var(--font-display, Arial, Helvetica, sans-serif)",
    "--btn-weight": "700",
    "--btn-size": "15px",
    "--btn-radius": "4px",
    "--btn-border": "2px solid #171717",
    "--btn-shadow": "3px 3px 0 #111827",
    "--progress-track": "#fff",
    "--progress-border": "2px solid #171717",
    "--progress-radius": "2px",
    "--progress-h": "18px",
    "--progress-fill": "#0f766e",
    "--field-border": "2px solid #171717",
    "--field-radius": "4px",
    "--field-bg": "#fff",
    "--bank-bg": "#ccfbf1",
    "--bank-ink": "#134e4a",
    "--tint-blush": "#ffe4e6",
    "--msg-title": "#171717",
    "--msg-sub": "#9d174d",
  },
  mono_bw: {
    "--surface-page": "#ffffff",
    "--bg-dots": "none",
    "--dot-size": "0",
    "--surface-header": "#111111",
    "--header-dots": "none",
    "--header-border": "1.5px solid #111",
    "--surface": "#fff",
    "--ink": "#111",
    "--ink-muted": "#6b6b6b",
    "--headline": "#fff",
    "--headline-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--headline-weight": "900",
    "--headline-size": "30px",
    "--headline-lh": "1.18",
    "--headline-ls": "-1px",
    "--header-sub": "rgba(255, 255, 255, 0.6)",
    "--label-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--label-color": "#9a9a9a",
    "--label-ls": "1.6px",
    "--label-transform": "uppercase",
    "--label-weight": "700",
    "--accent-main": "#111",
    "--stat-accent": "#fff",
    "--point": "#111",
    "--on-point": "#fff",
    "--card-border": "1.5px solid #111",
    "--divider-color": "#111",
    "--card-shadow": "none",
    "--card-shadow-lg": "none",
    "--card-shadow-sm": "none",
    "--card-radius": "0",
    "--tint-mint": "#f3f3f3",
    "--pill-bg": "transparent",
    "--pill-color": "#111",
    "--pill-alt-bg": "#111",
    "--pill-alt-color": "#fff",
    "--pill-border": "1.5px solid #111",
    "--pill-radius": "0",
    "--pill-shadow": "none",
    "--pill-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--pill-weight": "700",
    "--pill-transform": "uppercase",
    "--pill-pad": "6px 10px",
    "--btn-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--btn-weight": "700",
    "--btn-size": "14px",
    "--btn-radius": "0",
    "--btn-border": "1.5px solid #111",
    "--btn-shadow": "none",
    "--progress-track": "#ededed",
    "--progress-border": "1.5px solid #111",
    "--progress-radius": "0",
    "--progress-h": "12px",
    "--progress-fill": "#111",
    "--field-border": "1.5px solid #111",
    "--field-radius": "0",
    "--field-bg": "#fff",
    "--bank-bg": "#f6f6f6",
    "--bank-ink": "#333",
    "--tint-blush": "#fafafa",
    "--msg-title": "#111",
    "--msg-sub": "#6b6b6b",
  },
  soft_pastel: {
    "--surface-page": "#fbf5ff",
    "--bg-dots": "none",
    "--dot-size": "0",
    "--surface-header": "#ffeaf3",
    "--header-dots": "none",
    "--header-border": "none",
    "--surface": "#ffffff",
    "--ink": "#5b5566",
    "--ink-muted": "#8b8398",
    "--headline": "#bd6595",
    "--headline-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--headline-weight": "800",
    "--headline-size": "30px",
    "--headline-lh": "1.3",
    "--headline-ls": "-0.4px",
    "--header-sub": "#7fb8ab",
    "--label-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--label-color": "#bd6595",
    "--label-ls": "0.4px",
    "--label-transform": "none",
    "--label-weight": "700",
    "--accent-main": "#7fb8ab",
    "--stat-accent": "#7fb8ab",
    "--point": "#f79f97",
    "--on-point": "#fff",
    "--card-border": "none",
    "--divider-color": "#f0dfe9",
    "--card-shadow": "0 10px 28px rgba(150, 120, 160, 0.16)",
    "--card-shadow-lg": "0 14px 32px rgba(150, 120, 160, 0.18)",
    "--card-shadow-sm": "0 6px 16px rgba(150, 120, 160, 0.2)",
    "--card-radius": "22px",
    "--tint-mint": "#fdeef5",
    "--pill-bg": "#ffe1ec",
    "--pill-color": "#bd6595",
    "--pill-alt-bg": "#dff1ec",
    "--pill-alt-color": "#3f7a6e",
    "--pill-border": "none",
    "--pill-radius": "999px",
    "--pill-shadow": "none",
    "--pill-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--pill-weight": "700",
    "--pill-transform": "none",
    "--pill-pad": "7px 12px",
    "--btn-font": "var(--font-body, Arial, Helvetica, sans-serif)",
    "--btn-weight": "700",
    "--btn-size": "15px",
    "--btn-radius": "16px",
    "--btn-border": "none",
    "--btn-shadow": "0 6px 16px rgba(150, 120, 160, 0.2)",
    "--progress-track": "#f1eaf6",
    "--progress-border": "none",
    "--progress-radius": "999px",
    "--progress-h": "10px",
    "--progress-fill": "#7fb8ab",
    "--field-border": "1.5px solid #f0dfe9",
    "--field-radius": "14px",
    "--field-bg": "#fffafc",
    "--bank-bg": "#dff1ec",
    "--bank-ink": "#3f7a6e",
    "--tint-blush": "#fdeef5",
    "--msg-title": "#bd6595",
    "--msg-sub": "#c77ba0",
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

    expect(themeBridgeVars.has("--shadow-pub")).toBe(false);
    expect(themeBridgeVars.has("--radius-pub")).toBe(false);
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

  test("keeps each theme token literal on its current name", () => {
    expect(publicThemesCss).not.toMatch(/\.pub-page\s*\{[^}]*--brand-ink\s*:/);

    const basePubVars = themeBlocks.pixel_y2k;

    for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
      const themeVars = themeBlocks[themeId];
      const computed = mergedVars([rootVars, basePubVars, themeVars]);
      const previous = previousPub[themeId];

      for (const brand of Object.keys(previousBrand)) {
        expect(themeVars.has(brand), `${themeId} ${brand}`).toBe(false);
      }

      for (const [name, literal] of Object.entries(previous)) {
        expect(themeVars.get(name), `${themeId} ${name}`).toBe(literal);
        expect(resolveVar(name, computed), `${themeId} ${name}`).toBe(literal);
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

      expect(resolveVar("--line", computed), themeId).toBe(rootSemantics["--line"]);
      expect(resolveVar("--line-strong", computed), themeId).toBe(rootSemantics["--line-strong"]);
      expect(resolveVar("--tint-yellow", computed), themeId).toBe(rootSemantics["--tint-yellow"]);
    }
  });

  test("keeps the card headline override on --headline and the header on the theme headline", () => {
    const cardBlock = extractBlock(publicThemesCss, /\.pub-card\s*\{/);
    const headlineBlock = extractBlock(publicThemesCss, /\.pub-headline\s*\{/);
    const removedPrefix = "--" + "pub-";

    expect(cardBlock).toContain("--headline: var(--ink);");
    expect(headlineBlock).toContain("color: var(--headline);");
    expect(headlineBlock).toContain("font-family: var(--headline-font);");
    expect(headlineBlock).toContain("font-size: var(--headline-size);");
    expect(publicThemesCss).toContain("font-size: var(--label-size);");
    expect(publicThemesCss).toContain("font-size: var(--pill-size);");
    expect(publicThemesCss).toContain("font-size: var(--btn-size);");
    expect(publicThemesCss).toMatch(/\.pub-eyebrow\s*\{[^}]*font-size:\s*12px;/);
    expect(publicThemesCss).toContain("background: var(--pill-bg);");
    expect(publicThemesCss).toContain("color: var(--pill-color);");
    expect(publicThemesCss).toContain("background: var(--pill-alt-bg);");
    expect(publicThemesCss).toContain("color: var(--pill-alt-color);");
    expect(publicThemesCss).toContain("color: var(--on-point);");
    expect(publicThemesCss).toContain("border: var(--card-border);");
    expect(publicThemesCss).toContain("border-radius: var(--card-radius);");
    expect(publicThemesCss).toContain("box-shadow: var(--card-shadow);");
    expect(publicThemesCss).toContain("border: var(--progress-border);");
    expect(publicThemesCss).toContain("background: var(--progress-track);");
    expect(publicThemesCss).toContain("height: var(--progress-h);");
    expect(publicThemesCss).toContain("background: var(--progress-fill);");
    expect(publicThemesCss).toContain("background: var(--field-bg);");
    expect(publicThemesCss).toContain("background: var(--bank-bg);");
    expect(publicThemesCss).toContain("color: var(--header-sub);");
    expect(publicThemesCss).toContain("color: var(--label-color);");
    expect(publicThemesCss).toContain("color: var(--msg-title);");
    expect(publicThemesCss).toContain("gap: var(--pill-gap);");
    expect(publicThemesCss).toContain("padding: var(--pill-pad);");
    expect(publicThemesCss).toContain("gap: var(--btn-gap);");
    expect(publicThemesCss).toContain("padding: var(--btn-pad);");
    expect(publicThemesCss).toContain("border: 1.5px solid #f0dfe9;");
    expect(publicThemesCss).not.toMatch(/var\(--stat-accent\)/);
    expect(publicThemesCss).not.toMatch(/var\(--msg-sub\)/);
    expect(publicThemesCss.includes(removedPrefix)).toBe(false);

    for (const themeId of ["pixel_y2k", "mono_bw", "soft_pastel"] as const) {
      const previous = previousPub[themeId];
      const computed = mergedVars([rootVars, themeBlocks[themeId]]);
      const cardVars = new Map(computed);
      cardVars.set("--headline", "var(--ink)");

      expect(resolveVar("--headline", computed), `${themeId} header`).toBe(previous["--headline"]);
      expect(resolveVar("--headline", cardVars), `${themeId} card`).toBe(previous["--ink"]);
    }
  });

  test("has no pub-prefixed custom property in app, components, or src", () => {
    const needle = "--" + "pub-";
    const files = [
      ...sourceFiles(join(root, "app")),
      ...sourceFiles(join(root, "components")),
      ...sourceFiles(join(root, "src")),
    ];

    expect(files.length).toBeGreaterThan(0);
    expect(publicThemesCss.includes(needle)).toBe(false);
    expect(globalsCss.includes(needle)).toBe(false);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source.includes(needle), file).toBe(false);
    }
  });
});
