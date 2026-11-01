import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { metadata as homeMetadata } from "@/app/page";

vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("@/src/lib/onboarding/repository", () => ({
  getOnboardingState: async () => ({ isComplete: false }),
}));

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

  test("keeps home-only search copy out of the root layout", () => {
    const layout = read("app/layout.tsx");

    expect(layout).toContain('title: "뭐갖고싶어"');
    expect(layout).not.toContain("생일 선물 펀딩");
    expect(homeMetadata.title).toBe("생일 선물 펀딩 · 위시리스트 | 뭐갖고싶어");
    expect(homeMetadata.description).toBe(
      "친구들과 함께하는 생일 선물 펀딩. 받고 싶은 선물과 목표 금액을 정해 링크로 공유하세요. 친구들은 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 직접 송금할 수 있어요.",
    );
    expect(homeMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: homeMetadata.title,
      description: homeMetadata.description,
    });
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
    expect(source).toContain("export async function generateMetadata");
    expect(source).toContain("previousMetadata.openGraph?.images");
    expect(source).toContain("previousMetadata.twitter?.images");
    expect(source).not.toContain('images: ["/opengraph-image"]');
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
