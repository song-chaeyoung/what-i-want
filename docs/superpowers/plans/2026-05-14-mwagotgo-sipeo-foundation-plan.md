# 뭐갖고싶어 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 루트 Next.js 앱 구조를 유지하면서 Auth.js Google/Kakao 로그인, Postgres/Drizzle schema, 도메인 계층, 온보딩 흐름의 기반을 구축합니다.

**Architecture:** 배포 단위와 Git 저장소는 현재 Next.js repo 하나로 유지합니다. 코드 내부에서만 `server/domain`, `server/application`, `server/db`, `features`, `components`로 책임을 분리합니다. UI는 DB 클라이언트를 직접 호출하지 않고 Server Action 또는 Route Handler에서 application service를 호출합니다.

**Tech Stack:** Next.js App Router, TypeScript, Auth.js, Google OAuth, Kakao OAuth, Drizzle ORM, Postgres, Vitest.

---

## Scope Check

이 계획은 foundation만 구현합니다.

포함 범위:

- 현재 루트 Next.js 앱 구조 유지
- Next.js 16.2.6 관련 로컬 문서 확인
- `server/domain` 핵심 타입과 검증 함수
- `server/application` 온보딩 유스케이스
- `server/db` Drizzle schema와 repository 구현
- Auth.js Google/Kakao 설정
- 신규 로그인 사용자의 `/onboarding` 이동 기반
- 온보딩 완료 후 기본 wishlist 생성
- `/admin` 보호 라우트 기반
- root 단위 테스트, 타입 체크, 빌드 검증

별도 계획으로 분리할 범위:

- 어드민 대시보드 상세 UI
- 선물 CRUD
- 메시지함
- 공개 위시리스트 `/b/[slug]`
- 공개 페이지 테마 시스템
- 개인별 OG 이미지
- 계좌 암호화와 공개 방식 UI
- 별도 API 서버 repo
- 모바일 앱 repo

분리 근거: 인증, DB, 온보딩은 모든 후속 기능의 전제입니다. 이 기반이 먼저 안정되어야 어드민과 공개 페이지를 테스트 가능한 단위로 구현할 수 있습니다. 반대로 monorepo 전환은 초기 배포 난이도를 높이므로 1차 범위에서 제외합니다.

## Repository Policy

- 이 저장소는 웹 서비스를 담당하는 단일 Next.js repo입니다.
- `apps/`, `packages/`, workspace package alias를 만들지 않습니다.
- `pnpm-workspace.yaml`은 workspace package 선언 파일로 확장하지 않습니다. 현재 pnpm 설정이 필요하면 유지하되, `packages:` 항목은 추가하지 않습니다.
- 나중에 API 서버가 필요하면 이 repo 안의 `apps/api`가 아니라 새 Git repo를 만듭니다.
- 나중에 모바일 앱이 필요하면 새 Git repo를 만듭니다.
- 공통 로직 공유가 필요해지면 그 시점에 private package, npm package, 또는 명시적 복사 전략을 별도로 결정합니다.

## File Structure

생성 또는 정리할 구조:

```text
app/
  api/auth/[...nextauth]/route.ts
  auth/after-login/route.ts
  login/actions.ts
  login/page.tsx
  onboarding/actions.ts
  onboarding/page.tsx
  admin/layout.tsx
  admin/page.tsx
  layout.tsx
  page.tsx

components/
  ui/
  layout/

features/
  landing/
  auth/
  onboarding/
  admin/

server/
  auth/
    require-user.ts
  application/
    onboarding/
      errors.ts
      onboarding-service.ts
      onboarding-service.test.ts
    ports/
      onboarding-repository.ts
  db/
    client.ts
    schema/
      auth.ts
      service.ts
      index.ts
    repositories/
      onboarding-repository.ts
  domain/
    wishlist/
      slug.ts
      slug.test.ts
      theme.ts
      theme.test.ts
    wish-item/
      status.ts
      status.test.ts

auth.ts
auth.d.ts
drizzle.config.ts
.env.example
vitest.config.ts
```

