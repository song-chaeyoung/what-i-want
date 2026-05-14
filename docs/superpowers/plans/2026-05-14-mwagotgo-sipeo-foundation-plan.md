# 뭐갖고싶어 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 모듈러 모놀리스 기반으로 Auth.js Google/Kakao 로그인, Postgres/Drizzle schema, 도메인 계층, 온보딩 흐름의 기반을 구축합니다.

**Architecture:** 초기 배포 단위는 `web` 하나이지만, 도메인 정책은 `packages/domain`, 유스케이스는 `packages/application`, DB schema와 repository 구현은 `packages/db`로 분리합니다. UI는 DB 클라이언트를 직접 호출하지 않고 Server Action 또는 Route Handler에서 application service를 호출합니다.

**Tech Stack:** Next.js App Router, TypeScript, pnpm workspace, Auth.js, Google OAuth, Kakao OAuth, Drizzle ORM, Postgres, Vitest.

---

## Scope Check

이 계획은 foundation만 구현합니다.

포함 범위:

- pnpm workspace 구조
- `web` Next.js 앱 골격
- `packages/domain` 핵심 타입과 검증 함수
- `packages/application` 온보딩 유스케이스
- `packages/db` Drizzle schema와 repository 구현
- Auth.js Google/Kakao 설정
- 신규 로그인 사용자의 `/onboarding` 이동 기반
- 온보딩 완료 후 기본 wishlist 생성
- `/admin` 보호 라우트 기반

별도 계획으로 분리할 범위:

- 어드민 대시보드 상세 UI
- 선물 CRUD
- 메시지함
- 공개 위시리스트 `/b/[slug]`
- 공개 페이지 테마 시스템
- 개인별 OG 이미지
- 계좌 암호화와 공개 방식 UI

분리 근거: 인증, DB, 온보딩은 모든 후속 기능의 전제입니다. 이 기반이 먼저 안정되어야 어드민과 공개 페이지를 테스트 가능한 단위로 구현할 수 있습니다.

## File Structure

생성할 구조:

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
.env.example
.gitignore

web/
  package.json
  tsconfig.json
  next.config.ts
  auth.ts
  middleware.ts
  app/
    api/auth/[...nextauth]/route.ts
    auth/after-login/route.ts
    layout.tsx
    page.tsx
    login/actions.ts
    login/page.tsx
    onboarding/actions.ts
    onboarding/page.tsx
    admin/layout.tsx
    admin/page.tsx
  lib/
    auth/require-user.ts
    onboarding/get-onboarding-state.ts

packages/
  domain/
    package.json
    tsconfig.json
    vitest.config.ts
    src/index.ts
    src/wishlist/slug.ts
    src/wishlist/theme.ts
    src/wish-item/status.ts
    src/wishlist/slug.test.ts
    src/wishlist/theme.test.ts
    src/wish-item/status.test.ts

  application/
    package.json
    tsconfig.json
    vitest.config.ts
    src/index.ts
    src/onboarding/errors.ts
    src/onboarding/onboarding-service.ts
    src/onboarding/onboarding-service.test.ts
    src/ports/onboarding-repository.ts

  db/
    package.json
    tsconfig.json
    drizzle.config.ts
    src/index.ts
    src/client.ts
    src/schema/auth.ts
    src/schema/service.ts
    src/schema/index.ts
    src/repositories/onboarding-repository.ts
```

파일 책임:

- `packages/domain`: DB와 프레임워크를 모르는 순수 타입, 상태값, 검증 함수.
- `packages/application`: 유스케이스와 권한 흐름. DB 구현을 직접 모릅니다.
- `packages/db`: Drizzle schema, 실제 Postgres repository 구현.
- `web`: Next.js 라우팅, Auth.js, Server Action, redirect, 화면 골격.

## Task 1: Workspace Skeleton

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create the root workspace files**

Create `package.json`:

```json
{
  "name": "mwagotgo-sipeo",
  "private": true,
  "packageManager": "pnpm@10.11.0",
  "scripts": {
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "db:generate": "pnpm --filter @mwagotgo/db db:generate",
    "db:push": "pnpm --filter @mwagotgo/db db:push"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "web"
  - "packages/*"
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@mwagotgo/domain": ["packages/domain/src/index.ts"],
      "@mwagotgo/application": ["packages/application/src/index.ts"],
      "@mwagotgo/db": ["packages/db/src/index.ts"],
      "@mwagotgo/db/*": ["packages/db/src/*"]
    }
  }
}
```

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

Create `.gitignore`:

```gitignore
node_modules
.next
out
dist
coverage
.env
.env.local
.env.*.local
!.env.example
drizzle
```

- [ ] **Step 2: Install workspace dependencies**

Run:

```powershell
corepack pnpm install
```

Expected:

```text
Done in
```

The exact duration can differ. `pnpm-lock.yaml` must be created.

- [ ] **Step 3: Commit workspace skeleton**

Run:

```powershell
git add package.json pnpm-workspace.yaml tsconfig.base.json .env.example .gitignore pnpm-lock.yaml
git commit -m "chore: set up monorepo workspace"
```

Expected:

```text
[main ...] chore: set up monorepo workspace
```

## Task 2: Domain Package

**Files:**

- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/vitest.config.ts`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/wishlist/slug.ts`
- Create: `packages/domain/src/wishlist/theme.ts`
- Create: `packages/domain/src/wish-item/status.ts`
- Test: `packages/domain/src/wishlist/slug.test.ts`
- Test: `packages/domain/src/wishlist/theme.test.ts`
- Test: `packages/domain/src/wish-item/status.test.ts`

- [ ] **Step 1: Write the failing slug tests**

Create `packages/domain/package.json`:

```json
{
  "name": "@mwagotgo/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "vitest": "^3.1.4"
  }
}
```

Create `packages/domain/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

