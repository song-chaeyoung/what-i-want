import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const countClassName =
  "inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-point px-1 text-micro font-bold leading-none text-white";

const fontSizes = ["text-micro", "text-caption", "text-tab", "text-nav"] as const;
const shadows = [
  "shadow-pixel-xs",
  "shadow-pixel-sm",
  "shadow-pixel-md",
  "shadow-pixel-lg",
  "shadow-pixel-xl",
  "shadow-header-line",
] as const;

describe("tailwind-merge custom scales", () => {
  test("keeps custom font sizes beside text colors", () => {
    for (const size of fontSizes) {
      const merged = cn(size, "font-semibold", "text-ink");
      expect(merged, size).toContain(size);
      expect(merged, size).toContain("text-ink");
    }
  });

  test("keeps the unread count classes and a pixel shadow beside a shadow color", () => {
    const merged = cn(countClassName);
    expect(merged).toContain("text-micro");
    expect(merged).toContain("text-white");
    expect(merged).toContain("leading-none");

    for (const shadow of shadows) {
      const mergedShadow = cn(shadow, "shadow-ink");
      expect(mergedShadow, shadow).toContain(shadow);
      expect(mergedShadow, shadow).toContain("shadow-ink");
    }
  });

  test("keeps shorthand theme colors beside font-size and border width", () => {
    const title = cn("text-2xl", "font-black", "tracking-normal", "text-(--headline)");
    expect(title).toContain("text-2xl");
    expect(title).toContain("text-(--headline)");

    const muted = cn("text-sm", "font-semibold", "leading-6", "text-(--ink-muted)");
    expect(muted).toContain("text-sm");
    expect(muted).toContain("leading-6");
    expect(muted).toContain("text-(--ink-muted)");

    const rule = cn("border-t-2", "border-(--divider-color)");
    expect(rule).toContain("border-t-2");
    expect(rule).toContain("border-(--divider-color)");

    const stat = cn("theme-card", "theme-stat", "p-4");
    expect(stat).toContain("theme-card");
    expect(stat).toContain("theme-stat");
    expect(stat).toContain("p-4");
  });

  test("keeps input surface colors beside other background utilities", () => {
    const thumbnail = cn(
      "bg-placeholder-bg bg-cover bg-center text-caption font-bold text-teal",
    );
    expect(thumbnail).toContain("bg-placeholder-bg");
    expect(thumbnail).toContain("bg-cover");
    expect(thumbnail).toContain("bg-center");
    expect(thumbnail).toContain("text-caption");
    expect(thumbnail).toContain("text-teal");

    expect(cn("bg-addon-bg", "border", "border-line")).toContain("bg-addon-bg");
    expect(cn("rounded", "border", "border-line", "bg-mock-field-bg")).toContain(
      "bg-mock-field-bg",
    );
  });

  test("renders Badge count with text-micro", () => {
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "count" }, "1"),
    );

    expect(html).toContain("text-micro");
    expect(html).toContain("text-white");
    expect(html).toContain("leading-none");
  });
});
