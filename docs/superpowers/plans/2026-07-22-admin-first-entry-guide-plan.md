# Admin First-Entry Guide Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **⚠️ 업데이트 (2026-07-24) — as-built:** 이 계획의 원래 설계는 완료 상태를 `profiles` DB 컬럼 + 마이그레이션 + `POST /api/admin/onboarding-guide/complete` Route Handler에 저장하는 방식이었습니다. 구현 검토 결과 이 값은 다른 기능과 무관한 순수 UI 상태여서 **브라우저 localStorage**로 전환했습니다. 최종 구현은 다음과 같습니다.
>
> - 완료 상태: `app/admin/admin-guide-storage.ts`의 `hasSeenAdminGuide` / `markAdminGuideSeen` (localStorage 키 `mwagotgo:admin-guide-seen`)
> - 첫 진입 자동 노출: 다이얼로그가 `useSyncExternalStore`로 localStorage를 하이드레이션 안전하게 읽어 결정
> - 첫 선물 담기 이동: `/admin/wishes#create-wish` (앵커만; `?create=1` 쿼리와 위시 페이지 변경 없음)
> - DB 컬럼·마이그레이션·API 라우트·`completeAdminGuide` 서비스/리포지토리·완료 요청 모듈·관련 계약 테스트는 최종 구현에 없습니다.
>
> 따라서 아래 **File Structure**와 **Task 1·2**(DB·마이그레이션·서비스·API), **Task 3**의 `admin-guide-request` 모듈, **Task 5·6**의 완료 API 호출·`create=1` 부분은 최초 계획 기록으로만 보존합니다. 최종 동작은 설계 문서(`../specs/2026-07-22-admin-first-entry-guide-design.md`)를 기준으로 하세요.

**Goal:** 기본 온보딩 이후 최초 어드민 진입 시 3단계 가이드 모달을 노출하고, 완료 상태를 브라우저(localStorage)에 저장하며, 어드민 메뉴에서 언제든 다시 열 수 있게 합니다.

**Architecture:** 서버 어드민 레이아웃이 위시리스트 맥락(slug·theme)을 조회해 Radix 기반 클라이언트 모달에 전달하고, 완료 상태는 브라우저 localStorage(`admin-guide-storage.ts`)에 저장합니다. 첫 진입 자동 노출은 `useSyncExternalStore`로 하이드레이션 안전하게 판별합니다. 단계 이동·스와이프·`guide` 쿼리 전이는 순수 상태 함수로 분리하고, 비네트는 네트워크나 실제 폼 동작이 없는 presentational component로 유지합니다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Radix Dialog via `radix-ui` 1.4.3, Drizzle ORM 0.45.2, PostgreSQL, Vitest 4.1.6, pnpm

## Global Constraints

- 패키지 매니저는 pnpm만 사용합니다.
- 새 이미지, 사진, AI 생성 이미지, 모달 라이브러리, 애니메이션 라이브러리를 추가하지 않습니다.
- 가이드 완료 상태는 브라우저 localStorage(`mwagotgo:admin-guide-seen`)에 저장합니다. 서버·DB·API를 사용하지 않습니다.
- 기기·브라우저 단위 저장이므로 다른 기기에서는 한 번 더 자동 노출될 수 있고, `사용 가이드` 메뉴가 항상 재접근 경로입니다.
- 기본 온보딩을 완료한 신규 사용자는 해당 브라우저 첫 어드민 진입에서 자동 모달을 봅니다.
- 모달은 3단계이며 새로 열 때마다 1단계부터 시작합니다. 단계 위치는 저장하지 않습니다.
- Primary CTA는 마지막 단계의 `첫 선물 담기`이며 `/admin/wishes#create-wish`로 이동합니다.
- `관리 화면 먼저 둘러보기`, 닫기 버튼, Escape는 완료 저장 후 현재 화면을 유지합니다.
- 배경 오버레이 클릭은 모달을 닫지 않습니다.
- `사용 가이드` 메뉴는 현재 경로와 검색 파라미터를 보존하며 `guide=1`만 추가합니다.
- 비네트는 `aria-hidden`, `pointer-events-none`, `select-none`으로 비작동 장식 처리합니다.
- 모션은 150-200ms의 `transform`과 `opacity`만 사용하고 reduced motion에서는 제거합니다.
- Vitest/Vite 검증에는 Node `^20.19.0 || >=22.12.0`이 필요합니다. 현재 기본 Node `v20.15.0`에서 테스트가 시작되지 않으면 호환 Node 런타임을 선택한 뒤 같은 pnpm 명령을 실행합니다.

---

## ⛔ 부록: 원본 실행 계획 (폐기 · 실행 금지 · 참고용)

> **이 지점 아래 전체(File Structure 및 Task 1~7)는 폐기된 원본 계획입니다.** 완료 상태를 `profiles` DB 컬럼·마이그레이션·완료 API로 저장하는 방식으로 설계되었고, 이미 구현된 뒤 localStorage 방식으로 전환되었습니다. **아래 체크리스트를 실행하지 마세요** — 제거된 스키마·마이그레이션(0008)·`onboarding-guide/complete` 라우트·`completeAdminGuide` 서비스/리포지토리·`create=1` 흐름이 되살아납니다. 최종 구현과 동작은 상단 요약과 설계 문서(`../specs/2026-07-22-admin-first-entry-guide-design.md`)를 기준으로 하며, 아래는 히스토리 참고용으로만 보존합니다.

## File Structure