Create `packages/domain/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Create `packages/domain/src/wishlist/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidWishlistSlug, normalizeWishlistSlug } from "./slug";

describe("wishlist slug", () => {
  it("normalizes uppercase and surrounding spaces", () => {
    expect(normalizeWishlistSlug("  Chae-Young  ")).toBe("chae-young");
  });

  it("accepts lowercase letters, numbers, and hyphens", () => {
    expect(isValidWishlistSlug("chaeyoung-2026")).toBe(true);
  });

  it("rejects underscores", () => {
    expect(isValidWishlistSlug("chae_young")).toBe(false);
  });

  it("rejects a slug shorter than 3 characters", () => {
    expect(isValidWishlistSlug("cy")).toBe(false);
  });

  it("rejects a slug longer than 32 characters", () => {
    expect(isValidWishlistSlug("a".repeat(33))).toBe(false);
  });
});
```

- [ ] **Step 2: Run slug tests to verify they fail**

Run:

```powershell
corepack pnpm --filter @mwagotgo/domain test -- src/wishlist/slug.test.ts
```

Expected:

```text
FAIL  src/wishlist/slug.test.ts
Cannot find module './slug'
```

- [ ] **Step 3: Implement slug utilities**

Create `packages/domain/src/wishlist/slug.ts`:

```ts
const WISHLIST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_WISHLIST_SLUG_LENGTH = 3;
const MAX_WISHLIST_SLUG_LENGTH = 32;

export function normalizeWishlistSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidWishlistSlug(value: string): boolean {
  const slug = normalizeWishlistSlug(value);

  if (slug.length < MIN_WISHLIST_SLUG_LENGTH) {
    return false;
  }

  if (slug.length > MAX_WISHLIST_SLUG_LENGTH) {
    return false;
  }

  return WISHLIST_SLUG_PATTERN.test(slug);
}
```

- [ ] **Step 4: Write the theme and wish status tests**

Create `packages/domain/src/wishlist/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_PUBLIC_THEME, isPublicThemeId, PUBLIC_THEMES } from "./theme";

describe("public themes", () => {
  it("uses pixel_y2k as the default public theme", () => {
    expect(DEFAULT_PUBLIC_THEME).toBe("pixel_y2k");
  });

  it("supports the first planned theme presets", () => {
    expect(PUBLIC_THEMES.map((theme) => theme.id)).toEqual([
      "pixel_y2k",
      "mono_bw",
      "soft_pastel",
    ]);
  });

  it("rejects unknown theme ids", () => {
    expect(isPublicThemeId("neon_glass")).toBe(false);
  });
});
```

Create `packages/domain/src/wish-item/status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getWishStatusLabel, isWishCompleted } from "./status";

describe("wish item status", () => {
  it("shows open wishes as collecting", () => {
    expect(getWishStatusLabel("open", 20)).toBe("모으는 중");
  });

  it("shows fulfilled wishes as complete", () => {
    expect(getWishStatusLabel("fulfilled", 20)).toBe("완료");
  });

  it("treats 100 percent progress as complete even when status is open", () => {
    expect(isWishCompleted("open", 100)).toBe(true);
    expect(getWishStatusLabel("open", 100)).toBe("완료");
  });

  it("keeps hidden and paused labels explicit", () => {
    expect(getWishStatusLabel("hidden", 0)).toBe("숨김");
    expect(getWishStatusLabel("paused", 0)).toBe("일시중지");
  });
});
```

- [ ] **Step 5: Run tests to verify they fail on missing modules**

Run:

```powershell
corepack pnpm --filter @mwagotgo/domain test
```

Expected:

```text
FAIL  src/wishlist/theme.test.ts
FAIL  src/wish-item/status.test.ts
```

- [ ] **Step 6: Implement theme and wish status utilities**

Create `packages/domain/src/wishlist/theme.ts`:

```ts
export const PUBLIC_THEMES = [
  {
    id: "pixel_y2k",
    label: "Y2K 픽셀",
    description: "연핑크, 민트, 노랑, 진보라 테두리를 쓰는 기본 공개 테마",
  },
  {
    id: "mono_bw",
    label: "블랙 앤 화이트",
    description: "흑백 중심의 미니멀 공개 테마",
  },
  {
    id: "soft_pastel",
    label: "소프트 파스텔",
    description: "부드러운 생일 카드 감성의 공개 테마",
  },
] as const;

