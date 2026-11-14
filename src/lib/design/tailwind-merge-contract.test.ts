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

  test("renders Badge count with text-micro", () => {
    const html = renderToStaticMarkup(
      createElement(Badge, { variant: "count" }, "1"),
    );

    expect(html).toContain("text-micro");
    expect(html).toContain("text-white");
    expect(html).toContain("leading-none");
  });
});
