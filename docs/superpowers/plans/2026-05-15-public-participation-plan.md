# Public Participation Implementation Plan

> **문서 역할 — 당시 실행 계획 기록 (코드 대조: 2026-10-30):** 아래 체크박스와 POST 폼 구상은 최초 구현 이력입니다. 현재 작업 목록으로 재실행하지 않습니다. 현재 공개 UI는 [공개 화면](../../../components/public-wishlist-view.tsx)의 Server Action 폼이며, [액션](../../../app/wishlist/[slug]/actions.ts)과 [API](../../../app/api/public/wishlists/[slug]/participation/route.ts)가 [공통 서비스](../../../src/lib/public-participation/service.ts)를 호출합니다. 이번 대조에서는 테스트를 실행하지 않았습니다.

> **과거 상태 (2026-06-09):** 당시 구현 파일과 [전역 점검 기록](../../tasks/2026-06-09-global-project-task-check.md)을 기준으로 완료 상태로 정리했습니다. 해당 문서의 검증 결과는 2026-06-09의 이력이며 현재 테스트 통과를 의미하지 않습니다.

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

Accept JSON and HTML form submissions. JSON returns status codes, form submissions redirect back to `/wishlist/[slug]?sent=1` or `/wishlist/[slug]?error=<code>`.

- [x] **Step 3: Verify route compiles**

Run: `corepack pnpm typecheck`
Expected: PASS.

### Task 3: Public Page Form

**Files:**
- Modify: `app/wishlist/[slug]/page.tsx`
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
