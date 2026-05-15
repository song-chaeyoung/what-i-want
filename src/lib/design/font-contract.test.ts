import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("Mona pixel font integration", () => {
  test("self-hosts MonaS12 Bold with its license", () => {
    expect(existsSync(join(root, "app/fonts/MonaS12-Bold.woff2"))).toBe(true);
    expect(existsSync(join(root, "app/fonts/MonaS-LICENSE.txt"))).toBe(true);
  });

  test("registers Mona as a Next local font variable", () => {
    const fontsFile = readFileSync(join(root, "app/fonts.ts"), "utf8");

    expect(fontsFile).toContain("next/font/local");
    expect(fontsFile).toContain("./fonts/MonaS12-Bold.woff2");
    expect(fontsFile).toContain('variable: "--font-mona"');
  });

  test("exposes a scoped pixel font utility instead of changing the body font", () => {
    const globalCss = readFileSync(join(root, "app/globals.css"), "utf8");

    expect(globalCss).toContain(".font-pixel");
    expect(globalCss).toContain("font-family: var(--font-mona)");
    expect(globalCss).toContain("font-family: Arial, Helvetica, sans-serif;");
  });

  test("applies the pixel font to public brand surfaces", () => {
    const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
    const publicPage = readFileSync(
      join(root, "app/b/[slug]/page.tsx"),
      "utf8",
    );

    expect(homePage).toContain("font-pixel");
    expect(publicPage).toContain("font-pixel");
  });
});