export type PublicThemeId = (typeof PUBLIC_THEMES)[number]["id"];

export const DEFAULT_PUBLIC_THEME: PublicThemeId = "pixel_y2k";

export function isPublicThemeId(value: string): value is PublicThemeId {
  return PUBLIC_THEMES.some((theme) => theme.id === value);
}
```

Create `packages/domain/src/wish-item/status.ts`:

```ts
export type WishStatus = "open" | "fulfilled" | "hidden" | "paused";

export function isWishCompleted(status: WishStatus, progressPercent: number): boolean {
  return status === "fulfilled" || progressPercent >= 100;
}

export function getWishStatusLabel(status: WishStatus, progressPercent: number): string {
  if (isWishCompleted(status, progressPercent)) {
    return "완료";
  }

  if (status === "hidden") {
    return "숨김";
  }

  if (status === "paused") {
    return "일시중지";
  }

  return "모으는 중";
}
```

Create `packages/domain/src/index.ts`:

```ts
export {
  isValidWishlistSlug,
  normalizeWishlistSlug,
} from "./wishlist/slug";
export {
  DEFAULT_PUBLIC_THEME,
  isPublicThemeId,
  PUBLIC_THEMES,
  type PublicThemeId,
} from "./wishlist/theme";
export {
  getWishStatusLabel,
  isWishCompleted,
  type WishStatus,
} from "./wish-item/status";
```

- [ ] **Step 7: Verify domain tests pass**

Run:

```powershell
corepack pnpm --filter @mwagotgo/domain test
```

Expected:

```text
PASS  src/wishlist/slug.test.ts
PASS  src/wishlist/theme.test.ts
PASS  src/wish-item/status.test.ts
```

- [ ] **Step 8: Commit domain package**

Run:

```powershell
git add packages/domain package.json pnpm-lock.yaml
git commit -m "feat: add domain foundation"
```

Expected:

```text
[main ...] feat: add domain foundation
```

## Task 3: Database Package and Drizzle Schema

**Files:**

- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/auth.ts`
- Create: `packages/db/src/schema/service.ts`
- Create: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Create db package files**

Create `packages/db/package.json`:

```json
{
  "name": "@mwagotgo/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "tsc -p tsconfig.json --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@auth/core": "^0.39.1",
    "@mwagotgo/domain": "workspace:*",
    "drizzle-orm": "^0.43.1",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.1"
  }
}
```

Create `packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
```

Create `packages/db/drizzle.config.ts`:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 2: Create Auth.js schema**

Create `packages/db/src/schema/auth.ts`:

```ts
import type { AdapterAccountType } from "@auth/core/adapters";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compoundKey: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);
```

- [ ] **Step 3: Create service schema**

Create `packages/db/src/schema/service.ts`:

```ts
import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_PUBLIC_THEME } from "@mwagotgo/domain";
import { users } from "./auth";

export const wishlistVisibilityEnum = pgEnum("wishlist_visibility", [
  "public",
  "private",
]);

export const wishStatusEnum = pgEnum("wish_status", [
  "open",
  "fulfilled",
  "hidden",
  "paused",
]);

export const bankAccountVisibilityModeEnum = pgEnum("bank_account_visibility_mode", [
  "always_visible",
  "reveal_on_click",
  "copy_only",
  "hidden",
]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  nickname: text("nickname").unique(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    ownerName: text("owner_name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    birthdayDate: date("birthday_date"),
    theme: text("theme").notNull().default(DEFAULT_PUBLIC_THEME),
    visibility: wishlistVisibilityEnum("visibility").notNull().default("public"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (wishlist) => ({
    slugUnique: uniqueIndex("wishlists_slug_unique").on(wishlist.slug),
    userIdIndex: index("wishlists_user_id_idx").on(wishlist.userId),
  }),
);

export const wishItems = pgTable(
  "wish_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    fundedAmount: integer("funded_amount").notNull().default(0),
    imageUrl: text("image_url"),
    productUrl: text("product_url"),
    priority: integer("priority").notNull().default(0),
    status: wishStatusEnum("status").notNull().default("open"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (wishItem) => ({
    wishlistIdIndex: index("wish_items_wishlist_id_idx").on(wishItem.wishlistId),
  }),
);

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    bankName: text("bank_name").notNull(),
    accountNumberEncrypted: text("account_number_encrypted").notNull(),
    accountHolder: text("account_holder").notNull(),
    visibilityMode: bankAccountVisibilityModeEnum("visibility_mode")
      .notNull()
      .default("reveal_on_click"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (bankAccount) => ({
    wishlistIdUnique: uniqueIndex("bank_accounts_wishlist_id_unique").on(
      bankAccount.wishlistId,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    wishItemId: uuid("wish_item_id").references(() => wishItems.id, {
      onDelete: "set null",
    }),
    nickname: text("nickname").notNull(),
    message: text("message").notNull(),
    isRead: integer("is_read").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (message) => ({
    wishlistIdIndex: index("messages_wishlist_id_idx").on(message.wishlistId),
  }),
);

export const fundingLogs = pgTable(
  "funding_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    wishItemId: uuid("wish_item_id")
      .notNull()
      .references(() => wishItems.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (fundingLog) => ({
    wishItemIdIndex: index("funding_logs_wish_item_id_idx").on(fundingLog.wishItemId),
  }),
);

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const wishlistRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  items: many(wishItems),
  messages: many(messages),
  fundingLogs: many(fundingLogs),
}));
```

