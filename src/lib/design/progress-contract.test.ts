import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Progress } from "@/components/ui/progress";

const require = createRequire(import.meta.url);
const tailwindEntry = realpathSync(require.resolve("@tailwindcss/postcss"));
const requireFromTailwind = createRequire(tailwindEntry);
const postcss = requireFromTailwind("postcss") as (
  plugins: unknown[],
) => {
  process: (css: string, options: { from: string }) => Promise<{ css: string }>;
};
const tailwindPlugin = requireFromTailwind("@tailwindcss/postcss") as (options?: {
  optimize?: boolean;
}) => unknown;

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

  test("keeps a null value indeterminate and empty", () => {
    const html = renderToStaticMarkup(createElement(Progress, { value: null }));

    expect(html).toContain('data-state="indeterminate"');
    expect(html).not.toContain("aria-valuenow");
    expect(html).toContain("width:0%");
  });

  test(
    "null fill measures empty while a full value fills each variant track",
    async () => {
      const sourcePath = join(process.cwd(), "app/globals.css");
      const compiled = await postcss([tailwindPlugin({ optimize: true })]).process(
        readFileSync(sourcePath, "utf8"),
        { from: sourcePath },
      );
      const variants = ["theme", "pixel", "admin"] as const;
      const body = variants
        .flatMap((variant) =>
          [null, 100].map((value) => {
            const markup = renderToStaticMarkup(
              createElement(Progress, {
                variant,
                value,
                style: { width: "200px" },
              }),
            );

            return `<div class="theme-page" data-theme="pixel_y2k" data-case="${variant}-${value ?? "null"}">${markup}</div>`;
          }),
        )
        .join("");
      const { chromium } = await import("@playwright/test");
      const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] });

      try {
        const page = await browser.newPage();
        const dir = mkdtempSync(join(tmpdir(), "progress-width-"));
        const file = join(dir, "index.html");
        writeFileSync(
          file,
          `<!doctype html><html><head><style>${compiled.css}</style></head><body>${body}</body></html>`,
        );
        await page.goto(`file://${file}`);
        const measured = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("[data-case]")].map((section) => {
            const root = section.querySelector<HTMLElement>('[data-slot="progress"]');
            const indicator = root?.querySelector<HTMLElement>('[data-slot="progress-indicator"]');

            return {
              caseId: section.dataset.case ?? "",
              state: root?.getAttribute("data-state") ?? null,
              now: root?.getAttribute("aria-valuenow") ?? null,
              track: root?.clientWidth ?? 0,
              fill: indicator?.getBoundingClientRect().width ?? -1,
            };
          }),
        );

        expect(measured).toHaveLength(6);
        for (const variant of variants) {
          const empty = measured.find((bar) => bar.caseId === `${variant}-null`);
          const full = measured.find((bar) => bar.caseId === `${variant}-100`);
          expect(empty?.state, variant).toBe("indeterminate");
          expect(empty?.now, variant).toBeNull();
          expect(empty?.fill, variant).toBe(0);
          expect(full?.now, variant).toBe("100");
          expect(full?.track, variant).toBeGreaterThan(0);
          expect(full?.fill, variant).toBe(full?.track);
        }
      } finally {
        await browser.close();
      }
    },
    60000,
  );
});