- Modify `src/lib/db/schema/service.ts`: 프로필 가이드 완료 timestamp를 선언합니다.
- Modify `src/lib/db/schema/service.test.ts`: Drizzle 컬럼 이름과 nullable 계약을 검증합니다.
- Create `src/lib/db/migrations/0008_admin_onboarding_guide.sql`: 컬럼 추가와 기존 사용자 백필 SQL을 담습니다.
- Create `src/lib/db/migrations/meta/0008_snapshot.json`: Drizzle Kit이 생성한 schema snapshot입니다.
- Modify `src/lib/db/migrations/meta/_journal.json`: 0008 마이그레이션을 등록합니다.
- Modify `src/lib/onboarding/types.ts`: 조회 상태와 저장 port를 확장합니다.
- Modify `src/lib/onboarding/repository.ts`: 가이드 상태·테마 조회와 idempotent 완료 저장을 구현합니다.
- Modify `src/lib/onboarding/service.ts`: 기본 온보딩 완료 사용자만 가이드를 완료하게 합니다.
- Modify `src/lib/onboarding/service.test.ts`: 완료 저장과 미완료 차단을 단위 테스트합니다.
- Create `src/lib/onboarding/admin-guide-persistence-contract.test.ts`: schema, migration, 조회 계약을 검증합니다.
- Create `app/api/admin/onboarding-guide/complete/route.ts`: 인증된 완료 저장 JSON API를 제공합니다.
- Create `src/lib/onboarding/admin-guide-route-contract.test.ts`: Route Handler의 인증·상태 코드 계약을 검증합니다.
- Create `app/admin/admin-guide-state.ts`: 이전·다음·스와이프 순수 상태 전이를 제공합니다.
- Create `src/lib/admin-guide/admin-guide-state.test.ts`: 상태 경계와 48px 스와이프 임계값을 검증합니다.
- Create `app/admin/admin-guide-request.ts`: 완료 API 응답을 UI가 다룰 수 있는 상태로 변환합니다.
- Create `src/lib/admin-guide/admin-guide-request.test.ts`: 200·401·500·네트워크 오류 매핑을 검증합니다.
- Create `app/admin/admin-guide-visual.tsx`: 3종 비작동 UI 비네트를 렌더링합니다.
- Create `app/admin/admin-guide-dialog.tsx`: Radix Dialog, 단계 상태, 완료 요청, 접근성을 담당합니다.
- Modify `app/admin/layout.tsx`: 서버 상태를 모달에 전달하고 최초 자동 노출을 결정합니다.
- Modify `app/admin/admin-shell-nav.tsx`: 데스크톱·모바일 `사용 가이드` 메뉴를 추가합니다.
- Modify `app/admin/wishes/page.tsx`: `create=1` 요청에서 선물 추가 패널을 확실히 펼칩니다.
- Create `src/lib/design/admin-guide-ui-contract.test.ts`: 모달·비네트·레이아웃·메뉴의 통합 UI 계약을 검증합니다.
- Modify `src/lib/design/admin-theme-contract.test.ts`: 새 메뉴 아이콘과 어드민 테마 보존을 검증합니다.

---

### Task 1: 가이드 완료 상태 컬럼과 안전한 기존 사용자 백필

**Files:**
- Modify: `src/lib/db/schema/service.ts:38-58`
- Modify: `src/lib/db/schema/service.test.ts:1-18`
- Create: `src/lib/db/migrations/0008_admin_onboarding_guide.sql`
- Create: `src/lib/db/migrations/meta/0008_snapshot.json`
- Modify: `src/lib/db/migrations/meta/_journal.json`
- Modify: `src/lib/onboarding/types.ts:16-25`
- Modify: `src/lib/onboarding/repository.ts:110-130`
- Create: `src/lib/onboarding/admin-guide-persistence-contract.test.ts`

**Interfaces:**
- Produces: `profiles.onboardingGuideCompletedAt: Date | null`
- Produces: `OnboardingState.guideCompletedAt: Date | null`
- Produces: `OnboardingState.wishlistThemeId: PublicThemeId | null`
- Preserves: 기존 `OnboardingState.isComplete`, `OnboardingState.wishlistSlug`

- [ ] **Step 1: Write the failing schema and persistence contract tests**

Extend `src/lib/db/schema/service.test.ts`:

```ts
import { getTableColumns } from "drizzle-orm";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { profiles, wishItems } from "./service";

describe("profiles schema", () => {
  test("stores the admin guide completion timestamp", () => {
    const columns = getTableColumns(profiles);

    expect(columns.onboardingGuideCompletedAt.name).toBe(
      "onboarding_guide_completed_at",
    );
    expect(columns.onboardingGuideCompletedAt.notNull).toBe(false);
  });
});
```

Create `src/lib/onboarding/admin-guide-persistence-contract.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const schemaPath = join(root, "src/lib/db/schema/service.ts");
const repositoryPath = join(root, "src/lib/onboarding/repository.ts");
const migrationPath = join(
  root,
  "src/lib/db/migrations/0008_admin_onboarding_guide.sql",
);

describe("admin guide persistence contract", () => {
  test("declares and selects the account-level guide state", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const repository = readFileSync(repositoryPath, "utf8");

    expect(schema).toContain(
      'onboardingGuideCompletedAt: timestamp("onboarding_guide_completed_at"',
    );
    expect(repository).toContain(
      "guideCompletedAt: profiles.onboardingGuideCompletedAt",
    );
    expect(repository).toContain("wishlistThemeId: wishlists.themeId");
  });

  test("backfills existing onboarded profiles without changing new defaults", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(
      'ADD COLUMN "onboarding_guide_completed_at" timestamp',
    );
    expect(migration).toContain(
      'SET "onboarding_guide_completed_at" = "onboarding_completed_at"',
    );
    expect(migration).toContain(
      'WHERE "onboarding_completed_at" IS NOT NULL',
    );
    expect(migration).not.toContain(
      '"onboarding_guide_completed_at" timestamp NOT NULL',
    );
  });
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

```bash
pnpm test -- src/lib/db/schema/service.test.ts src/lib/onboarding/admin-guide-persistence-contract.test.ts
```

Expected: FAIL because the schema field, migration, and extended repository selection do not exist.

- [ ] **Step 3: Add the schema field and extend the onboarding state type**

Add to `profiles` in `src/lib/db/schema/service.ts` immediately after `onboardingCompletedAt`:

```ts
  onboardingGuideCompletedAt: timestamp("onboarding_guide_completed_at", {
    mode: "date",
  }),
