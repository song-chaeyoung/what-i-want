# 뭐갖고싶어 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** 현재 루트 Next.js 앱 구조를 유지하면서 Auth.js Google/Kakao 로그인, Postgres/Drizzle schema, 도메인 규칙, 온보딩 흐름의 기반을 구축합니다.

**Architecture:** 배포 단위와 Git 저장소는 현재 Next.js repo 하나로 유지합니다. 코드 구조는 참고 repo `song-chaeyoung/birthday-wishlist`의 패턴을 따릅니다. 화면은 `app/**`, HTTP 진입점은 `app/api/**`, 재사용 로직과 DB 접근은 `src/lib/**`에 둡니다. `server/**`, `apps/**`, `packages/**` 구조는 만들지 않습니다.

## Repository Policy

- 이 저장소는 웹 서비스를 담당하는 단일 Next.js repo입니다.
- `apps/`, `packages/`, workspace package alias를 만들지 않습니다.
- `server/` 폴더를 만들지 않습니다.
- Route Handler API는 `app/api/**/route.ts`에 둡니다.
- 공통 로직, 도메인 규칙, DB 접근, auth helper는 `src/lib/**`에 둡니다.
- 나중에 API 서버나 모바일 앱이 필요하면 이 repo 하위 앱이 아니라 새 Git repo를 만듭니다.

## File Structure

```text
app/
  api/
    auth/[...nextauth]/route.ts
    onboarding/route.ts
  auth/after-login/route.ts
  login/actions.ts
  login/page.tsx
  onboarding/page.tsx
  admin/layout.tsx
  admin/page.tsx
  layout.tsx
  page.tsx

src/
  lib/
    auth/require-user.ts
    db/
      client.ts
      schema/
        auth.ts
        service.ts
        index.ts
      migrations/
    onboarding/
      errors.ts
      repository.ts
      service.ts
      service.test.ts
      types.ts
    wish-item/
      status.ts
      status.test.ts
    wishlist/
      slug.ts
      slug.test.ts
      theme.ts
      theme.test.ts

auth.ts
auth.d.ts
drizzle.config.ts
.env.example
vitest.config.ts
```

## Tasks

1. Read local Next.js 16 docs under `node_modules/next/dist/docs/` before code edits.
2. Add root scripts and dependencies: Auth.js, Drizzle, Postgres, Vitest.
3. Add `.env.example`, `vitest.config.ts`, and `drizzle.config.ts`.
4. Implement wishlist slug/theme and wish item status rules in `src/lib/**` with tests.
5. Implement Drizzle schema and client in `src/lib/db/**`.
6. Generate migrations under `src/lib/db/migrations`.
7. Implement onboarding logic in `src/lib/onboarding/**`.
8. Expose onboarding mutation through `app/api/onboarding/route.ts`.
9. Configure Auth.js route through `app/api/auth/[...nextauth]/route.ts`.
10. Add login, onboarding, and admin shell pages.
11. Update README setup instructions.
12. Verify with:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm db:generate
```

## Notes

- `app/api/**` is the API boundary.
- `src/lib/**` is the shared implementation boundary.
- UI must not import Drizzle schema/client directly unless it is a server-only route/page guard. Mutations should go through `app/api/**` or narrowly scoped Auth.js Server Actions when required by Auth.js.
