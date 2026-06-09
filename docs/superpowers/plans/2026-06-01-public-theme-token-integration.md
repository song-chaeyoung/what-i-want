# Public Theme Token Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status (2026-06-09):** 현재 구현 파일과 전역 점검 문서를 기준으로 완료 상태로 정리했습니다. 최신 검증 결과는 `docs/tasks/2026-06-09-global-project-task-check.md`를 기준으로 봅니다.

**Goal:** Apply the downloaded public wishlist design tokens to `/b/[slug]` without changing admin UI, database contracts, or public participation API behavior.

**Architecture:** Keep the existing server-rendered public page and form POST flow. Add a scoped global CSS token file for `.pub-*` classes, import it from `app/globals.css`, then replace public page hard-coded pixel classes with semantic token classes driven by `result.wishlist.themeId`.

**Tech Stack:** Next.js 16 App Router, React 19 server components, Tailwind CSS v4, Vitest file-contract tests.

---

### Task 1: Public Theme Contract Tests

**Files:**
- Create: `src/lib/design/public-theme-contract.test.ts`
- Read: `app/globals.css`
- Read: `app/b/[slug]/page.tsx`
- Read: `app/b/[slug]/not-found.tsx`
- Read: `src/lib/wishlist/theme.ts`

- [x] **Step 1: Write failing contract tests**

Create `src/lib/design/public-theme-contract.test.ts` with these assertions:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PUBLIC_THEME_IDS } from "@/src/lib/wishlist/theme";

const root = process.cwd();

