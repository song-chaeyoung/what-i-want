import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const homePagePath = join(process.cwd(), "app/page.tsx");
const notFoundPath = join(process.cwd(), "app/not-found.tsx");
const errorPath = join(process.cwd(), "app/error.tsx");
const globalsPath = join(process.cwd(), "app/globals.css");
const squareCardClass =
  "w-full max-w-md space-y-4 border-2 border-[#171717] bg-[#fffdf7] p-6 shadow-pixel-xs";

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

  test("uses the 2px pixel shadow on home surfaces", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain("shadow-pixel-xs");
    expect(source).toContain(
      'className="border-2 border-[#171717] bg-[#fffdf7] p-4 shadow-pixel-xs sm:p-5"',
    );
    expect(source).not.toContain("shadow-pixel-sm");
    expect(source).not.toContain("shadow-pixel-md");
    expect(source).not.toContain("shadow-pixel-lg");
    expect(source).not.toContain("pixel-board");
    expect(source).not.toContain("pixel-card");
  });

  test("shows home steps as a non-interactive sequence with a dotted connector", () => {
    const source = readFileSync(homePagePath, "utf8");
    const listStart = source.indexOf("<ol");
    const listTag = source.slice(listStart, source.indexOf(">", listStart));
    const steps = source.slice(
      source.indexOf("homeSteps.map"),
      source.indexOf("</ol>"),
    );

    expect(listTag).toContain('role="list"');
    expect(listTag).toContain("list-none");
    expect(steps).toContain("rounded-full");
    expect(steps).toContain("border-2 border-[#171717]");
    expect(steps).toContain("bg-[var(--tint-yellow)]");
    expect(steps).toContain("border-dotted");
    expect(steps).toContain("sm:border-t-2");
    expect(steps).toContain("border-l-2");
    expect(steps).not.toContain("shadow-");
    expect(steps).not.toContain("bg-white");
    expect(steps).not.toContain("<Link");
    expect(steps).not.toContain("<button");
    expect(steps).not.toContain("hover:");
    expect(steps).not.toContain("cursor-pointer");
  });

  test("squares the root 404 and error cards and gives them the 2px shadow", () => {
    for (const filePath of [notFoundPath, errorPath]) {
      const source = readFileSync(filePath, "utf8");

      const sectionStart = source.indexOf("<section");
      const sectionTag = source.slice(sectionStart, source.indexOf(">", sectionStart));

      expect(sectionTag, filePath).toContain(squareCardClass);
      expect(sectionTag, filePath).not.toContain("rounded-md");
      expect(source, filePath).not.toContain("bg-white p-6");
    }
  });

  test("keeps the sticker label on the 2px pixel shadow", () => {
    const globalsCss = readFileSync(globalsPath, "utf8");
    const sticker = globalsCss.slice(globalsCss.indexOf(".sticker-label"));

    expect(sticker.slice(0, sticker.indexOf("}"))).toContain(
      "box-shadow: var(--shadow-pixel-xs);",
    );
  });
});
