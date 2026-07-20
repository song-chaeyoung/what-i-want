import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("SEO metadata contract", () => {
  test("indexes home with self canonical and complete Open Graph metadata", () => {
    const source = read("app/page.tsx");

    expect(source).toContain('import type { Metadata } from "next";');
    expect(source).toContain('canonical: "/"');
    expect(source).toContain('url: "/"');
    expect(source).toContain('siteName: "뭐갖고싶어"');
    expect(source).toContain('locale: "ko_KR"');
    expect(source).toContain('type: "website"');
    expect(source).toContain("index: true");
    expect(source).toContain("follow: true");
  });

  test("indexes sample with self canonical and complete Open Graph metadata", () => {
    const source = read("app/sample/page.tsx");

    expect(source).toContain('canonical: "/sample"');
    expect(source).toContain('url: "/sample"');
    expect(source).toContain('siteName: "뭐갖고싶어"');
    expect(source).toContain('locale: "ko_KR"');
    expect(source).toContain('type: "website"');
    expect(source).toContain("index: true");
    expect(source).toContain("follow: true");
    expect(source.match(/images: \["\/opengraph-image"\]/g) ?? []).toHaveLength(
      2,
    );
    expect(source).toContain("twitter:");
  });

  test("keeps user and account routes out of search results", () => {
    for (const path of [
      "app/wishlist/[slug]/page.tsx",
      "app/login/page.tsx",
      "app/onboarding/page.tsx",
      "app/admin/layout.tsx",
    ]) {
      const source = read(path);
      expect(source, path).toContain("index: false");
      expect(source, path).toContain("follow: false");
    }
  });

  test("marks both public wishlist metadata branches as noindex", () => {
    const source = read("app/wishlist/[slug]/page.tsx");

    expect(source.match(/index: false/g) ?? []).toHaveLength(2);
    expect(source.match(/follow: false/g) ?? []).toHaveLength(2);
    expect(source).toContain("openGraph:");
    expect(source).toContain("twitter:");
  });
});