- [ ] **Step 4: Create db client and exports**

Create `packages/db/src/client.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const client = postgres(databaseUrl, { prepare: false });
export const db = drizzle(client, { schema });
```

Create `packages/db/src/schema/index.ts`:

```ts
export * from "./auth";
export * from "./service";
```

Create `packages/db/src/index.ts`:

```ts
export { client, db } from "./client";
export * from "./schema";
```

- [ ] **Step 5: Install dependencies and verify typecheck**

Run:

```powershell
corepack pnpm install
corepack pnpm --filter @mwagotgo/db typecheck
```

Expected:

```text
Done in
```

and:

```text
@mwagotgo/db typecheck: tsc -p tsconfig.json --noEmit
```

with exit code 0.

- [ ] **Step 6: Generate the first migration**

Run:

```powershell
corepack pnpm --filter @mwagotgo/db db:generate
```

Expected:

```text
Your SQL migration file
```

Drizzle must create files under `packages/db/drizzle`.

- [ ] **Step 7: Commit db schema**

Run:

```powershell
git add packages/db package.json pnpm-lock.yaml tsconfig.base.json
git commit -m "feat: add database schema foundation"
```

Expected:

```text
[main ...] feat: add database schema foundation
```

## Task 4: Application Onboarding Service

**Files:**

- Create: `packages/application/package.json`
- Create: `packages/application/tsconfig.json`
- Create: `packages/application/vitest.config.ts`
- Create: `packages/application/src/index.ts`
- Create: `packages/application/src/ports/onboarding-repository.ts`
- Create: `packages/application/src/onboarding/errors.ts`
- Create: `packages/application/src/onboarding/onboarding-service.ts`
- Test: `packages/application/src/onboarding/onboarding-service.test.ts`

- [ ] **Step 1: Create application package and failing tests**

Create `packages/application/package.json`:

```json
{
  "name": "@mwagotgo/application",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@mwagotgo/domain": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^3.1.4"
  }
}
```

Create `packages/application/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts", "vitest.config.ts"]
}
```

Create `packages/application/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Create `packages/application/src/onboarding/onboarding-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { completeOnboarding } from "./onboarding-service";
import { OnboardingError } from "./errors";
import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "../ports/onboarding-repository";

class FakeOnboardingRepository implements OnboardingRepository {
  public readonly saved: CompleteOnboardingRecord[] = [];

  constructor(private readonly takenSlugs: string[] = []) {}

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    return userId === "existing-user";
  }

  async isWishlistSlugAvailable(slug: string): Promise<boolean> {
    return !this.takenSlugs.includes(slug);
  }

  async completeOnboarding(input: CompleteOnboardingRecord) {
    this.saved.push(input);
    return {
      profileUserId: input.userId,
      wishlistId: "wishlist-1",
      wishlistSlug: input.slug,
    };
  }
}

describe("completeOnboarding", () => {
  it("rejects invalid slugs", async () => {
    const repository = new FakeOnboardingRepository();

    await expect(
      completeOnboarding(repository, {
        userId: "user-1",
        displayName: "채영",
        slug: "chae_young",
        birthdayDate: "2026-05-14",
        description: "갖고 싶은 것들을 모아봤어요",
      }),
    ).rejects.toEqual(new OnboardingError("ONBOARDING_INVALID_SLUG"));
  });

  it("rejects duplicate slugs", async () => {
    const repository = new FakeOnboardingRepository(["chaeyoung"]);

    await expect(
      completeOnboarding(repository, {
        userId: "user-1",
        displayName: "채영",
        slug: "chaeyoung",
        birthdayDate: "2026-05-14",
        description: "갖고 싶은 것들을 모아봤어요",
      }),
    ).rejects.toEqual(new OnboardingError("ONBOARDING_SLUG_TAKEN"));
  });

  it("rejects users who already completed onboarding", async () => {
    const repository = new FakeOnboardingRepository();

    await expect(
      completeOnboarding(repository, {
        userId: "existing-user",
        displayName: "채영",
        slug: "chaeyoung",
        birthdayDate: "2026-05-14",
        description: "갖고 싶은 것들을 모아봤어요",
      }),
    ).rejects.toEqual(new OnboardingError("ONBOARDING_ALREADY_COMPLETED"));
  });

  it("creates profile and default wishlist with pixel_y2k theme", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(repository, {
      userId: "user-1",
      displayName: "채영",
      slug: "ChaeYoung",
      birthdayDate: "2026-05-14",
      description: "갖고 싶은 것들을 모아봤어요",
    });

    expect(result).toEqual({
      profileUserId: "user-1",
      wishlistId: "wishlist-1",
      wishlistSlug: "chaeyoung",
    });

    expect(repository.saved[0]).toMatchObject({
      userId: "user-1",
      displayName: "채영",
      slug: "chaeyoung",
      ownerName: "채영",
      title: "채영가 갖고 싶은 건...",
      theme: "pixel_y2k",
      visibility: "public",
    });
  });
});
```

- [ ] **Step 2: Run application tests to verify they fail**

Run:

```powershell
corepack pnpm --filter @mwagotgo/application test
```

Expected:

```text
FAIL  src/onboarding/onboarding-service.test.ts
Cannot find module './onboarding-service'
```

- [ ] **Step 3: Implement onboarding types and errors**

Create `packages/application/src/ports/onboarding-repository.ts`:

```ts
import type { PublicThemeId } from "@mwagotgo/domain";

