import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const homePagePath = join(process.cwd(), "app/page.tsx");

describe("home UI contract", () => {
  test("keeps the home page centered on a public wishlist preview", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain('id="preview"');
    expect(source).toContain("PreviewWish");
    expect(source).toContain("SampleGiftImage");
    expect(source).toContain("GiftProgress");
    expect(source).toContain("HOME_COPY.previewSlug");
    expect(source).not.toContain('className="pixel-board bg-[#fffdf7] p-5"');
  });

  test("adds the make share receive flow as short step UI", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain("homeSteps.map");
    expect(source).toContain("만들기");
    expect(source).toContain("공유하기");
    expect(source).toContain("마음 받기");
  });

  test("summarizes lower explanation cards with labels stickers and progress", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toContain("homeSignals.map");
    expect(source).toContain("SignalSticker");
    expect(source).toContain("GiftProgress");
    expect(source).toContain("truncate");
    expect(source).toContain("whitespace-normal");
  });
});