```

Replace `OnboardingState` in `src/lib/onboarding/types.ts` with:

```ts
export type OnboardingState = {
  isComplete: boolean;
  wishlistSlug: string | null;
  wishlistThemeId: PublicThemeId | null;
  guideCompletedAt: Date | null;
};
```

- [ ] **Step 4: Extend the server state query**

Update the selection and return value in `getOnboardingState` inside `src/lib/onboarding/repository.ts`:

```ts
    .select({
      completedAt: profiles.onboardingCompletedAt,
      guideCompletedAt: profiles.onboardingGuideCompletedAt,
      wishlistSlug: wishlists.slug,
      wishlistThemeId: wishlists.themeId,
    })
```

```ts
  return {
    isComplete: Boolean(state?.completedAt),
    wishlistSlug: state?.wishlistSlug ?? null,
    wishlistThemeId: state?.wishlistThemeId ?? null,
    guideCompletedAt: state?.guideCompletedAt ?? null,
  };
```

- [ ] **Step 5: Generate the named migration and add the rollout backfill**

```bash
pnpm db:generate --name admin_onboarding_guide
```

Expected: Drizzle creates:

```text
src/lib/db/migrations/0008_admin_onboarding_guide.sql
src/lib/db/migrations/meta/0008_snapshot.json
```

and appends `0008_admin_onboarding_guide` to `src/lib/db/migrations/meta/_journal.json`.

Append this exact statement to `src/lib/db/migrations/0008_admin_onboarding_guide.sql` after the generated `ALTER TABLE` statement:

```sql
UPDATE "profiles"
SET "onboarding_guide_completed_at" = "onboarding_completed_at"
WHERE "onboarding_completed_at" IS NOT NULL;
```

Do not add a database default. New profiles must keep the guide timestamp `NULL` until the user dismisses or completes the modal.

- [ ] **Step 6: Run focused tests and typecheck**

```bash
pnpm test -- src/lib/db/schema/service.test.ts src/lib/onboarding/admin-guide-persistence-contract.test.ts
pnpm typecheck
```

Expected: focused tests PASS and TypeScript exits `0`.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/lib/db/schema/service.ts src/lib/db/schema/service.test.ts src/lib/db/migrations/0008_admin_onboarding_guide.sql src/lib/db/migrations/meta/0008_snapshot.json src/lib/db/migrations/meta/_journal.json src/lib/onboarding/types.ts src/lib/onboarding/repository.ts src/lib/onboarding/admin-guide-persistence-contract.test.ts
git commit -m "feat: add admin guide completion state"
```

---

### Task 2: Idempotent 완료 서비스와 인증 API

**Files:**
- Modify: `src/lib/onboarding/types.ts:27-45`
- Modify: `src/lib/onboarding/repository.ts:1-90`
- Modify: `src/lib/onboarding/service.ts:1-65`
- Modify: `src/lib/onboarding/service.test.ts:1-40`
- Create: `app/api/admin/onboarding-guide/complete/route.ts`
- Create: `src/lib/onboarding/admin-guide-route-contract.test.ts`

**Interfaces:**
- Produces: `OnboardingRepository.completeAdminGuide(userId: string): Promise<void>`
- Produces: `completeAdminGuide(userId: string, repository: OnboardingRepository): Promise<CompleteAdminGuideResult>`
- Produces: `POST /api/admin/onboarding-guide/complete`
- Response: `200 { ok: true }`, `401 { error: "unauthorized" }`, `409 { error: "onboarding_incomplete" }`, `500 { error: "unexpected" }`

- [ ] **Step 1: Write failing service tests**

Update the import in `src/lib/onboarding/service.test.ts`:

```ts
import { completeAdminGuide, completeOnboarding } from "./service";
```

Add state to `FakeOnboardingRepository`:

```ts
  completedGuideUserIds: string[] = [];

  async completeAdminGuide(userId: string): Promise<void> {
    this.completedGuideUserIds.push(userId);
  }
```

Add tests:

```ts
describe("completeAdminGuide", () => {
  test("stores completion for an onboarded user", async () => {
    const repository = new FakeOnboardingRepository();
    repository.completed = true;

    await expect(completeAdminGuide("user-1", repository)).resolves.toEqual({
      ok: true,
    });
    expect(repository.completedGuideUserIds).toEqual(["user-1"]);
  });

  test("rejects users who have not completed base onboarding", async () => {
    const repository = new FakeOnboardingRepository();

    await expect(completeAdminGuide("user-1", repository)).resolves.toEqual({
      ok: false,
      error: "onboarding_incomplete",
    });
    expect(repository.completedGuideUserIds).toEqual([]);
  });
});
```

- [ ] **Step 2: Write the failing Route Handler contract test**

Create `src/lib/onboarding/admin-guide-route-contract.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const routePath = join(
  process.cwd(),
  "app/api/admin/onboarding-guide/complete/route.ts",
);

describe("admin guide completion route contract", () => {
  test("authenticates and maps completion results to JSON status codes", () => {
    expect(existsSync(routePath)).toBe(true);
    const source = readFileSync(routePath, "utf8");

    expect(source).toContain('import { auth } from "@/auth";');
    expect(source).toContain("completeAdminGuide(");
    expect(source).toContain("new DrizzleOnboardingRepository()");
    expect(source).toContain('{ error: "unauthorized" }');
    expect(source).toContain('{ status: 401 }');
    expect(source).toContain('{ error: result.error }');
    expect(source).toContain('{ status: 409 }');
    expect(source).toContain("NextResponse.json({ ok: true })");
    expect(source).toContain('{ error: "unexpected" }');
    expect(source).toContain('{ status: 500 }');
  });
});
```

- [ ] **Step 3: Run focused tests and verify the expected failure**

```bash
pnpm test -- src/lib/onboarding/service.test.ts src/lib/onboarding/admin-guide-route-contract.test.ts
```

Expected: FAIL because the repository port, service function, and route do not exist.

- [ ] **Step 4: Add the repository port and atomic idempotent update**

Add to `OnboardingRepository` in `src/lib/onboarding/types.ts`:

```ts
  completeAdminGuide(userId: string): Promise<void>;
```

Update the Drizzle import in `src/lib/onboarding/repository.ts`:

```ts
import { and, eq, isNotNull, isNull } from "drizzle-orm";
```