export type WishlistVisibility = "public" | "private";

export interface CompleteOnboardingRecord {
  userId: string;
  displayName: string;
  slug: string;
  ownerName: string;
  title: string;
  description: string;
  birthdayDate: string | null;
  theme: PublicThemeId;
  visibility: WishlistVisibility;
}

export interface CompleteOnboardingResult {
  profileUserId: string;
  wishlistId: string;
  wishlistSlug: string;
}

export interface OnboardingRepository {
  hasCompletedOnboarding(userId: string): Promise<boolean>;
  isWishlistSlugAvailable(slug: string): Promise<boolean>;
  completeOnboarding(
    input: CompleteOnboardingRecord,
  ): Promise<CompleteOnboardingResult>;
}
```

Create `packages/application/src/onboarding/errors.ts`:

```ts
export type OnboardingErrorCode =
  | "ONBOARDING_ALREADY_COMPLETED"
  | "ONBOARDING_INVALID_DISPLAY_NAME"
  | "ONBOARDING_INVALID_SLUG"
  | "ONBOARDING_SLUG_TAKEN";

export class OnboardingError extends Error {
  constructor(public readonly code: OnboardingErrorCode) {
    super(code);
    this.name = "OnboardingError";
  }
}
```

- [ ] **Step 4: Implement onboarding service**

Create `packages/application/src/onboarding/onboarding-service.ts`:

```ts
import {
  DEFAULT_PUBLIC_THEME,
  isValidWishlistSlug,
  normalizeWishlistSlug,
} from "@mwagotgo/domain";
import type {
  CompleteOnboardingResult,
  OnboardingRepository,
} from "../ports/onboarding-repository";
import { OnboardingError } from "./errors";

export interface CompleteOnboardingInput {
  userId: string;
  displayName: string;
  slug: string;
  birthdayDate: string | null;
  description: string;
}

export async function completeOnboarding(
  repository: OnboardingRepository,
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const displayName = input.displayName.trim();

  if (displayName.length < 1 || displayName.length > 20) {
    throw new OnboardingError("ONBOARDING_INVALID_DISPLAY_NAME");
  }

  const slug = normalizeWishlistSlug(input.slug);

  if (!isValidWishlistSlug(slug)) {
    throw new OnboardingError("ONBOARDING_INVALID_SLUG");
  }

  const alreadyCompleted = await repository.hasCompletedOnboarding(input.userId);

  if (alreadyCompleted) {
    throw new OnboardingError("ONBOARDING_ALREADY_COMPLETED");
  }

  const slugAvailable = await repository.isWishlistSlugAvailable(slug);

  if (!slugAvailable) {
    throw new OnboardingError("ONBOARDING_SLUG_TAKEN");
  }

  return repository.completeOnboarding({
    userId: input.userId,
    displayName,
    slug,
    ownerName: displayName,
    title: `${displayName}가 갖고 싶은 건...`,
    description: input.description.trim() || "갖고 싶은 것들을 모아봤어요.",
    birthdayDate: input.birthdayDate,
    theme: DEFAULT_PUBLIC_THEME,
    visibility: "public",
  });
}
```

Create `packages/application/src/index.ts`:

```ts
export { completeOnboarding, type CompleteOnboardingInput } from "./onboarding/onboarding-service";
export { OnboardingError, type OnboardingErrorCode } from "./onboarding/errors";
export type {
  CompleteOnboardingRecord,
  CompleteOnboardingResult,
  OnboardingRepository,
  WishlistVisibility,
} from "./ports/onboarding-repository";
```

- [ ] **Step 5: Verify application tests pass**

Run:

```powershell
corepack pnpm --filter @mwagotgo/application test
```

Expected:

```text
PASS  src/onboarding/onboarding-service.test.ts
```

- [ ] **Step 6: Commit application package**

Run:

```powershell
git add packages/application package.json pnpm-lock.yaml tsconfig.base.json
git commit -m "feat: add onboarding application service"
```

Expected:

```text
[main ...] feat: add onboarding application service
```

## Task 5: Drizzle Onboarding Repository

**Files:**

- Create: `packages/db/src/repositories/onboarding-repository.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write repository implementation**

