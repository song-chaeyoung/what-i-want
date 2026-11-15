import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Input, inputVariants } from "@/components/ui/input";
import { Textarea, textareaVariants } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const root = process.cwd();

const adminInput =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
const adminTextarea =
  "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
const onboardingInput =
  "h-11 w-full rounded-md border border-line px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
const onboardingTextarea =
  "w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
const themeInput = "theme-field h-10 w-full px-3 text-sm font-bold outline-none";
const themeTextarea = "theme-field w-full resize-none px-3 py-2 text-sm font-bold outline-none";

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

    if (/\.(tsx|ts|css|md)$/.test(entry) && !entry.endsWith(".test.ts")) {
      files.push(path);
    }
  }

  return files;
}

describe("input variant contract", () => {
  test("keeps the shadcn default and the exact previous field classes", () => {
    expect(inputVariants({ variant: "default" })).toContain("h-8");
    expect(inputVariants({ variant: "default" })).toContain("focus-visible:ring-3");
    expect(inputVariants({ variant: "default" })).toContain("disabled:opacity-50");
    expect(textareaVariants({ variant: "default" })).toContain("field-sizing-content");
    expect(textareaVariants({ variant: "default" })).toContain("min-h-16");

    expect(inputVariants({ variant: "admin" })).toBe(adminInput);
    expect(textareaVariants({ variant: "admin" })).toBe(adminTextarea);
    expect(inputVariants({ variant: "onboarding" })).toBe(onboardingInput);
    expect(textareaVariants({ variant: "onboarding" })).toBe(onboardingTextarea);
    expect(inputVariants({ variant: "theme" })).toBe(themeInput);
    expect(textareaVariants({ variant: "theme" })).toBe(themeTextarea);

    for (const classes of [
      adminInput,
      adminTextarea,
      onboardingInput,
      onboardingTextarea,
      themeInput,
      themeTextarea,
    ]) {
      expect(cn(classes)).toBe(classes);
      expect(classes).not.toContain("focus-visible");
      expect(classes).not.toContain("disabled:");
      expect(classes).not.toContain("field-sizing-content");
    }

    expect(onboardingInput).not.toContain("bg-");
    expect(onboardingTextarea).not.toContain("bg-");
    expect(themeInput).not.toContain("pub-");
    expect(read("components/ui/input.tsx")).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(read("components/ui/textarea.tsx")).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  test("renders migrated controls with those classes", () => {
    const input = renderToStaticMarkup(
      createElement(Input, { variant: "admin", placeholder: "이름" }),
    );
    const textarea = renderToStaticMarkup(
      createElement(Textarea, { variant: "onboarding", rows: 4 }),
    );
    const theme = renderToStaticMarkup(
      createElement(Input, { variant: "theme", type: "number" }),
    );

    expect(input).toContain(`class="${adminInput}"`);
    expect(input).toContain('data-variant="admin"');
    expect(input).not.toContain(" variant=");
    expect(textarea).toContain(`class="${onboardingTextarea}"`);
    expect(textarea).toContain('data-variant="onboarding"');
    expect(theme).toContain(`class="${themeInput}"`);
    expect(theme).toContain('type="number"');
  });

  test("moves field usages onto variants and the three surface tokens", () => {
    const wishes = read("app/admin/wishes/page.tsx");
    const settings = read("app/admin/settings/page.tsx");
    const account = read("app/admin/settings/account-visibility-field.tsx");
    const onboarding = read("app/onboarding/page.tsx");
    const publicView = read("components/public-wishlist-view.tsx");
    const guide = read("app/admin/admin-guide-visual.tsx");
    const globals = read("app/globals.css");

    expect(wishes).toContain('variant="admin"');
    expect(wishes).toContain('inputVariants({ variant: "admin" })');
    expect(wishes).toContain("bg-placeholder-bg");
    expect(settings).toContain("bg-addon-bg");
    expect(settings).toContain(
      'className="h-10 w-full bg-white px-3 text-sm text-zinc-800 outline-none"',
    );
    expect(account).toContain('inputVariants({ variant: "admin" })');
    expect(onboarding).toContain('variant="onboarding"');
    expect(publicView).toContain('variant="theme"');
    expect(guide).toContain("bg-mock-field-bg");

    for (const declaration of [
      "--addon-bg: #f9fafb;",
      "--placeholder-bg: #f4f4f3;",
      "--mock-field-bg: #fafafa;",
      "--color-addon-bg: var(--addon-bg);",
      "--color-placeholder-bg: var(--placeholder-bg);",
      "--color-mock-field-bg: var(--mock-field-bg);",
    ]) {
      expect(globals, declaration).toContain(declaration);
    }

    const removedField = ".pub-" + "field";
    const dirs = ["app", "components", "src", "docs/design"].map((dir) => join(root, dir));

    for (const file of dirs.flatMap(sourceFiles)) {
      const source = readFileSync(file, "utf8");
      const relative = file.slice(root.length + 1);
      expect(source, relative).not.toContain(removedField);
      expect(source, relative).not.toContain("adminInputClassName");
      expect(source, relative).not.toContain("adminTextareaClassName");
    }
  });
});