파일 책임:

- `app`: Next.js 라우팅, Server Action 연결, redirect, 화면 진입점.
- `components`: 여러 feature에서 재사용하는 표현 컴포넌트.
- `features`: 특정 화면이나 기능 단위의 UI 조합.
- `server/domain`: DB와 프레임워크를 모르는 순수 타입, 상태값, 검증 함수.
- `server/application`: 유스케이스와 권한 흐름. DB 구현을 직접 모릅니다.
- `server/db`: Drizzle schema, 실제 Postgres repository 구현.
- `server/auth`: 인증된 사용자 요구사항과 route guard helper.
- `auth.ts`: Auth.js가 요구하는 Next.js 통합 진입점.

## Task 1: Root Project Baseline

**Files:**

- Modify: `package.json`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `drizzle.config.ts`
- Keep: `pnpm-workspace.yaml`

- [ ] **Step 1: Read local Next.js docs before code edits**

Read the relevant guides under:

```text
node_modules/next/dist/docs/
```

Required topics:

- App Router route handlers
- Server Actions
- middleware, if route protection requires it
- metadata and Open Graph image conventions, before OG work starts

Reason: this project uses Next.js 16.2.6. Local docs are the source of truth for breaking changes.

- [ ] **Step 2: Add root scripts and dependencies**

Update root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push"
  }
}
```

Add dependencies at the root package level:

```text
next-auth
@auth/drizzle-adapter
drizzle-orm
postgres
```

Add dev dependencies at the root package level:

```text
drizzle-kit
vitest
```

- [ ] **Step 3: Add environment example**

Create `.env.example`:

```dotenv
AUTH_SECRET="replace-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

AUTH_KAKAO_ID=""
AUTH_KAKAO_SECRET=""

DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/mwagotgo"
```

- [ ] **Step 4: Add root config files**

Create `vitest.config.ts` for Node-based server tests.

Create `drizzle.config.ts` that points at:

```text
./server/db/schema/index.ts
```

Migration output should be:

```text
./server/db/migrations
```

- [ ] **Step 5: Verify baseline**

Run:

```powershell
corepack pnpm install
corepack pnpm typecheck
corepack pnpm lint
```

Expected: commands finish with exit code 0 after dependency installation and any required lint fixes.

## Task 2: Domain Layer

**Files:**

- Create: `server/domain/wishlist/slug.ts`
- Create: `server/domain/wishlist/slug.test.ts`
- Create: `server/domain/wishlist/theme.ts`
- Create: `server/domain/wishlist/theme.test.ts`
- Create: `server/domain/wish-item/status.ts`
- Create: `server/domain/wish-item/status.test.ts`

- [ ] **Step 1: Add slug tests first**

Cover:

- uppercase and surrounding space normalization
- lowercase letters, numbers, and hyphens accepted
- underscores rejected
- shorter than 3 characters rejected
- longer than 32 characters rejected

- [ ] **Step 2: Implement slug utilities**

Rules:

```text
allowed: a-z, 0-9, hyphen
minimum length: 3
maximum length: 32
normalization: trim and lowercase
```

- [ ] **Step 3: Add public theme tests and implementation**

Initial theme ids:

```text
pixel_y2k
mono_bw
soft_pastel
```

Default:

```text
pixel_y2k
```

- [ ] **Step 4: Add wish status tests and implementation**

Status type:

```ts
type WishStatus = "open" | "fulfilled" | "hidden" | "paused";
```

Rules:

- `fulfilled` is complete.
- progress `>= 100` is complete.
- labels are `모으는 중`, `완료`, `숨김`, `일시중지`.

- [ ] **Step 5: Verify domain tests**

Run:

```powershell
corepack pnpm test
corepack pnpm typecheck
```

Expected: domain tests pass and TypeScript exits 0.

## Task 3: Database Schema

**Files:**

- Create: `server/db/client.ts`
- Create: `server/db/schema/auth.ts`
- Create: `server/db/schema/service.ts`
- Create: `server/db/schema/index.ts`

- [ ] **Step 1: Add Drizzle client**

`server/db/client.ts` creates a Postgres client from `DATABASE_URL` and exports the Drizzle database instance.

- [ ] **Step 2: Add Auth.js schema**

Create Auth.js-compatible tables:

- `users`
- `accounts`
- `sessions`
- `verification_tokens`
- `authenticators`, if required by the selected Auth.js adapter version

- [ ] **Step 3: Add service schema**

Create service tables:

- `profiles`
- `wishlists`
- `wish_items`
- `bank_accounts`
- `messages`
- `funding_logs`

Schema rules:

- `users.id` is the internal UUID primary key.
- `wishlists.slug` is unique but not a primary key.
- `profiles.user_id` references `users.id`.
- public theme defaults to `pixel_y2k`.
- account visibility modes are `always_visible`, `reveal_on_click`, `copy_only`, `hidden`.
- wish statuses are `open`, `fulfilled`, `hidden`, `paused`.

- [ ] **Step 4: Generate migration**

Run:

```powershell
corepack pnpm db:generate
```

Expected: SQL migration files are created under `server/db/migrations`.

- [ ] **Step 5: Verify DB typing**

Run:

```powershell
corepack pnpm typecheck
```

Expected: TypeScript exits 0.

## Task 4: Application Onboarding Service

**Files:**

- Create: `server/application/ports/onboarding-repository.ts`
- Create: `server/application/onboarding/errors.ts`
- Create: `server/application/onboarding/onboarding-service.ts`
- Create: `server/application/onboarding/onboarding-service.test.ts`

- [ ] **Step 1: Write onboarding service tests**

Cover:

- display name is required.
- slug is normalized and validated.
- duplicate slug returns a domain-specific error.
- birthday date may be null.
- onboarding creates profile and default wishlist through the repository interface.

- [ ] **Step 2: Add repository port**

The application service depends on an interface, not Drizzle:

```text
hasCompletedOnboarding(userId)
isWishlistSlugAvailable(slug)
completeOnboarding(record)
```

- [ ] **Step 3: Implement onboarding service**

Rules:

- application service imports domain utilities from `server/domain`.
- application service does not import `server/db`.
- default wishlist title is derived from the display name.
- default theme is `pixel_y2k`.
- default visibility is `public`.

- [ ] **Step 4: Verify application tests**

Run:

```powershell
corepack pnpm test
corepack pnpm typecheck
```

Expected: onboarding tests pass and TypeScript exits 0.

## Task 5: Drizzle Repository

**Files:**

- Create: `server/db/repositories/onboarding-repository.ts`

- [ ] **Step 1: Implement onboarding repository**

The repository implements the onboarding port from `server/application`.

Rules:

- `hasCompletedOnboarding` checks `profiles.onboarding_completed_at`.
- `isWishlistSlugAvailable` checks `wishlists.slug`.
- `completeOnboarding` inserts or updates `profiles` and creates the default `wishlists` row in a transaction.

- [ ] **Step 2: Verify repository typing**

Run:

```powershell
corepack pnpm typecheck
```

Expected: TypeScript exits 0.

## Task 6: Web Shell

**Files:**

- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/login/page.tsx`
- Create or modify: `app/globals.css`

- [ ] **Step 1: Set service metadata**

Set Korean language and metadata:

```text
title: 뭐갖고싶어
description: 받고 싶은 선물을 링크 하나로 공유하세요.
```

- [ ] **Step 2: Replace default landing page**

Replace the create-next-app placeholder with a simple service landing page:

```text
생일축하해.
뭐 갖고 싶어?
```

Include a CTA to `/login`.

- [ ] **Step 3: Add basic login page shell**

Create `/login` with Google and Kakao login entry points. Auth actions are added in Task 7.

- [ ] **Step 4: Verify web shell**

