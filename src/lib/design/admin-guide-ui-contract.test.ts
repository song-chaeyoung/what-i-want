import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const visualPath = join(root, "app/admin/admin-guide-visual.tsx");
const dialogPath = join(root, "app/admin/admin-guide-dialog.tsx");
const layoutPath = join(root, "app/admin/layout.tsx");
const navPath = join(root, "app/admin/admin-shell-nav.tsx");

function readSource(path: string): string {
  return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

describe("admin guide UI contract", () => {
  test("renders three inert UI vignettes without image assets", () => {
    expect(existsSync(visualPath)).toBe(true);
    const source = readSource(visualPath);

    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("select-none");
    expect(source).toContain("wishlistSlug");
    expect(source).toContain("data-theme={themeId}");
    expect(source).toContain("정보 불러오기");
    expect(source).toContain("링크 복사");
    expect(source).not.toMatch(/<(button|input|a)\b/);
    expect(source).not.toContain("next/image");
  });

  test("uses a three-step Radix dialog with accessible completion controls", () => {
    expect(existsSync(dialogPath)).toBe(true);
    const source = readSource(dialogPath);

    expect(source).toMatch(/^"use client";/);
    expect(source).toContain('import { Dialog as DialogPrimitive } from "radix-ui";');
    expect(source).toContain("<DialogPrimitive.Title");
    expect(source).toContain("<DialogPrimitive.Description");
    expect(source).toMatch(
      /<p\s+className="sr-only"\s+role="status"\s+aria-live="polite"\s+aria-atomic="true"\s*>[\s\S]*?<\/p>\s*<div\s+key=\{step\}/,
    );
    expect(source).not.toMatch(
      /<div\s+key=\{step\}[^>]*aria-live=/s,
    );
    expect(source).toContain("01 / 03");
    expect(source).toContain("02 / 03");
    expect(source).toContain("03 / 03");
    expect(source).toContain("갖고 싶은 선물을 담아요");
    expect(source).toContain("친구에게 보일 페이지를 확인해요");
    expect(source).toContain("링크를 보내고 마음을 기다려요");
    expect(source).toContain("관리 화면 먼저 둘러보기");
    expect(source).toContain("첫 선물 담기");
    expect(source).toContain(
      'import { requestAdminGuideCompletion } from "./admin-guide-request";',
    );
    expect(source).toContain("await requestAdminGuideCompletion()");
    expect(source).toContain(
      'router.push("/admin/wishes?create=1#create-wish")',
    );
    expect(source).toContain('nextParams.delete("guide")');
    expect(source).toContain("onPointerDownOutside={(event) => event.preventDefault()}");
    expect(source).toContain("onEscapeKeyDown={handleEscapeKeyDown}");
    expect(source).toContain("motion-reduce:animate-none");
  });

  test("mounts automatic guide state in the shared admin layout", () => {
    const source = readSource(layoutPath);

    expect(source).toContain(
      'import { AdminGuideDialog } from "./admin-guide-dialog";',
    );
    expect(source).toContain("state.guideCompletedAt === null");
    expect(source).toContain("wishlistSlug={state.wishlistSlug}");
    expect(source).toContain("themeId={state.wishlistThemeId}");
  });

  test("adds a reusable guide entry to both admin nav variants", () => {
    const source = readSource(navPath);

    expect(source).toContain(
      'import { usePathname, useSearchParams } from "next/navigation";',
    );
    expect(source).toContain("function AdminGuideLink");
    expect(source).toContain('nextParams.set("guide", "1")');
    expect(source).toContain("사용 가이드");
    expect(source).toContain('<AdminGuideLink variant="desktop" />');
    expect(source).toContain('<AdminGuideLink variant="mobile" />');
    expect(source).toContain("scroll={false}");
  });

  test("opens the native gift form when the guide requests creation", () => {
    const source = readSource(join(root, "app/admin/wishes/page.tsx"));

    expect(source).toContain("create?: string;");
    expect(source).toContain('const shouldOpenCreate = params.create === "1"');
    expect(source).toContain("open={shouldOpenCreate}");
  });
});