Add to `DrizzleOnboardingRepository`:

```ts
  async completeAdminGuide(userId: string): Promise<void> {
    const now = new Date();

    await this.database
      .update(profiles)
      .set({
        onboardingGuideCompletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(profiles.userId, userId),
          isNotNull(profiles.onboardingCompletedAt),
          isNull(profiles.onboardingGuideCompletedAt),
        ),
      );
  }
```

The `isNull` predicate preserves the first completion timestamp during repeated or concurrent requests.

- [ ] **Step 5: Add the domain service**

Add to `src/lib/onboarding/service.ts`:

```ts
export type CompleteAdminGuideResult =
  | { ok: true }
  | { ok: false; error: "onboarding_incomplete" };

export async function completeAdminGuide(
  userId: string,
  repository: OnboardingRepository,
): Promise<CompleteAdminGuideResult> {
  if (!(await repository.hasCompletedOnboarding(userId))) {
    return { ok: false, error: "onboarding_incomplete" };
  }

  await repository.completeAdminGuide(userId);
  return { ok: true };
}
```

- [ ] **Step 6: Implement the authenticated JSON Route Handler**

Create `app/api/admin/onboarding-guide/complete/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleOnboardingRepository } from "@/src/lib/onboarding/repository";
import { completeAdminGuide } from "@/src/lib/onboarding/service";

export async function POST(): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    const result = await completeAdminGuide(
      session.user.id,
      new DrizzleOnboardingRepository(),
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "unexpected" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 7: Run focused tests and typecheck**

```bash
pnpm test -- src/lib/onboarding/service.test.ts src/lib/onboarding/admin-guide-route-contract.test.ts
pnpm typecheck
```

Expected: focused tests PASS and TypeScript exits `0`.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/lib/onboarding/types.ts src/lib/onboarding/repository.ts src/lib/onboarding/service.ts src/lib/onboarding/service.test.ts app/api/admin/onboarding-guide/complete/route.ts src/lib/onboarding/admin-guide-route-contract.test.ts
git commit -m "feat: complete admin guide idempotently"
```

---

### Task 3: 단계·스와이프 상태와 완료 요청을 UI에서 분리

**Files:**
- Create: `app/admin/admin-guide-state.ts`
- Create: `src/lib/admin-guide/admin-guide-state.test.ts`
- Create: `app/admin/admin-guide-request.ts`
- Create: `src/lib/admin-guide/admin-guide-request.test.ts`

**Interfaces:**
- Produces: `AdminGuideStep = 0 | 1 | 2`
- Produces: `getNextAdminGuideStep(step): AdminGuideStep`
- Produces: `getPreviousAdminGuideStep(step): AdminGuideStep`
- Produces: `getAdminGuideStepAfterSwipe(step, deltaX): AdminGuideStep`
- Constant: `ADMIN_GUIDE_SWIPE_THRESHOLD = 48`
- Produces: `requestAdminGuideCompletion(fetcher?): Promise<"ok" | "unauthorized" | "error">`

- [ ] **Step 1: Write failing state transition tests**

Create `src/lib/admin-guide/admin-guide-state.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  getAdminGuideStepAfterSwipe,
  getNextAdminGuideStep,
  getPreviousAdminGuideStep,
} from "@/app/admin/admin-guide-state";

describe("admin guide step state", () => {
  test("moves forward without passing the final step", () => {
    expect(getNextAdminGuideStep(0)).toBe(1);
    expect(getNextAdminGuideStep(1)).toBe(2);
    expect(getNextAdminGuideStep(2)).toBe(2);
  });

  test("moves backward without passing the first step", () => {
    expect(getPreviousAdminGuideStep(2)).toBe(1);
    expect(getPreviousAdminGuideStep(1)).toBe(0);
    expect(getPreviousAdminGuideStep(0)).toBe(0);
  });

  test("requires a 48 pixel horizontal swipe", () => {
    expect(getAdminGuideStepAfterSwipe(1, -47)).toBe(1);
    expect(getAdminGuideStepAfterSwipe(1, 47)).toBe(1);
    expect(getAdminGuideStepAfterSwipe(1, -48)).toBe(2);
    expect(getAdminGuideStepAfterSwipe(1, 48)).toBe(0);
  });

  test("keeps swipe navigation inside the three-step range", () => {
    expect(getAdminGuideStepAfterSwipe(0, 100)).toBe(0);
    expect(getAdminGuideStepAfterSwipe(2, -100)).toBe(2);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

```bash
pnpm test -- src/lib/admin-guide/admin-guide-state.test.ts
```

Expected: FAIL because `admin-guide-state.ts` does not exist.

- [ ] **Step 3: Write failing completion-request tests**

Create `src/lib/admin-guide/admin-guide-request.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";
import { requestAdminGuideCompletion } from "@/app/admin/admin-guide-request";

describe("admin guide completion request", () => {
  test("maps a successful response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("ok");
    expect(fetcher).toHaveBeenCalledWith(
      "/api/admin/onboarding-guide/complete",
      { method: "POST" },
    );
  });

  test("distinguishes an expired session", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe(
      "unauthorized",
    );
  });

  test.each([409, 500])("maps HTTP %s to a retryable error", async (status) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("error");
  });

  test("maps a network rejection to a retryable error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("error");
  });
});
```

- [ ] **Step 4: Run both focused tests and verify the expected failures**

```bash
pnpm test -- src/lib/admin-guide/admin-guide-state.test.ts src/lib/admin-guide/admin-guide-request.test.ts
```

Expected: FAIL because both implementation modules do not exist.

- [ ] **Step 5: Implement the minimal state and request modules**

Create `app/admin/admin-guide-state.ts`:

```ts
export type AdminGuideStep = 0 | 1 | 2;

export const ADMIN_GUIDE_SWIPE_THRESHOLD = 48;

export function getNextAdminGuideStep(
  step: AdminGuideStep,
): AdminGuideStep {
  return step === 2 ? 2 : ((step + 1) as AdminGuideStep);
}

export function getPreviousAdminGuideStep(
  step: AdminGuideStep,
): AdminGuideStep {
  return step === 0 ? 0 : ((step - 1) as AdminGuideStep);
}

