import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const homePagePath = join(process.cwd(), "app/page.tsx");

describe("home UI contract", () => {
  test("keeps the home page centered on a public wishlist preview", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain("PreviewWish");
    expect(source).toContain("SampleGiftImage");
    expect(source).toContain("GiftProgress");
    expect(source).toContain('text="SAMPLE"');
    expect(source).toContain('href="/sample"');
    expect(source).not.toContain("HOME_COPY.previewSlug");
    expect(source).not.toContain("/b/{HOME_COPY.previewSlug}");
    expect(source).not.toContain('className="pixel-board bg-[#fffdf7] p-5"');
  });

  test("adds the make share receive flow as short step UI", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain("homeSteps.map");
    expect(source).toContain("만들기");
    expect(source).toContain("공유하기");
    expect(source).toContain("마음 받기");
  });

  test("drops decorative fake progress signals from the home page", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).not.toContain("homeSignals");
    expect(source).not.toContain("오늘 모인 마음");
    expect(source).not.toContain('text="LIVE"');
    expect(source).toContain("HOME_COPY.subDescription");
  });

  test("uses authenticated home CTA copy and destinations", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain('import { auth } from "@/auth";');
    expect(source).toContain(
      'import { getOnboardingState } from "@/src/lib/onboarding/repository";',
    );
    expect(source).toContain("export default async function Home()");
    expect(source).toContain("const homeAccountCta = await getHomeAccountCta();");
    expect(source).toContain("const session = await auth();");
    expect(source).toContain('href={homeAccountCta.href}');
    expect(source).toContain("{homeAccountCta.label}");
    expect(source).toContain('label: HOME_COPY.cta, href: "/login"');
    expect(source).toContain(
      'label: "위시리스트 만들기 계속하기", href: "/onboarding"',
    );
    expect(source).toContain(
      'label: "내 위시리스트 관리하기", href: "/admin"',
    );
  });
});
