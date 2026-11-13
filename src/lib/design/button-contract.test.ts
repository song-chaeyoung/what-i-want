import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { buttonVariants } from "@/components/ui/button";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const buttonSource = read("components/ui/button.tsx");
const globalsCss = read("app/globals.css");
const themeCss = read("app/public-themes.css");

describe("button variant contract", () => {
  test("keeps shadcn calendar variants and unifies disabled opacity at 60", () => {
    expect(buttonSource).toContain("disabled:opacity-60");
    expect(buttonSource).not.toContain("disabled:opacity-50");

    for (const variant of ["default", "outline", "secondary", "ghost", "destructive"] as const) {
      const classes = buttonVariants({ variant });
      expect(classes, variant).toContain("focus-visible:ring-3");
      expect(classes, variant).toContain("active:not-aria-[haspopup]:translate-y-px");
      expect(classes, variant).toContain("disabled:opacity-60");
    }

    expect(buttonVariants({ variant: "outline" })).toContain("border-border");
    expect(buttonVariants({ variant: "ghost", size: "icon" })).toContain("size-8");
  });

  test("defines app button variants without hex colors", () => {
    expect(buttonSource).not.toMatch(/#[0-9a-fA-F]{3,8}/);

    const cta = buttonVariants({ variant: "cta", size: "none" });
    expect(cta).toContain("bg-ink-deep");
    expect(cta).toContain("border-line-strong");
    expect(cta).toContain("hover:bg-accent-main");
    expect(cta).not.toContain("h-8");

    expect(buttonVariants({ variant: "admin" })).toContain("bg-ink");
    expect(buttonVariants({ variant: "admin" })).toContain("hover:bg-black");
    expect(buttonVariants({ variant: "admin-outline", size: "icon-admin" })).toContain("size-9");
    expect(buttonVariants({ variant: "danger" })).toContain("text-danger");
    expect(buttonVariants({ variant: "danger" })).toContain("hover:bg-danger-tint");
    expect(buttonVariants({ variant: "subtle" })).toContain("text-xs");
    expect(buttonVariants({ variant: "kakao" })).toContain("bg-kakao");
    expect(buttonVariants({ variant: "kakao" })).toContain("hover:bg-kakao-hover");
    expect(buttonVariants({ variant: "link" })).toContain("hover:text-ink");
    expect(buttonVariants({ variant: "link" })).toContain("hover:underline");

    const theme = buttonVariants({ variant: "theme", size: "none" });
    expect(theme).toContain("theme-btn");
    expect(buttonVariants({ variant: "theme-primary", size: "none" })).toContain(
      "theme-btn-primary",
    );
    expect(buttonVariants({ variant: "theme-accent", size: "block" })).toContain("w-full");
    expect(theme).not.toContain("focus-visible:ring-3");
    expect(theme).not.toContain("translate-y-px");
    expect(buttonSource).toContain("selfSizedVariants");
  });

  test("keeps theme button rules on the public theme stylesheet", () => {
    expect(themeCss).toContain("font-family: var(--btn-font);");
    expect(themeCss).toContain("padding: var(--btn-pad);");
    expect(themeCss).toContain("transform: translate(3px, 3px);");
    expect(themeCss).toContain(
      '.theme-btn:not(.theme-btn-primary):not(.theme-btn-accent)',
    );
    expect(themeCss).not.toContain(".pub-btn");
  });

  test("registers button color tokens in :root and @theme inline", () => {
    for (const declaration of [
      "--ink-deep: #111827;",
      "--danger: #b91c1c;",
      "--danger-tint: #fef2f2;",
      "--kakao: #fee500;",
      "--kakao-hover: #f6dc00;",
      "--color-ink-deep: var(--ink-deep);",
      "--color-danger: var(--danger);",
      "--color-danger-tint: var(--danger-tint);",
      "--color-kakao: var(--kakao);",
      "--color-kakao-hover: var(--kakao-hover);",
      "--color-line-strong: var(--line-strong);",
      "--color-accent-main: var(--accent-main);",
    ]) {
      expect(globalsCss, declaration).toContain(declaration);
    }
  });

  test("moves former hard-coded button colors onto variants", () => {
    const files = [
      "app/page.tsx",
      "app/onboarding/page.tsx",
      "app/not-found.tsx",
      "app/error.tsx",
      "app/login/page.tsx",
      "app/admin/wishes/page.tsx",
      "app/admin/settings/reset-wishlist-form.tsx",
      "app/admin/messages/page.tsx",
      "app/admin/messages/hide-message-form.tsx",
      "app/admin/share-public-link-button.tsx",
      "app/admin/wishes/link-autofill-button.tsx",
      "app/admin/admin-guide-dialog.tsx",
      "components/public-wishlist-view.tsx",
      "components/public-share-button.tsx",
      "components/copy-account-number-button.tsx",
      "components/public-participation-submit-button.tsx",
      "components/public-wishlist-toast-events.tsx",
      "app/wishlist/[slug]/error.tsx",
      "app/wishlist/[slug]/not-found.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source, file).toContain('from "@/components/ui/button"');
      expect(source, file).not.toContain("pub-btn");
      for (const legacy of [
        "bg-[#111827]",
        "bg-[#fee500]",
        "hover:bg-[#f6dc00]",
        "hover:bg-[#f3f4f6]",
        "hover:bg-[#0f766e]",
        "border-[#b91c1c]",
        "text-[#b91c1c]",
        "hover:bg-[#fef2f2]",
        "hover:bg-[#ccfbf1]",
      ]) {
        expect(source, `${file} ${legacy}`).not.toContain(legacy);
      }
    }

    expect(read("app/page.tsx")).toContain('variant="cta"');
    expect(read("app/page.tsx")).toContain("hover:bg-mint");
    expect(read("app/onboarding/page.tsx")).toContain("h-12 w-full px-4 py-0");
    expect(read("app/login/page.tsx")).toContain("hover:bg-zinc-100");
    expect(read("app/login/page.tsx")).toContain('variant="kakao"');
    expect(read("app/admin/wishes/link-autofill-button.tsx")).toContain("h-10");
    expect(read("app/admin/wishes/link-autofill-button.tsx")).toContain("text-zinc-700");
    expect(read("app/admin/admin-ui.tsx")).not.toContain("ButtonClassName");
  });
});