Run:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

Expected: all commands exit 0.

## Task 7: Auth.js Google and Kakao Login

**Files:**

- Create: `auth.ts`
- Create: `auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/login/actions.ts`
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Configure Auth.js**

Use:

- Drizzle adapter
- Google provider
- Kakao provider
- database session strategy, unless the current Auth.js adapter guidance recommends otherwise
- custom sign-in page at `/login`

- [ ] **Step 2: Add session type augmentation**

Session user must include:

```text
id
name
email
image
```

- [ ] **Step 3: Add login server actions**

Create actions:

```text
signInWithGoogle
signInWithKakao
```

Both redirect to:

```text
/auth/after-login
```

- [ ] **Step 4: Verify Auth.js integration**

Run:

```powershell
corepack pnpm typecheck
corepack pnpm build
```

Expected: commands exit 0 with required environment variables present.

## Task 8: Onboarding Redirect and Admin Guard

**Files:**

- Create: `server/auth/require-user.ts`
- Create: `server/application/onboarding/get-onboarding-state.ts` or `server/db/repositories/onboarding-state.ts`
- Create: `app/auth/after-login/route.ts`
- Create: `app/onboarding/actions.ts`
- Create: `app/onboarding/page.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Add authenticated user helper**

`requireUser` checks the Auth.js session and redirects unauthenticated users to `/login`.

- [ ] **Step 2: Add onboarding state lookup**

The lookup returns:

```text
isComplete
wishlistSlug
```

- [ ] **Step 3: Add post-login redirect route**

Rules:

- no session -> `/login`
- session but onboarding incomplete -> `/onboarding`
- onboarding complete -> `/admin`

- [ ] **Step 4: Add onboarding action and page**

Fields:

- display name
- slug
- birthday date
- description

The action calls the application onboarding service through the Drizzle repository implementation.

- [ ] **Step 5: Add admin guard**

`/admin` requires login and completed onboarding.

- [ ] **Step 6: Verify route flow typing**

Run:

```powershell
corepack pnpm typecheck
corepack pnpm build
```

Expected: commands exit 0 with required environment variables present.

## Task 9: Foundation Verification

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update setup instructions**

Document:

```powershell
corepack pnpm install
Copy-Item .env.example .env.local
corepack pnpm db:generate
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Mention that `.env.local` must include:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_KAKAO_ID`
- `AUTH_KAKAO_SECRET`

- [ ] **Step 2: Run all foundation checks**

Run:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Expected:

- lint exits 0.
- typecheck exits 0.
- domain and application tests pass.
- build exits 0 when required environment variables are present.

- [ ] **Step 3: Verify migration output**

Run:

```powershell
corepack pnpm db:generate
```

Expected: either no schema changes or migration files under `server/db/migrations`.

## Plan Self-Review

Spec coverage:

- 단일 Next.js repo: Task 1, Task 6.
- Postgres/Drizzle schema: Task 3.
- Auth.js Google/Kakao: Task 7.
- OAuth 계정과 공개 프로필 분리: Task 3, Task 4.
- 신규 사용자 온보딩: Task 4, Task 5, Task 8.
- 기본 공개 테마 `pixel_y2k`: Task 2, Task 3, Task 4.
- 친구 방문자 비로그인 원칙: 이 foundation 계획에서는 공개 페이지를 만들지 않으므로 코드 작업 범위 밖입니다. 공개 페이지 계획에서 로그인 없는 message flow를 구현합니다.

Placeholder scan:

- 이 계획은 monorepo, workspace package, `apps/`, `packages/` 구조를 전제로 하지 않습니다.
- 모든 작업은 생성/수정할 파일 경로와 검증 명령을 포함합니다.

Type consistency:

- 도메인 유틸은 `server/domain`에서 import합니다.
- application service는 `server/db`를 import하지 않습니다.
- DB repository만 Drizzle client를 압니다.
- Next.js route와 Server Action은 application service를 통해 DB 동작을 수행합니다.