export function getAdminGuideStepAfterSwipe(
  step: AdminGuideStep,
  deltaX: number,
): AdminGuideStep {
  if (Math.abs(deltaX) < ADMIN_GUIDE_SWIPE_THRESHOLD) {
    return step;
  }

  return deltaX < 0
    ? getNextAdminGuideStep(step)
    : getPreviousAdminGuideStep(step);
}
```

Create `app/admin/admin-guide-request.ts`:

```ts
export type AdminGuideCompletionStatus = "ok" | "unauthorized" | "error";

type AdminGuideFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export async function requestAdminGuideCompletion(
  fetcher: AdminGuideFetcher = fetch,
): Promise<AdminGuideCompletionStatus> {
  try {
    const response = await fetcher(
      "/api/admin/onboarding-guide/complete",
      { method: "POST" },
    );

    if (response.status === 401) {
      return "unauthorized";
    }

    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
```

- [ ] **Step 6: Run the focused tests and typecheck**

```bash
pnpm test -- src/lib/admin-guide/admin-guide-state.test.ts src/lib/admin-guide/admin-guide-request.test.ts
pnpm typecheck
```

Expected: state and request tests PASS and TypeScript exits `0`.

- [ ] **Step 7: Commit Task 3**

```bash
git add app/admin/admin-guide-state.ts app/admin/admin-guide-request.ts src/lib/admin-guide/admin-guide-state.test.ts src/lib/admin-guide/admin-guide-request.test.ts
git commit -m "feat: add admin guide client logic"
```

---

### Task 4: 실제 스타일과 연결된 비작동 UI 비네트

**Files:**
- Create: `app/admin/admin-guide-visual.tsx`
- Create: `src/lib/design/admin-guide-ui-contract.test.ts`

**Interfaces:**
- Consumes: `step: AdminGuideStep`
- Consumes: `wishlistSlug: string`
- Consumes: `themeId: PublicThemeId`
- Produces: `AdminGuideVisual(props): ReactNode`

- [ ] **Step 1: Write the failing visual contract test**

Create `src/lib/design/admin-guide-ui-contract.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

```bash
pnpm test -- src/lib/design/admin-guide-ui-contract.test.ts
```

Expected: FAIL because `admin-guide-visual.tsx` does not exist.

- [ ] **Step 3: Implement the three visual variants**

Create `app/admin/admin-guide-visual.tsx`:

```tsx
import { Check, Gift, Heart, Link2 } from "lucide-react";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";
import type { AdminGuideStep } from "./admin-guide-state";

type AdminGuideVisualProps = {
  step: AdminGuideStep;
  wishlistSlug: string;
  themeId: PublicThemeId;
};

export function AdminGuideVisual({
  step,
  wishlistSlug,
  themeId,
}: AdminGuideVisualProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-[190px] select-none overflow-hidden rounded-md sm:h-[260px]"
    >
      {step === 0 ? <GiftFormVisual /> : null}
      {step === 1 ? <PublicPreviewVisual themeId={themeId} /> : null}
      {step === 2 ? <ShareVisual wishlistSlug={wishlistSlug} /> : null}
    </div>
  );
}

function GiftFormVisual() {
  return (
    <div className="grid h-full content-center gap-3 bg-[#ffe4e6] p-4 sm:p-7">
      <div className="rounded-md border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#111827]">
        <p className="text-[10px] font-bold text-zinc-500">상품 링크</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded border border-line bg-[#fafafa] px-2.5 py-2 text-[11px] font-semibold text-zinc-500">
            https://shop.example/gift
          </div>
          <div className="shrink-0 rounded border border-ink bg-yellow-200 px-2.5 py-2 text-[10px] font-black text-ink">
            정보 불러오기
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-md border-2 border-ink bg-paper p-3 shadow-[3px_3px_0_#111827]">
        <div className="grid size-12 shrink-0 place-items-center rounded border border-ink bg-mint sm:size-14">
          <Gift className="size-6 text-teal" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">무선 헤드폰</p>
          <p className="mt-1 text-xs font-bold text-purple">189,000원</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-teal">
          <Check className="size-3.5" />
          자동 입력
        </div>
      </div>
    </div>
  );
}

function PublicPreviewVisual({ themeId }: { themeId: PublicThemeId }) {
  return (
    <div
      className="pub-page grid h-full place-items-center overflow-hidden p-5 sm:p-8"
      data-theme={themeId}
    >
      <div className="pub-card w-full max-w-[430px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="pub-pill">NO. 1</span>
          <span className="pub-label">받고 싶은 선물</span>
        </div>
        <p className="mt-4 text-lg font-black text-[var(--pub-headline-color)] sm:text-xl">
          무선 헤드폰
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-base font-black text-[var(--pub-ink)]">
              63,000원
            </p>
            <p className="mt-1 text-[10px] font-bold text-[var(--pub-sub)]">
              189,000원 중
            </p>
          </div>
          <p className="text-xs font-black text-[var(--pub-accent)]">33%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-sm border border-[var(--pub-divider-color)] bg-white">
          <div className="h-full w-1/3 bg-[var(--pub-progress-fill)]" />
        </div>
      </div>
    </div>
  );
}

function ShareVisual({ wishlistSlug }: { wishlistSlug: string }) {
  return (
    <div className="grid h-full content-center gap-3 bg-[#fef3c7] p-4 sm:p-7">
      <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#111827]">
        <Link2 className="size-4 shrink-0 text-purple" />
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-600">
          /wishlist/{wishlistSlug}
        </p>
        <div className="flex shrink-0 items-center gap-1 rounded border border-ink bg-mint px-2.5 py-2 text-[10px] font-black text-teal">
          <Check className="size-3.5" />
          링크 복사
        </div>
      </div>
      <div className="ml-auto flex w-[85%] items-start gap-3 rounded-md border-2 border-ink bg-[#ffe4e6] p-3 shadow-[3px_3px_0_#111827]">
        <div className="grid size-9 shrink-0 place-items-center rounded border border-ink bg-white">
          <Heart className="size-4 fill-rose-400 text-rose-500" />
        </div>
        <div>
          <p className="text-xs font-black text-ink">새로운 마음이 도착했어요</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-600">
            생일 진심으로 축하해!
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the visual contract test and typecheck**

```bash
pnpm test -- src/lib/design/admin-guide-ui-contract.test.ts
pnpm typecheck
```

Expected: visual contract PASS and TypeScript exits `0`.

- [ ] **Step 5: Commit Task 4**

```bash
git add app/admin/admin-guide-visual.tsx src/lib/design/admin-guide-ui-contract.test.ts
git commit -m "feat: add admin guide UI vignettes"
```

---

### Task 5: Radix 3단계 스테퍼 모달

**Files:**
- Create: `app/admin/admin-guide-dialog.tsx`
- Modify: `src/lib/design/admin-guide-ui-contract.test.ts`

**Interfaces:**
- Consumes: `initialOpen: boolean`
- Consumes: `wishlistSlug: string`
- Consumes: `themeId: PublicThemeId`
- Calls: `POST /api/admin/onboarding-guide/complete`
- Navigates: `/admin/wishes?create=1#create-wish`
- Query behavior: removes only `guide` when dismissing a manually reopened guide

- [ ] **Step 1: Extend the failing UI contract test for the dialog**

Append to `src/lib/design/admin-guide-ui-contract.test.ts`:

```ts
  test("uses a three-step Radix dialog with accessible completion controls", () => {
    expect(existsSync(dialogPath)).toBe(true);
    const source = readSource(dialogPath);

    expect(source).toMatch(/^"use client";/);
    expect(source).toContain('import { Dialog as DialogPrimitive } from "radix-ui";');
    expect(source).toContain("<DialogPrimitive.Title");
    expect(source).toContain("<DialogPrimitive.Description");
    expect(source).toContain('aria-live="polite"');
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
    expect(source).toContain("nextParams.delete(\"guide\")");
    expect(source).toContain("onPointerDownOutside={(event) => event.preventDefault()}");
    expect(source).toContain("onEscapeKeyDown={handleEscapeKeyDown}");
    expect(source).toContain("motion-reduce:animate-none");
  });
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

```bash
pnpm test -- src/lib/design/admin-guide-ui-contract.test.ts
```

Expected: FAIL because `admin-guide-dialog.tsx` does not exist.

- [ ] **Step 3: Implement the complete dialog controller and UI**

Create `app/admin/admin-guide-dialog.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";
import {
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "./admin-ui";
import {
  getAdminGuideStepAfterSwipe,
  getNextAdminGuideStep,
  getPreviousAdminGuideStep,
  type AdminGuideStep,
} from "./admin-guide-state";
import { requestAdminGuideCompletion } from "./admin-guide-request";
import { AdminGuideVisual } from "./admin-guide-visual";

const guideSteps = [
  {
    progress: "01 / 03",
    title: "갖고 싶은 선물을 담아요",
    description:
      "선물 링크를 넣으면 이미지, 이름, 가격을 빠르게 채울 수 있어요.",
  },
  {
    progress: "02 / 03",
    title: "친구에게 보일 페이지를 확인해요",
    description:
      "등록한 선물이 친구들에게 어떻게 보이는지 미리 확인해보세요.",
  },
  {
    progress: "03 / 03",
    title: "링크를 보내고 마음을 기다려요",
    description:
      "위시리스트 링크를 공유하면 친구가 로그인 없이 마음을 보낼 수 있어요.",
  },
] as const;

type AdminGuideDialogProps = {
  initialOpen: boolean;
  wishlistSlug: string;
  themeId: PublicThemeId;
};

type CompletionIntent = "first-gift" | "dismiss";
type TransitionDirection = "next" | "previous";

export function AdminGuideDialog({
  initialOpen,
  wishlistSlug,
  themeId,
}: AdminGuideDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState<AdminGuideStep>(0);
  const [direction, setDirection] = useState<TransitionDirection>("next");
  const [saving, setSaving] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const guideRequested = searchParams.get("guide") === "1";
  const currentStep = guideSteps[step];

  useEffect(() => {
    if (!guideRequested) {
      return;
    }

    setStep(0);
    setDirection("next");
    setOpen(true);
  }, [guideRequested]);

  function goNext() {
    setDirection("next");
    setStep((current) => getNextAdminGuideStep(current));
  }

  function goPrevious() {
    setDirection("previous");
    setStep((current) => getPreviousAdminGuideStep(current));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX === null || endX === undefined) {
      return;
    }

    const deltaX = endX - startX;
    const nextStep = getAdminGuideStepAfterSwipe(step, deltaX);

    if (nextStep === step) {
      return;
    }

    setDirection(nextStep > step ? "next" : "previous");
    setStep(nextStep);
  }

  async function completeGuide(intent: CompletionIntent) {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const completionStatus = await requestAdminGuideCompletion();

      if (completionStatus === "unauthorized") {
        toast.error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }

      if (completionStatus === "error") {
        throw new Error("guide completion failed");
      }

      if (intent === "first-gift") {
        setOpen(false);
        router.push("/admin/wishes?create=1#create-wish");
        return;
      }

      setOpen(false);
      removeGuideQuery();
    } catch (error) {
      console.error(error);
      toast.error("안내 상태를 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  function removeGuideQuery() {
    if (!guideRequested) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("guide");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    void completeGuide("dismiss");
  }

  const motionClassName =
    direction === "next"
      ? "slide-in-from-right-2"
      : "slide-in-from-left-2";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-16px)] w-[calc(100%-16px)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-md border-2 border-ink bg-paper p-4 shadow-[7px_7px_0_#111827] outline-none sm:p-7"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={handleEscapeKeyDown}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            primaryActionRef.current?.focus();
          }}
        >
          <div className="flex items-start justify-between gap-4 pr-9">
            <div>
              <p className="text-xs font-black text-purple">
                {currentStep.progress}
              </p>
              <DialogPrimitive.Title className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                이제 위시리스트를 만들어볼까요?
              </DialogPrimitive.Title>
            </div>
            <button
              type="button"
              aria-label="안내 닫기"
              disabled={saving}
              onClick={() => void completeGuide("dismiss")}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-md border border-line bg-white text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:top-6 sm:right-6"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="touch-pan-y"
          >
            <div
              key={step}
              aria-live="polite"
              className={`animate-in fade-in ${motionClassName} duration-200 motion-reduce:animate-none`}
            >
              <AdminGuideVisual
                step={step}
                wishlistSlug={wishlistSlug}
                themeId={themeId}
              />
              <div className="mt-4">
                <h2 className="text-lg font-black text-ink sm:text-xl">
                  {currentStep.title}
                </h2>
                <DialogPrimitive.Description className="mt-2 text-sm font-medium leading-6 text-zinc-600">
                  {currentStep.description}
                </DialogPrimitive.Description>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            {guideSteps.map((guideStep, index) => (
              <span
                key={guideStep.progress}
                className={`h-2.5 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                  index === step ? "w-7 bg-purple" : "w-2.5 bg-zinc-300"
                }`}
              />
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={saving}
              onClick={() => void completeGuide("dismiss")}
              className="h-9 text-sm font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              관리 화면 먼저 둘러보기
            </button>

            <div className="flex justify-end gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={goPrevious}
                  className={adminSecondaryButtonClassName}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  이전
                </button>
              ) : null}

              {step < 2 ? (
                <button
                  ref={primaryActionRef}
                  type="button"
                  disabled={saving}
                  onClick={goNext}
                  className={adminPrimaryButtonClassName}
                >
                  다음
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              ) : (
                <button
                  ref={primaryActionRef}
                  type="button"
                  disabled={saving}
                  onClick={() => void completeGuide("first-gift")}
                  className={adminPrimaryButtonClassName}
                >
                  {saving ? "처리 중..." : "첫 선물 담기"}
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 4: Run focused tests, lint, and typecheck**

```bash
pnpm test -- src/lib/admin-guide/admin-guide-state.test.ts src/lib/admin-guide/admin-guide-request.test.ts src/lib/design/admin-guide-ui-contract.test.ts
pnpm lint -- app/admin/admin-guide-dialog.tsx app/admin/admin-guide-request.ts app/admin/admin-guide-visual.tsx
pnpm typecheck
```

Expected: focused tests PASS, ESLint exits `0`, and TypeScript exits `0`.

- [ ] **Step 5: Commit Task 5**

```bash
git add app/admin/admin-guide-dialog.tsx src/lib/design/admin-guide-ui-contract.test.ts
git commit -m "feat: add stepped admin guide dialog"
```

---

### Task 6: 어드민 최초 자동 노출과 사용 가이드 메뉴 연결

**Files:**
- Modify: `app/admin/layout.tsx:1-130`
- Modify: `app/admin/admin-shell-nav.tsx:1-135`
- Modify: `app/admin/wishes/page.tsx:18-65,142-155`
- Modify: `src/lib/design/admin-guide-ui-contract.test.ts`
- Modify: `src/lib/design/admin-theme-contract.test.ts:1-105`

**Interfaces:**
- Consumes: `OnboardingState.guideCompletedAt`
- Consumes: `OnboardingState.wishlistSlug`
- Consumes: `OnboardingState.wishlistThemeId`
- Produces: `AdminGuideDialog` mounted once per admin shell
- Produces: desktop and mobile `사용 가이드` links preserving current query state
- Produces: `create=1`에서 열린 `#create-wish` 등록 패널

- [ ] **Step 1: Extend the failing integration contract tests**

Append to `src/lib/design/admin-guide-ui-contract.test.ts`:

```ts
  test("mounts automatic guide state in the shared admin layout", () => {
    const source = readSource(layoutPath);

    expect(source).toContain('import { AdminGuideDialog } from "./admin-guide-dialog";');
    expect(source).toContain("state.guideCompletedAt === null");
    expect(source).toContain("wishlistSlug={state.wishlistSlug}");
    expect(source).toContain("themeId={state.wishlistThemeId}");
  });

  test("adds a reusable guide entry to both admin nav variants", () => {
    const source = readSource(navPath);

    expect(source).toContain('import { usePathname, useSearchParams } from "next/navigation";');
    expect(source).toContain("function AdminGuideLink");
    expect(source).toContain('nextParams.set("guide", "1")');
    expect(source).toContain("사용 가이드");
    expect(source).toContain('<AdminGuideLink variant="desktop" />');
    expect(source).toContain('<AdminGuideLink variant="mobile" />');
    expect(source).toContain("scroll={false}");
  });

  test("opens the native gift form when the guide requests creation", () => {
    const source = readSource(
      join(root, "app/admin/wishes/page.tsx"),
    );

    expect(source).toContain("create?: string;");
    expect(source).toContain('const shouldOpenCreate = params.create === "1"');
    expect(source).toContain("open={shouldOpenCreate}");
  });
```

Update the exact icon import assertion in `src/lib/design/admin-theme-contract.test.ts`:

```ts
    expect(navSource).toContain(
      'import { BookOpen, Gift, Inbox, LayoutDashboard, Settings } from "lucide-react";',
    );
    expect(navSource).toContain("icon: BookOpen");
```

- [ ] **Step 2: Run focused contracts and verify the expected failure**

```bash
pnpm test -- src/lib/design/admin-guide-ui-contract.test.ts src/lib/design/admin-theme-contract.test.ts
```

Expected: FAIL because the layout and navigation do not mount or open the guide.

- [ ] **Step 3: Mount the dialog from the server admin layout**

Add to `app/admin/layout.tsx`:

```ts
import { AdminGuideDialog } from "./admin-guide-dialog";
```

Inside `AdminShell`, after the base onboarding redirect and before returning the shell, derive:

```ts
  const guideContext =
    state.wishlistSlug && state.wishlistThemeId
      ? {
          wishlistSlug: state.wishlistSlug,
          themeId: state.wishlistThemeId,
        }
      : null;
```

Mount the dialog once inside the returned root shell, after `<AdminShellNav unreadMessageCount={unreadMessageCount} />`:

```tsx
        {guideContext ? (
          <AdminGuideDialog
            initialOpen={state.guideCompletedAt === null}
            wishlistSlug={guideContext.wishlistSlug}
            themeId={guideContext.themeId}
          />
        ) : null}
```

Do not redirect to a separate guide route. The existing `if (!state.isComplete) redirect("/onboarding")` remains the only base onboarding redirect.

- [ ] **Step 4: Add a query-preserving guide link to desktop and mobile navigation**

Update imports in `app/admin/admin-shell-nav.tsx`:

```ts
import { BookOpen, Gift, Inbox, LayoutDashboard, Settings } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
```

Render after the desktop `adminNavItems.map(...)` block:

```tsx
        <AdminGuideLink variant="desktop" />
```

Render after the mobile `adminNavItems.map(...)` block:

```tsx
        <AdminGuideLink variant="mobile" />
```

Add below `AdminShellNav`:

```tsx
function AdminGuideLink({ variant }: { variant: "mobile" | "desktop" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("guide", "1");
  const href = `${pathname}?${nextParams.toString()}`;

  if (variant === "desktop") {
    return (
      <Link
        href={href}
        scroll={false}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-zinc-600 transition-colors hover:bg-white/70 hover:text-ink"
      >
        <BookOpen aria-hidden="true" className="size-4 shrink-0" />
        사용 가이드
      </Link>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-0 py-2.5 text-[13px] font-semibold text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800"
    >
      <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
      사용 가이드
    </Link>
  );
}
```

- [ ] **Step 5: Make the first-gift destination open for new and existing lists**

Extend `AdminWishesPageProps` in `app/admin/wishes/page.tsx`:

```ts
type AdminWishesPageProps = {
  searchParams: Promise<{
    status?: string;
    create?: string;
  }>;
};
```

After the existing `if (!result.ok)` error guard, derive the open state:

```ts
  const shouldOpenCreate =
    params.create === "1" || (result.items.length === 0 && !selectedStatus);
```

Replace the existing `<details>` `open` prop:

```tsx
        open={shouldOpenCreate}
```

The query parameter opens the panel during server rendering, while `#create-wish` scrolls to the panel. This keeps the CTA correct when an existing user reopens the guide after already adding gifts.

- [ ] **Step 6: Run focused contracts and typecheck**

```bash
pnpm test -- src/lib/design/admin-guide-ui-contract.test.ts src/lib/design/admin-theme-contract.test.ts
pnpm typecheck
```

Expected: focused tests PASS and TypeScript exits `0`.

- [ ] **Step 7: Commit Task 6**

```bash
git add app/admin/layout.tsx app/admin/admin-shell-nav.tsx app/admin/wishes/page.tsx src/lib/design/admin-guide-ui-contract.test.ts src/lib/design/admin-theme-contract.test.ts
git commit -m "feat: show admin guide on first entry"
```

---

### Task 7: 전체 검증과 사용자 흐름 확인

**Files:**
- Verify only unless a test exposes a defect.

**Interfaces:**
- Verifies the complete flow across persistence, API, layout, dialog, navigation, and accessibility.

- [ ] **Step 1: Inspect the generated migration before applying it anywhere**

```bash
sed -n '1,120p' src/lib/db/migrations/0008_admin_onboarding_guide.sql
```

Expected output contains exactly one nullable column addition and this backfill intent:

```sql
UPDATE "profiles"
SET "onboarding_guide_completed_at" = "onboarding_completed_at"
WHERE "onboarding_completed_at" IS NOT NULL;
```

Do not run `pnpm db:migrate` against a shared or production database without separate deployment approval.

- [ ] **Step 2: Run the complete automated verification suite**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected:

- `pnpm typecheck`: exit `0`
- `pnpm lint`: exit `0`
- `pnpm test`: all tests PASS under Node `^20.19.0 || >=22.12.0`
- `pnpm build`: production build exits `0`

If the current Node `v20.15.0` still causes Vitest/Vite ESM configuration loading to fail, record that exact environment failure and rerun the same command under a compatible Node runtime before attributing it to the feature.

- [ ] **Step 3: Start the app and verify the first-entry path**

```bash
pnpm dev
```

Using a test account created after the migration, verify:

```text
1. Complete base onboarding.
2. Enter /admin and confirm step 01 / 03 opens automatically.
3. Confirm the background admin UI cannot receive focus or pointer input.
4. Move next, previous, and swipe across all three steps.
5. Confirm reduced-motion mode removes the slide transition.
6. Choose 첫 선물 담기 and confirm /admin/wishes?create=1#create-wish opens with the native details panel expanded.
7. Refresh and confirm the guide does not auto-open again.
8. Open 사용 가이드 from desktop and mobile navigation.
9. Confirm it restarts at step 01 / 03.
10. Close it and confirm any existing status/search query remains intact.
```

- [ ] **Step 4: Verify skip, close, Escape, and error behavior**

With fresh test accounts, independently verify:

```text
- 관리 화면 먼저 둘러보기 saves completion and keeps the current route.
- The X button saves completion and keeps the current route.
- Escape saves completion and keeps the current route.
- Overlay clicks do not dismiss the modal.
- In browser DevTools, switch Network to Offline before completing; the modal stays open and shows the retry toast.
- Restore Network to Online and confirm a retry completes normally.
```

The automated `admin-guide-request.test.ts` covers 401, 409, 500, and rejected-network response mapping; the Route Handler contract separately verifies the 401/409/500 server status mapping.

- [ ] **Step 5: Verify rollout behavior for existing users**

Against a disposable database snapshot containing a profile whose `onboarding_completed_at` predates migration 0008:

```text
1. Apply migration 0008 in the disposable environment.
2. Confirm onboarding_guide_completed_at equals onboarding_completed_at.
3. Sign in as that existing user.
4. Confirm the guide does not auto-open.
5. Confirm 사용 가이드 still opens it manually.
```

- [ ] **Step 6: Record final evidence**

Record in the handoff:

```text
- typecheck result
- lint result
- test result and Node version
- build result
- migration inspection result
- desktop and mobile manual-flow result
- any verification limitation that remains
```

No final success claim is allowed until the executed commands and manual checks support it.
