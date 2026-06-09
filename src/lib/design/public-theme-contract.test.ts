import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { PUBLIC_THEME_IDS } from "@/src/lib/wishlist/theme";

const root = process.cwd();
const globalsCssPath = join(root, "app/globals.css");
const publicThemesCssPath = join(root, "app/public-themes.css");
const publicPagePath = join(root, "app/b/[slug]/page.tsx");
const publicNotFoundPath = join(root, "app/b/[slug]/not-found.tsx");

describe("public theme contract", () => {
  test("imports the public theme stylesheet from global CSS", () => {
    const source = readFileSync(globalsCssPath, "utf8");

    expect(source).toContain('@import "./public-themes.css";');
  });

  test("defines public theme tokens without remote CSS imports", () => {
    expect(existsSync(publicThemesCssPath)).toBe(true);

    const source = readFileSync(publicThemesCssPath, "utf8");

    for (const themeId of PUBLIC_THEME_IDS) {
      expect(source).toContain(`[data-theme="${themeId}"]`);
    }

    expect(source).toContain(".pub-page");
    expect(source).toContain(".pub-card");
    expect(source).toContain(".pub-btn");
    expect(source).not.toContain("@import url(");
    expect(source).toContain("var(--font-mona");
  });

  test("binds the selected public theme to the public wishlist page", () => {
    const source = readFileSync(publicPagePath, "utf8");

    expect(source).toContain('className="pub-page min-h-dvh"');
    expect(source).toContain("data-theme={result.wishlist.themeId}");
    expect(source).not.toContain('className="pixel-dot-bg min-h-dvh text-[#171717]"');
  });

  test("renders the public wishlist header as a full-width themed section", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");

    expect(pageSource).toContain('<header className="pub-header">');
    expect(pageSource).toContain(
      'className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12"',
    );
    expect(pageSource).toContain(
      '<section className="mx-auto w-full max-w-6xl space-y-5 px-5 py-6 sm:px-8 lg:py-8">',
    );
    expect(pageSource).toContain('className="pub-stat p-4"');
    expect(pageSource).not.toContain("/b/{result.wishlist.slug}");
    expect(pageSource).not.toContain("pub-card pub-card-hero pub-header");
    expect(pageSource).not.toContain("lg:grid-cols-[0.9fr_1.1fr]");
  });

  test("keeps public card headline color on the surface ink token", () => {
    const cssSource = readFileSync(publicThemesCssPath, "utf8");

    expect(cssSource).toMatch(
      /\.pub-card\s*\{[\s\S]*?--pub-headline-color:\s*var\(--pub-ink\);/,
    );
  });

  test("keeps public participation as a server POST form", () => {
    const source = readFileSync(publicPagePath, "utf8");

    expect(source).toContain('method="post"');
    expect(source).toContain("/api/public/wishlists");
    expect(source).toContain('name="wishItemId"');
    expect(source).toContain('name="amount"');
    expect(source).toContain('name="senderName"');
    expect(source).toContain('name="body"');
    expect(source).not.toContain("preventDefault()");
    expect(source).not.toContain("window.open");
  });

  test("keeps the public page focused on gift-card participation UI", () => {
    const source = readFileSync(publicPagePath, "utf8");

    expect(source).toContain("gift-card-shell");
    expect(source).toContain("gift-image-stage");
    expect(source).toContain("gift-progress-panel");
    expect(source).toContain("send-heart-section");
    expect(source).toContain("soft-bank-card");
    expect(PUBLIC_WISHLIST_COPY.participationTitle).toBe("마음 보내기");
    expect(source).toContain("PUBLIC_WISHLIST_COPY.participationTitle");
    expect(source).toContain("선물 링크 보기");
    expect(source).not.toContain("filter");
    expect(source).not.toContain("statusFilter");
  });

  test("uses public theme primitives on the public not-found page", () => {
    const source = readFileSync(publicNotFoundPath, "utf8");

    expect(source).toContain("pub-page");
    expect(source).toContain("pub-card");
    expect(source).not.toContain("pixel-dot-bg");
  });
});