Create `packages/db/src/repositories/onboarding-repository.ts`:

```ts
import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "@mwagotgo/application";
import { and, eq, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

export class DrizzleOnboardingRepository implements OnboardingRepository {
  constructor(private readonly database: PostgresJsDatabase<typeof schema>) {}

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const rows = await this.database
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(
        and(
          eq(schema.profiles.userId, userId),
          isNotNull(schema.profiles.onboardingCompletedAt),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async isWishlistSlugAvailable(slug: string): Promise<boolean> {
    const rows = await this.database
      .select({ id: schema.wishlists.id })
      .from(schema.wishlists)
      .where(eq(schema.wishlists.slug, slug))
      .limit(1);

    return rows.length === 0;
  }

  async completeOnboarding(input: CompleteOnboardingRecord) {
    return this.database.transaction(async (tx) => {
      const now = new Date();

      const [profile] = await tx
        .insert(schema.profiles)
        .values({
          userId: input.userId,
          displayName: input.displayName,
          onboardingCompletedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: input.displayName,
            onboardingCompletedAt: now,
            updatedAt: now,
          },
        })
        .returning({ userId: schema.profiles.userId });

      const [wishlist] = await tx
        .insert(schema.wishlists)
        .values({
          userId: input.userId,
          slug: input.slug,
          ownerName: input.ownerName,
          title: input.title,
          description: input.description,
          birthdayDate: input.birthdayDate,
          theme: input.theme,
          visibility: input.visibility,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          id: schema.wishlists.id,
          slug: schema.wishlists.slug,
        });

      return {
        profileUserId: profile.userId,
        wishlistId: wishlist.id,
        wishlistSlug: wishlist.slug,
      };
    });
  }
}
```

Modify `packages/db/src/index.ts`:

```ts
export { client, db } from "./client";
export * from "./schema";
export { DrizzleOnboardingRepository } from "./repositories/onboarding-repository";
```

- [ ] **Step 2: Add application dependency to db package**

Modify `packages/db/package.json`:

```json
{
  "name": "@mwagotgo/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "tsc -p tsconfig.json --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@auth/core": "^0.39.1",
    "@mwagotgo/application": "workspace:*",
    "@mwagotgo/domain": "workspace:*",
    "drizzle-orm": "^0.43.1",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.1"
  }
}
```

- [ ] **Step 3: Verify db package typecheck**

Run:

```powershell
corepack pnpm install
corepack pnpm --filter @mwagotgo/db typecheck
```

Expected:

```text
@mwagotgo/db typecheck: tsc -p tsconfig.json --noEmit
```

with exit code 0.

- [ ] **Step 4: Commit repository implementation**

Run:

```powershell
git add packages/db package.json pnpm-lock.yaml
git commit -m "feat: add onboarding repository"
```

Expected:

```text
[main ...] feat: add onboarding repository
```

## Task 6: Next.js Web App Shell

**Files:**

- Modify: `web/package.json`
- Modify: `web/tsconfig.json`
- Modify: `web/next.config.ts`
- Modify: `web/app/layout.tsx`
- Modify: `web/app/page.tsx`
- Create: `web/app/login/page.tsx`

- [ ] **Step 1: Create web app package**

Modify `web/package.json`:

```json
{
  "name": "@mwagotgo/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@auth/drizzle-adapter": "^1.10.0",
    "@mwagotgo/application": "workspace:*",
    "@mwagotgo/db": "workspace:*",
    "@mwagotgo/domain": "workspace:*",
    "next": "^15.3.2",
    "next-auth": "^5.0.0-beta.28",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.18",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.5",
    "eslint": "^9.26.0",
    "eslint-config-next": "^15.3.2"
  }
}
```

Modify `web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

Modify `web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mwagotgo/application",
    "@mwagotgo/db",
    "@mwagotgo/domain",
  ],
};