describe("public wishlist theme token integration", () => {
  test("imports a scoped public theme stylesheet from globals", () => {
    const globals = readFileSync(join(root, "app/globals.css"), "utf8");

    expect(globals).toContain('@import "./public-themes.css";');
    expect(existsSync(join(root, "app/public-themes.css"))).toBe(true);
  });

  test("defines all public theme ids as data-theme token scopes", () => {
    const themes = readFileSync(join(root, "app/public-themes.css"), "utf8");

    for (const themeId of PUBLIC_THEME_IDS) {
      expect(themes).toContain(`[data-theme="${themeId}"]`);
    }

    expect(themes).toContain(".pub-page");
    expect(themes).toContain(".pub-card");
    expect(themes).toContain(".pub-btn");
    expect(themes).not.toContain("@import url(");
    expect(themes).toContain("var(--font-mona");
  });

  test("binds the public wishlist route to the persisted theme id", () => {
    const page = readFileSync(join(root, "app/b/[slug]/page.tsx"), "utf8");

    expect(page).toContain('className="pub-page min-h-dvh"');
    expect(page).toContain("data-theme={result.wishlist.themeId}");
    expect(page).not.toContain('className="pixel-dot-bg min-h-dvh text-[#171717]"');
  });

  test("keeps public participation as a server form post", () => {
    const page = readFileSync(join(root, "app/b/[slug]/page.tsx"), "utf8");

    expect(page).toContain('method="post"');
    expect(page).toContain("api/public/wishlists");
    expect(page).toContain('name="wishItemId"');
    expect(page).toContain('name="amount"');
    expect(page).toContain('name="senderName"');
    expect(page).toContain('name="body"');
    expect(page).not.toContain("preventDefault()");
    expect(page).not.toContain("window.open");
  });

  test("uses public theme classes for the not-found screen", () => {
    const notFound = readFileSync(join(root, "app/b/[slug]/not-found.tsx"), "utf8");

    expect(notFound).toContain("pub-page");
    expect(notFound).toContain("pub-card");
    expect(notFound).not.toContain("pixel-dot-bg");
  });
});
```

- [x] **Step 2: Verify the new tests fail before implementation**

Run: `corepack pnpm test src/lib/design/public-theme-contract.test.ts`

Expected: FAIL because `app/public-themes.css` does not exist and `/b/[slug]` still uses `pixel-dot-bg`.

---

### Task 2: Scoped Theme CSS

**Files:**
- Create: `app/public-themes.css`
- Modify: `app/globals.css`
- Test: `src/lib/design/public-theme-contract.test.ts`

- [x] **Step 1: Add token stylesheet**

Create `app/public-themes.css` by adapting the downloaded `themes.css` tokens. Keep the `.pub-*` contract, include `pixel_y2k`, `mono_bw`, and `soft_pastel`, and do not add CDN font imports. Use the existing local font variable for pixel text:

```css
--pub-headline-font: var(--font-mona, Arial, Helvetica, sans-serif);
--pub-label-font: var(--font-mona, Arial, Helvetica, sans-serif);
--pub-pill-font: var(--font-mona, Arial, Helvetica, sans-serif);
--pub-btn-font: var(--font-mona, Arial, Helvetica, sans-serif);
```

For non-pixel themes use:

```css
--pub-headline-font: var(--font-sans, Arial, Helvetica, sans-serif);
--pub-label-font: var(--font-sans, Arial, Helvetica, sans-serif);
--pub-pill-font: var(--font-sans, Arial, Helvetica, sans-serif);
--pub-btn-font: var(--font-sans, Arial, Helvetica, sans-serif);
```

- [x] **Step 2: Import the stylesheet**

Modify `app/globals.css` immediately after `@import "tailwindcss";`:

```css
@import "tailwindcss";
@import "./public-themes.css";
```

- [x] **Step 3: Verify stylesheet contract**

Run: `corepack pnpm test src/lib/design/public-theme-contract.test.ts`

Expected: still FAIL on page binding assertions until Task 3 is complete.

---

### Task 3: Public Page Theme Binding

**Files:**
- Modify: `app/b/[slug]/page.tsx`
- Modify: `app/b/[slug]/not-found.tsx`
- Test: `src/lib/design/public-theme-contract.test.ts`

- [x] **Step 1: Bind the public page root to theme id**

Change the main element in `app/b/[slug]/page.tsx` from the current fixed pixel background to:

```tsx
<main className="pub-page min-h-dvh" data-theme={result.wishlist.themeId}>
```

- [x] **Step 2: Replace public visual surfaces with token classes**

Update only public visual classes in `app/b/[slug]/page.tsx`. Keep existing data loading, form action, field names, and `Link`/`a` behavior. Use these semantic mappings:

```text
pixel-board / pixel-card -> pub-card
sticker-label -> pub-pill
progress track -> pub-progress
button/link surfaces -> pub-btn plus pub-btn-primary or pub-btn-accent
input/textarea/select -> pub-field
gift fallback -> pub-fallback
```

- [x] **Step 3: Theme the not-found screen**

Change `app/b/[slug]/not-found.tsx` to use `pub-page`, `pub-card`, `pub-pill`, and `pub-btn` instead of the fixed pixel classes. Use the default `pixel_y2k` fallback by omitting `data-theme`.

- [x] **Step 4: Verify contract test passes**

Run: `corepack pnpm test src/lib/design/public-theme-contract.test.ts`

Expected: PASS.

---

### Task 4: Full Verification

**Files:**
- Read changed files only.

- [x] **Step 1: Run design and theme tests**

Run: `corepack pnpm test src/lib/design/font-contract.test.ts src/lib/design/public-theme-contract.test.ts src/lib/wishlist/theme.test.ts`

Expected: PASS.

- [x] **Step 2: Run typecheck**

Run: `corepack pnpm typecheck`

Expected: PASS.

- [x] **Step 3: Run build**

Run: `corepack pnpm build`

Expected: PASS, or report the exact build failure if environment variables/database access block the build.

- [x] **Step 4: Review diff**

Run: `git diff -- app/globals.css app/public-themes.css app/b/[slug]/page.tsx app/b/[slug]/not-found.tsx src/lib/design/public-theme-contract.test.ts`

Expected: Diff is limited to public theme CSS, public wishlist UI class changes, not-found UI class changes, and the contract test.
