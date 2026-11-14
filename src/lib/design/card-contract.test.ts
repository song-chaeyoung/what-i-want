import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  adminCardFooterClassName,
  adminCardHoverClassName,
  cardVariants,
} from "@/components/ui/card";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const cardSource = read("components/ui/card.tsx");
const globalsCss = read("app/globals.css");
const themeCss = read("app/public-themes.css");

describe("card variant contract", () => {
  test("keeps the shadcn card on the default variant", () => {
    const classes = cardVariants({ variant: "default" });

    expect(classes).toContain("rounded-xl");
    expect(classes).toContain("bg-card");
    expect(classes).toContain("ring-foreground/10");
    expect(classes).toContain("data-[size=sm]:py-3");
    expect(classes).not.toContain("border-ink");
    expect(classes).not.toContain("theme-card");
  });

  test("defines pixel, theme, and admin variants without hex colors", () => {
    expect(cardSource).not.toMatch(/#[0-9a-fA-F]{3,8}/);

    const pixel = cardVariants({ variant: "pixel", surface: "paper", shadow: "xs" });
    expect(pixel).toContain("border-2");
    expect(pixel).toContain("border-ink");
    expect(pixel).toContain("bg-paper");
    expect(pixel).toContain("shadow-pixel-xs");
    expect(pixel).not.toContain("rounded-xl");
    expect(pixel).not.toContain("ring-foreground");

    expect(cardVariants({ variant: "pixel", surface: "white", shadow: "none" })).toContain(
      "bg-white",
    );
    expect(cardVariants({ variant: "pixel", surface: "white", shadow: "none" })).not.toContain(
      "shadow-pixel",
    );
    expect(cardVariants({ variant: "pixel", shadow: "md" })).toContain("shadow-pixel-md");
    expect(cardVariants({ variant: "pixel", shadow: "lg" })).toContain("shadow-pixel-lg");

    expect(cardVariants({ variant: "theme" })).toContain("theme-card");
    expect(cardVariants({ variant: "theme" })).not.toContain("rounded-xl");

    const admin = cardVariants({ variant: "admin" });
    expect(admin).toContain("rounded-md");
    expect(admin).toContain("border-line");
    expect(admin).toContain("bg-white");
    expect(admin).not.toContain("ring-foreground");
    expect(adminCardFooterClassName).toBe("border-t border-line bg-admin-subtle");
    expect(adminCardHoverClassName).toBe("hover:bg-admin-bg");
  });

  test("moves pub-card box styles onto theme-card and keeps stat exceptions", () => {
    expect(themeCss).toContain(".theme-card {");
    expect(themeCss).toContain("--headline: var(--ink);");
    expect(themeCss).toContain(".theme-card.pub-stat");
    expect(themeCss).toContain("--headline: inherit;");
    expect(themeCss).toContain('.pub-page[data-theme="mono_bw"] .pub-stat');
    expect(themeCss).toContain('.pub-page[data-theme="soft_pastel"] .pub-stat');
    expect(themeCss).not.toContain(".pub-card");
    expect(themeCss).not.toContain(".pub-card-hero");
    expect(themeCss).not.toContain(".pub-msg");
    expect(themeCss).not.toContain(".pixel-board");
    expect(globalsCss).not.toContain(".pixel-board");
    expect(globalsCss).not.toContain(".pixel-card");
  });

  test("registers card text and admin surface tokens", () => {
    for (const declaration of [
      "--ink-soft: #4b5563;",
      "--ink-faint: #6b7280;",
      "--admin-bg: #fafaf9;",
      "--admin-subtle: #fbfbfa;",
      "--color-ink-soft: var(--ink-soft);",
      "--color-ink-faint: var(--ink-faint);",
      "--color-admin-bg: var(--admin-bg);",
      "--color-admin-subtle: var(--admin-subtle);",
    ]) {
      expect(globalsCss, declaration).toContain(declaration);
    }
  });

  test("moves former hard-coded card and text colors onto tokens", () => {
    const files = [
      "app/page.tsx",
      "app/login/page.tsx",
      "app/onboarding/page.tsx",
      "app/not-found.tsx",
      "app/error.tsx",
      "app/loading.tsx",
      "components/legal-document.tsx",
      "components/site-footer.tsx",
      "app/admin/layout.tsx",
      "app/admin/admin-shell-nav.tsx",
      "app/admin/page.tsx",
      "app/admin/wishes/page.tsx",
      "app/admin/messages/page.tsx",
      "app/admin/settings/page.tsx",
    ];
    const replaced = [
      "text-[#171717]",
      "border-[#171717]",
      "bg-[#fffdf7]",
      "text-[#4c1d95]",
      "text-[#4b5563]",
      "text-[#6b7280]",
      "bg-[#fafaf9]",
      "bg-[#fbfbfa]",
      "hover:bg-[#fafaf9]",
      "bg-[#fafaf9]/95",
      "text-[#0f766e]",
      "hover:text-[#0f766e]",
    ];

    for (const file of files) {
      const source = read(file);
      for (const legacy of replaced) {
        if (file === "app/page.tsx" && legacy === "border-[#171717]") {
          continue;
        }
        expect(source, `${file} ${legacy}`).not.toContain(legacy);
      }
    }

    expect(read("app/page.tsx")).toContain('variant="pixel"');
    expect(read("app/page.tsx")).toContain('surface="white"');
    expect(read("app/page.tsx")).toContain('shadow="none"');
    expect(read("app/login/page.tsx")).toContain('shadow="lg"');
    expect(read("components/legal-document.tsx")).toContain('shadow="md"');
    expect(read("components/legal-document.tsx")).toContain('surface="white"');
    expect(read("app/admin/wishes/page.tsx")).toContain("adminCardFooterClassName");
    expect(read("app/admin/wishes/page.tsx")).toContain("adminCardHoverClassName");
    expect(read("app/admin/settings/page.tsx")).toContain("bg-admin-bg/95");
    expect(read("components/public-wishlist-view.tsx")).toContain('variant="theme"');
    expect(read("components/public-wishlist-view.tsx")).toContain('className="pub-stat p-4"');
    expect(read("components/public-wishlist-view.tsx")).not.toContain("pub-card");
  });
});