export default nextConfig;
```

- [ ] **Step 2: Create basic app pages**

Modify `web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "뭐갖고싶어",
  description: "받고 싶은 선물을 링크 하나로 공유하세요.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Modify `web/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>
        생일축하해.
        <br />
        뭐 갖고 싶어?
      </h1>
      <p>받고 싶은 선물을 말로 하기 애매했다면, 위시리스트 링크로 공유하세요.</p>
      <Link href="/login">내 위시리스트 만들기</Link>
    </main>
  );
}
```

Create `web/app/login/page.tsx`:

```tsx
export default function LoginPage() {
  return (
    <main>
      <h1>로그인</h1>
      <p>Google 또는 Kakao로 시작하세요.</p>
    </main>
  );
}
```

- [ ] **Step 3: Install and verify web typecheck**

Run:

```powershell
corepack pnpm install
corepack pnpm --filter @mwagotgo/web typecheck
```

Expected:

```text
@mwagotgo/web typecheck: tsc -p tsconfig.json --noEmit
```

with exit code 0.

- [ ] **Step 4: Commit web shell**

Run:

```powershell
git add web package.json pnpm-lock.yaml tsconfig.base.json
git commit -m "feat: add web app shell"
```

Expected:

```text
[main ...] feat: add web app shell
```

## Task 7: Auth.js Google and Kakao Login

**Files:**

- Create: `web/auth.ts`
- Create: `web/app/api/auth/[...nextauth]/route.ts`
- Create: `web/app/login/actions.ts`
- Modify: `web/app/login/page.tsx`

- [ ] **Step 1: Configure Auth.js**

Create `web/auth.ts`:

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@mwagotgo/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@mwagotgo/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google, Kakao],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
});
```

Create `web/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 2: Add session type augmentation**

Create `web/auth.d.ts`:

```ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 3: Add login actions and buttons**

Create `web/app/login/actions.ts`:

```ts
"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/auth/after-login" });
}

export async function signInWithKakao() {
  await signIn("kakao", { redirectTo: "/auth/after-login" });
}
```

Modify `web/app/login/page.tsx`:

```tsx
import { signInWithGoogle, signInWithKakao } from "./actions";

export default function LoginPage() {
  return (
    <main>
      <h1>로그인</h1>
      <p>Google 또는 Kakao로 시작하세요.</p>

      <form action={signInWithGoogle}>
        <button type="submit">Google로 계속하기</button>
      </form>

      <form action={signInWithKakao}>
        <button type="submit">Kakao로 계속하기</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Verify Auth.js typecheck**

Run:

```powershell
corepack pnpm --filter @mwagotgo/web typecheck
```

Expected:

```text
@mwagotgo/web typecheck: tsc -p tsconfig.json --noEmit
```

with exit code 0.

- [ ] **Step 5: Commit auth setup**

Run:

```powershell
git add web package.json pnpm-lock.yaml
git commit -m "feat: add social login foundation"
```

Expected:

```text
[main ...] feat: add social login foundation
```

## Task 8: Onboarding Redirect and Admin Guard

**Files:**

- Create: `web/lib/auth/require-user.ts`
- Create: `web/lib/onboarding/get-onboarding-state.ts`
- Create: `web/app/auth/after-login/route.ts`
- Create: `web/app/onboarding/actions.ts`
- Create: `web/app/onboarding/page.tsx`
- Create: `web/app/admin/layout.tsx`
- Create: `web/app/admin/page.tsx`

- [ ] **Step 1: Add authenticated user helper**

Create `web/lib/auth/require-user.ts`:

```ts
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}
```

- [ ] **Step 2: Add onboarding state query**

Create `web/lib/onboarding/get-onboarding-state.ts`:

```ts
import { eq, isNotNull } from "drizzle-orm";
import { db, profiles, wishlists } from "@mwagotgo/db";

export async function getOnboardingState(userId: string) {
  const profileRows = await db
    .select({
      userId: profiles.userId,
      onboardingCompletedAt: profiles.onboardingCompletedAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const wishlistRows = await db
    .select({
      id: wishlists.id,
      slug: wishlists.slug,
    })
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);

  const profile = profileRows[0];
  const wishlist = wishlistRows[0];

  return {
    isComplete: Boolean(profile?.onboardingCompletedAt && wishlist),
    wishlistSlug: wishlist?.slug ?? null,
  };
}
```

- [ ] **Step 3: Add post-login redirect route**

Create `web/app/auth/after-login/route.ts`:

```ts
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingState } from "@/lib/onboarding/get-onboarding-state";

export async function GET() {
  const user = await requireUser();
  const onboarding = await getOnboardingState(user.id);

  if (!onboarding.isComplete) {
    redirect("/onboarding");
  }

  redirect("/admin");
}
```

- [ ] **Step 4: Add onboarding action**

Create `web/app/onboarding/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { completeOnboarding, OnboardingError } from "@mwagotgo/application";
import { db, DrizzleOnboardingRepository } from "@mwagotgo/db";
import { requireUser } from "@/lib/auth/require-user";

