import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("Open Graph image contract", () => {
  test("adds a generated service-level Open Graph image", () => {
    const filePath = join(root, "app/opengraph-image.tsx");

    expect(existsSync(filePath)).toBe(true);

    const source = readFileSync(filePath, "utf8");

    expect(source).toContain('import { ImageResponse } from "next/og";');
    expect(source).toContain("export const alt");
    expect(source).toContain("export const size");
    expect(source).toContain("width: 1200");
    expect(source).toContain("height: 630");
    expect(source).toContain('export const contentType = "image/png";');
    expect(source).toContain("뭐갖고싶어");
    expect(source).toContain("const OG_FONT_FAMILY");
    expect(source).toContain("readFile");
    expect(source).toContain("NotoSansCJKkr-Bold.otf");
    expect(source).not.toContain("public/logo.png");
    expect(source).not.toContain("data:image/png;base64");
    expect(source).toContain("fonts:");
  });

  test("adds a generated public wishlist Open Graph image for shared slugs", () => {
    const filePath = join(root, "app/wishlist/[slug]/opengraph-image.tsx");
    const legacyFilePath = join(root, "app/b/[slug]/opengraph-image.tsx");

    expect(existsSync(filePath)).toBe(true);
    expect(existsSync(legacyFilePath)).toBe(false);

    const source = readFileSync(filePath, "utf8");

    expect(source).toContain('import { ImageResponse } from "next/og";');
    expect(source).toContain("getPublicWishlist");
    expect(source).toContain("DrizzlePublicWishlistRepository");
    expect(source).toContain("params: Promise<{ slug: string }>");
    expect(source).toContain("const { slug } = await params");
    expect(source).toContain("result.ok");
    expect(source).toContain("위시리스트를 찾을 수 없어요");
    expect(source).toContain("const OG_FONT_FAMILY");
    expect(source).toContain("readFile");
    expect(source).toContain("NotoSansCJKkr-Bold.otf");
    expect(source).not.toContain("public/logo.png");
    expect(source).not.toContain("data:image/png;base64");
    expect(source).not.toContain("/b/{slug}");
    expect(source).toContain("fonts:");
  });

  test("exposes share metadata from the root layout", () => {
    const source = readFileSync(join(root, "app/layout.tsx"), "utf8");

    expect(source).toContain("metadataBase:");
    expect(source).toContain("process.env.AUTH_URL");
    expect(source).toContain("openGraph:");
    expect(source).toContain("twitter:");
    expect(source).toContain('siteName: "뭐갖고싶어"');
    expect(source).toContain('card: "summary_large_image"');
  });
});
