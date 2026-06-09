# Public Participation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status (2026-06-09):** 현재 구현 파일과 전역 점검 문서를 기준으로 완료 상태로 정리했습니다. 최신 검증 결과는 `docs/tasks/2026-06-09-global-project-task-check.md`를 기준으로 봅니다.

**Goal:** 공개 위시리스트 방문자가 선물에 이름, 메시지, 금액을 남기면 메시지와 금액 로그가 저장되고 관리자에서 확인할 수 있게 합니다.

**Architecture:** HTTP 진입점은 `app/api/**/route.ts`에 둡니다. 도메인 검증과 repository port는 `src/lib/public-participation/**`, 관리자 메시지 조회는 `src/lib/admin-messages/**`에 둡니다. 기존 DB schema의 `messages`, `funding_logs`, `wish_items.funded_amount`를 사용하며 `server/**`는 만들지 않습니다.

**Tech Stack:** Next.js App Router Route Handlers, React Server Components, Drizzle ORM, Vitest.

---

### Task 1: Public Participation Domain

**Files:**
- Create: `src/lib/public-participation/types.ts`
- Create: `src/lib/public-participation/service.ts`
- Create: `src/lib/public-participation/service.test.ts`

- [x] **Step 1: Write failing service tests**

Cover these behaviors:
- invalid slug returns `wishlist_not_found` without recording.
- sender name is optional and trimmed.
- message body is required and max 500 chars.
- amount must be a positive integer.
- wish item must belong to the public wishlist and must not be hidden.
- valid input calls repository once with normalized message and funding records.

Run: `corepack pnpm test src/lib/public-participation/service.test.ts`
Expected: FAIL because files/functions do not exist yet.

- [x] **Step 2: Implement service and port types**

Expose `submitPublicParticipation(input, repository)` with a result union:
- `ok: true`
- errors: `wishlist_not_found`, `wish_not_found`, `message_required`, `message_too_long`, `invalid_amount`.

- [x] **Step 3: Verify service tests**

Run: `corepack pnpm test src/lib/public-participation/service.test.ts`
Expected: PASS.

### Task 2: Drizzle Persistence And Public API

**Files:**
- Create: `src/lib/public-participation/repository.ts`
- Create: `app/api/public/wishlists/[slug]/participation/route.ts`

- [x] **Step 1: Add Drizzle repository**

Implement a transaction that inserts `messages`, inserts `funding_logs`, and increments `wish_items.fundedAmount`.

- [x] **Step 2: Add Route Handler**

Accept JSON and HTML form submissions. JSON returns status codes, form submissions redirect back to `/b/[slug]?sent=1` or `/b/[slug]?error=<code>`.

- [x] **Step 3: Verify route compiles**

Run: `corepack pnpm typecheck`
Expected: PASS.

### Task 3: Public Page Form

**Files:**
- Modify: `app/b/[slug]/page.tsx`
- Modify: `src/lib/design/copy.ts`
- Modify: `src/lib/design/copy.test.ts`

- [x] **Step 1: Add public form copy tests**

Extend copy tests with send form labels and success/error copy.

- [x] **Step 2: Render participation form**

Add a compact form under the public wishlist summary. The form posts to `/api/public/wishlists/{slug}/participation`, includes sender name, wish item select, amount, and message.

- [x] **Step 3: Verify copy and page compile**

Run: `corepack pnpm test src/lib/design/copy.test.ts`
Expected: PASS.

### Task 4: Admin Messages

**Files:**
- Create: `src/lib/admin-messages/types.ts`
- Create: `src/lib/admin-messages/service.ts`
- Create: `src/lib/admin-messages/service.test.ts`
- Create: `src/lib/admin-messages/repository.ts`
- Create: `app/admin/messages/page.tsx`
- Modify: `app/admin/layout.tsx`

- [x] **Step 1: Write failing admin message service tests**

Cover owner-scoped message listing and empty state.

- [x] **Step 2: Implement service and Drizzle repository**

List messages by owner wishlist, including optional wish title and funding amount.

- [x] **Step 3: Add admin page and nav link**

Render newest messages first with sender, body, wish title, amount, and created date.

### Task 5: Verification

Run:
- `corepack pnpm test`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm build` with local dummy env values
- `git diff --check`

Expected: all commands exit 0.