export interface OnboardingActionState {
  error: string | null;
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitOnboarding(
  _state: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  const repository = new DrizzleOnboardingRepository(db);

  try {
    await completeOnboarding(repository, {
      userId: user.id,
      displayName: getString(formData, "displayName"),
      slug: getString(formData, "slug"),
      birthdayDate: getString(formData, "birthdayDate") || null,
      description: getString(formData, "description"),
    });
  } catch (error) {
    if (error instanceof OnboardingError) {
      return { error: error.code };
    }

    return { error: "ONBOARDING_UNKNOWN_ERROR" };
  }

  redirect("/admin");
}
```

- [ ] **Step 5: Add onboarding page**

Create `web/app/onboarding/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { submitOnboarding, type OnboardingActionState } from "./actions";

const initialState: OnboardingActionState = {
  error: null,
};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    submitOnboarding,
    initialState,
  );

  return (
    <main>
      <h1>내 위시리스트 만들기</h1>
      <form action={formAction}>
        <label>
          화면 이름
          <input name="displayName" required maxLength={20} />
        </label>

        <label>
          공개 URL
          <input name="slug" required minLength={3} maxLength={32} />
        </label>

        <label>
          생일 날짜
          <input name="birthdayDate" type="date" />
        </label>

        <label>
          소개 문구
          <textarea name="description" maxLength={120} />
        </label>

        {state.error ? <p role="alert">{state.error}</p> : null}

        <button type="submit" disabled={pending}>
          만들기
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Add admin guard**

Create `web/app/admin/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getOnboardingState } from "@/lib/onboarding/get-onboarding-state";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const onboarding = await getOnboardingState(user.id);

  if (!onboarding.isComplete) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
```

Create `web/app/admin/page.tsx`:

```tsx
import { requireUser } from "@/lib/auth/require-user";

export default async function AdminPage() {
  const user = await requireUser();

  return (
    <main>
      <h1>어드민</h1>
      <p>{user.email} 계정으로 로그인했습니다.</p>
    </main>
  );
}
```

- [ ] **Step 7: Verify web typecheck**

Run:

```powershell
corepack pnpm --filter @mwagotgo/web typecheck
```

Expected:

```text
@mwagotgo/web typecheck: tsc -p tsconfig.json --noEmit
```

with exit code 0.

- [ ] **Step 8: Commit onboarding flow**

Run:

```powershell
git add web packages/db package.json pnpm-lock.yaml
git commit -m "feat: add onboarding flow foundation"
```

Expected:

```text
[main ...] feat: add onboarding flow foundation
```

## Task 9: Foundation Verification

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add setup instructions**

Create or modify `README.md`:

```md
# 뭐갖고싶어

생일자가 받고 싶은 선물을 위시리스트로 만들고, 친구들이 공개 링크로 들어와 선물과 메시지를 확인할 수 있는 생일 위시리스트 서비스입니다.

## Foundation Stack

- Next.js App Router
- Auth.js Google/Kakao OAuth
- Drizzle ORM
- Postgres
- pnpm workspace

## Local Setup

```powershell
corepack pnpm install
Copy-Item .env.example .env.local
corepack pnpm db:generate
corepack pnpm typecheck
corepack pnpm test
```

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET` 값을 `.env.local`에 입력해야 로그인과 DB 기능이 동작합니다.
```

- [ ] **Step 2: Run all foundation checks**

Run:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Expected:

```text
@mwagotgo/domain typecheck
@mwagotgo/application typecheck
@mwagotgo/db typecheck
@mwagotgo/web typecheck
```

and:

```text
PASS
```

for domain and application tests.

`corepack pnpm build` must finish with exit code 0 after valid environment variables are present.

- [ ] **Step 3: Verify migration generation**

Run:

```powershell
corepack pnpm db:generate
```

Expected:

```text
No schema changes, nothing to migrate
```

or a new migration file if schema changed during implementation. If a new migration file is created, inspect the SQL and commit it with the foundation changes.

- [ ] **Step 4: Commit README and verification fixes**

Run:

```powershell
git add README.md package.json pnpm-lock.yaml apps packages
git commit -m "docs: document foundation setup"
```

Expected:

```text
[main ...] docs: document foundation setup
```

## Plan Self-Review

Spec coverage:

- Next.js 모듈러 모놀리스: Task 1, Task 6.
- Postgres/Drizzle schema: Task 3.
- Auth.js Google/Kakao: Task 7.
- OAuth 계정과 공개 프로필 분리: Task 3 service schema, Task 4 onboarding service.
- 신규 사용자 온보딩: Task 4, Task 5, Task 8.
- 기본 공개 테마 `pixel_y2k`: Task 2, Task 3, Task 4.
- 친구 방문자 비로그인 원칙: 이 foundation 계획에서는 공개 페이지를 만들지 않으므로 코드 작업 범위 밖입니다. 공개 페이지 계획에서 로그인 없는 message flow를 구현합니다.

Placeholder scan:

- 이 계획은 비어 있는 작업 항목이나 확정되지 않은 구현 지시를 남기지 않습니다.
- 모든 작업은 생성/수정할 파일 경로와 검증 명령을 포함합니다.

Type consistency:

- `PublicThemeId`, `DEFAULT_PUBLIC_THEME`는 `@mwagotgo/domain`에서 export합니다.
- `completeOnboarding`은 `@mwagotgo/application`에서 export합니다.
- `DrizzleOnboardingRepository`는 `@mwagotgo/db`에서 export합니다.
- `users`, `accounts`, `sessions`, `verificationTokens`는 `@mwagotgo/db/schema`에서 export합니다.
