import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { alertVariants } from "@/components/ui/alert";
import { badgeVariants } from "@/components/ui/badge";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function sourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path));
      continue;
    }

    if (entry.endsWith(".tsx")) {
      files.push(path);
    }
  }

  return files;
}

const badgeSource = read("components/ui/badge.tsx");
const alertSource = read("components/ui/alert.tsx");
const globalsCss = read("app/globals.css");
const themeCss = read("app/public-themes.css");

const allowedHex = new Map<string, string[] | "any">([
  ["app/admin/settings/page.tsx", ["#f9fafb"]],
  ["app/admin/wishes/page.tsx", ["#f4f4f3"]],
  ["app/admin/admin-guide-visual.tsx", ["#fafafa"]],
  ["app/opengraph-image.tsx", "any"],
  ["app/wishlist/[slug]/opengraph-image.tsx", "any"],
]);

describe("badge and notice contract", () => {
  test("keeps shadcn badge variants and adds theme, status, and count without hex", () => {
    expect(badgeSource).not.toMatch(/#[0-9a-fA-F]{3,8}/);

    const shadcn = badgeVariants({ variant: "default" });
    expect(shadcn).toContain("rounded-4xl");
    expect(shadcn).toContain("bg-primary");
    expect(shadcn).not.toContain("theme-pill");

    expect(badgeVariants({ variant: "theme" })).toBe("theme-pill");
    expect(badgeVariants({ variant: "theme-alt" })).toBe("theme-pill theme-pill-alt");
    expect(badgeVariants({ variant: "theme" })).not.toContain("rounded-4xl");
    expect(badgeVariants({ variant: "theme" })).not.toContain("h-5");

    const status = badgeVariants({ variant: "status", tone: "open" });
    expect(status).toContain("inline-flex");
    expect(status).toContain("h-6");
    expect(status).toContain("rounded-full");
    expect(status).toContain("bg-success-tint");
    expect(status).toContain("text-success-ink");
    expect(badgeVariants({ variant: "status", tone: "paused" })).toContain("bg-warn-tint");
    expect(badgeVariants({ variant: "status", tone: "paused" })).toContain("text-warn-ink");
    expect(badgeVariants({ variant: "status", tone: "fulfilled" })).toContain("bg-info-tint");
    expect(badgeVariants({ variant: "status", tone: "fulfilled" })).toContain("text-info-ink");
    expect(badgeVariants({ variant: "status", tone: "hidden" })).toContain("bg-muted-tint");
    expect(badgeVariants({ variant: "status", tone: "hidden" })).toContain("text-zinc-600");

    expect(badgeVariants({ variant: "status-dot", tone: "open" })).toContain("bg-success");
    expect(badgeVariants({ variant: "status-dot", tone: "paused" })).toContain("bg-point");
    expect(badgeVariants({ variant: "status-dot", tone: "fulfilled" })).toContain("bg-info");
    expect(badgeVariants({ variant: "status-dot", tone: "hidden" })).toContain("bg-zinc-400");
    expect(badgeVariants({ variant: "status-dot", tone: "open" })).not.toContain("h-6");

    const count = badgeVariants({ variant: "count" });
    expect(count).toContain("h-4.5");
    expect(count).toContain("bg-point");
    expect(count).toContain("text-white");
    expect(count).not.toContain("rounded-4xl");
  });

  test("defines the notice alert without the shadcn chrome", () => {
    expect(alertSource).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(alertSource).toContain('role="alert"');

    const notice = alertVariants({ variant: "notice" });
    expect(notice).toBe("border-2 border-point bg-warn-tint text-warn-ink");
    expect(notice).not.toContain("rounded-lg");
    expect(notice).not.toContain("px-2.5");

    const fallback = alertVariants({ variant: "default" });
    expect(fallback).toContain("rounded-lg");
    expect(fallback).toContain("bg-card");
    expect(fallback).not.toContain("bg-warn-tint");
  });

  test("renames pill classes and keeps the mono header exception", () => {
    expect(themeCss).toContain(".theme-pill {");
    expect(themeCss).toContain(".theme-pill-alt {");
    expect(themeCss).toContain("background: var(--pill-bg);");
    expect(themeCss).toContain("color: var(--pill-color);");
    expect(themeCss).toContain("background: var(--pill-alt-bg);");
    expect(themeCss).toContain(
      '.pub-page[data-theme="mono_bw"] .pub-header .theme-pill {',
    );
    expect(themeCss).not.toContain(".pub-pill");
    expect(globalsCss).not.toContain("--gift-soft-bg");
    expect(themeCss).toContain("--gift-soft-bg: #ffe1ec;");
    expect(themeCss).toContain("--gift-soft-ink: #bd6595;");
    expect(themeCss.indexOf("--gift-soft-bg")).toBeGreaterThan(themeCss.indexOf('data-theme="soft_pastel"'));
    expect(themeCss.indexOf("--gift-soft-bg")).toBeLessThan(themeCss.indexOf("body:has"));
  });

  test("moves former pill and status hex onto tokens", () => {
    const files = [
      "components/public-wishlist-view.tsx",
      "components/public-account-section.tsx",
      "components/public-wishlist-toast-events.tsx",
      "app/wishlist/[slug]/error.tsx",
      "app/wishlist/[slug]/not-found.tsx",
      "app/admin/messages/page.tsx",
      "app/admin/admin-shell-nav.tsx",
      "app/login/page.tsx",
      "app/onboarding/page.tsx",
      "app/onboarding/birthday-picker.tsx",
      "app/page.tsx",
      "app/admin/birthday-confetti.tsx",
      "components/text-logo.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source, file).not.toContain("pub-pill");
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }

    expect(read("components/public-wishlist-view.tsx")).toContain('variant="theme"');
    expect(read("components/public-wishlist-view.tsx")).toContain('variant="theme-alt"');
    expect(read("components/public-wishlist-view.tsx")).toContain("border-(--ink)");
    expect(read("components/public-wishlist-view.tsx")).toContain("text-(--ink)");
    expect(read("components/public-wishlist-view.tsx")).toContain("bg-(--gift-soft-bg)");
    expect(read("components/public-wishlist-view.tsx")).toContain("text-(--gift-soft-ink)");
    expect(read("components/public-wishlist-view.tsx")).toContain("border-ink bg-point");
    expect(read("components/public-wishlist-view.tsx")).not.toContain("border-ink text-(--ink)");
    expect(read("app/login/page.tsx")).toContain('variant="notice"');
    expect(read("app/onboarding/page.tsx")).toContain('variant="notice"');
    expect(read("app/onboarding/page.tsx")).toContain("accent-ink-deep");
    expect(read("app/onboarding/birthday-picker.tsx")).toContain("text-warn-ink");
    expect(read("app/page.tsx")).toContain("var(--tint-mint)");
    expect(read("app/page.tsx")).toContain("var(--headline)");
    expect(read("app/page.tsx")).toContain("bg-track");
    expect(read("app/admin/birthday-confetti.tsx")).toContain("var(--confetti-violet)");
    expect(read("app/admin/birthday-confetti.tsx")).toContain("backgroundColor: piece.color");
    expect(read("components/text-logo.tsx")).toContain("text-purple");
  });

  test("leaves only the excluded hex colors in tsx", () => {
    const bracket = /\[#([0-9a-fA-F]{3,8})\]/g;
    const quoted = /["']#([0-9a-fA-F]{3,8})["']/g;
    const files = [
      ...sourceFiles(join(root, "app")),
      ...sourceFiles(join(root, "components")),
    ];

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const relative = file.slice(root.length + 1);
      const source = readFileSync(file, "utf8");
      const found = [
        ...source.matchAll(bracket),
        ...source.matchAll(quoted),
      ].map((match) => `#${match[1].toLowerCase()}`);
      const allowance = allowedHex.get(relative);

      if (allowance === "any") {
        expect(found.length, relative).toBeGreaterThan(0);
        continue;
      }

      const extras = found.filter((hex) => !allowance?.includes(hex));
      expect(extras, relative).toEqual([]);
    }
  });
});
