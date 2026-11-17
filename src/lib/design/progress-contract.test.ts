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

  test("fills by the value to max ratio", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { value: 25, max: 50 }),
    );

    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain('aria-valuemax="50"');
    expect(html).toContain('data-state="loading"');
    expect(html).toContain("width:50%");
  });

  test("keeps a null value indeterminate", () => {
    const html = renderToStaticMarkup(createElement(Progress, { value: null }));

    expect(html).toContain('data-state="indeterminate"');
    expect(html).not.toContain("aria-valuenow");
    expect(html).not.toContain("width:");
  });
});
