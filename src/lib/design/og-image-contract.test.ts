import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { wishlistTitleWordBreak } from "@/src/lib/design/og-title-word-break";

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
    expect(source).toContain("getCachedPublicWishlist");
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
    expect(source).toContain("fontSize: 58");
    expect(source).toContain("fontSize: 25");
    expect(source).toContain("wishlistTitleWordBreak(title)");
    const wordBreakSource = readFileSync(
      join(root, "src/lib/design/og-title-word-break.ts"),
      "utf8",
    );
    expect(wordBreakSource).toContain("export const TITLE_WORD_BREAK_LIMIT = 10");
    expect(wordBreakSource).toContain("58px");
    expect(wordBreakSource).toContain('? "keep-all"');
    expect(wordBreakSource).toContain(': "break-all"');
    expect(source).toContain('wordBreak: "break-all"');
    expect(source).toContain("lineClamp: 2");
    expect(source).toContain("lineClamp: 1");
  });

  test("keeps title words intact until one word exceeds the title width", () => {
    expect(wishlistTitleWordBreak("우리 가족과 친구들")).toBe("keep-all");
    expect(wishlistTitleWordBreak("우리 가족과 친구들님의 위시리스트")).toBe("keep-all");
    expect(wishlistTitleWordBreak("짧은 제목")).toBe("keep-all");
    expect(
      wishlistTitleWordBreak(
        "우리 가족과 친구들이 함께 고른 올해 생일 선물 위시리스트예요 화이팅해요",
      ),
    ).toBe("keep-all");
    expect(wishlistTitleWordBreak("가".repeat(10))).toBe("keep-all");

    expect(wishlistTitleWordBreak("생일축하받고싶은김민지")).toBe("break-all");
    expect(wishlistTitleWordBreak("가".repeat(11))).toBe("break-all");
    expect(wishlistTitleWordBreak("가".repeat(40))).toBe("break-all");
    expect(wishlistTitleWordBreak("짧은 생일축하받고싶은김민지")).toBe("break-all");
  });

  test("exposes share metadata from the root layout", () => {
    const source = readFileSync(join(root, "app/layout.tsx"), "utf8");

    expect(source).toContain(
      'import { resolveSiteUrl } from "@/src/lib/metadata/site-url";',
    );
    expect(source).toContain("metadataBase: resolveSiteUrl(),");
    expect(source).not.toContain("function resolveMetadataBase");
    expect(source).toContain("openGraph:");
    expect(source).toContain("twitter:");
    expect(source).toContain('siteName: "뭐갖고싶어"');
    expect(source).toContain('card: "summary_large_image"');
  });
});
