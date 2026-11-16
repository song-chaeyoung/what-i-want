import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Progress } from "@/components/ui/progress";

describe("progress variants", () => {
  test("clamps the admin bar and keeps the track and fill classes", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { value: 140, className: "mt-2" }),
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain("bg-track");
    expect(html).toContain("bg-teal");
    expect(html).toContain("width:100%");
    expect(html).not.toContain("translateX");
  });

  test("renders the theme bar on the progress indicator slot", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { variant: "theme", value: -4, className: "mt-2" }),
    );

    expect(html).toContain('class="theme-progress mt-2"');
    expect(html).toContain('data-slot="progress-indicator"');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain("width:0%");
  });
});
