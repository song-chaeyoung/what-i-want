# Admin Settings Bank Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/admin/settings` so owners can edit profile, public link settings, and bank account visibility, then show safe account guidance on `/b/[slug]`.

**Architecture:** Keep HTTP entrypoints in `app/api/**` and domain rules in `src/lib/**`. Store bank account numbers encrypted through an app-level crypto helper. Public wishlist reads only visibility-safe account data from the public repository.

**Tech Stack:** Next.js App Router Route Handlers, React Server Components, Drizzle ORM, Node `crypto`, Vitest.

---

### File Structure

- Create: `src/lib/settings/types.ts` for settings records, mutation input, and repository port.
- Create: `src/lib/settings/account-crypto.ts` for AES-GCM encryption/decryption helpers.
- Create: `src/lib/settings/service.ts` for validation, normalization, owner scoping, and account preview formatting.
- Create: `src/lib/settings/service.test.ts` for RED/GREEN service behavior.
- Create: `src/lib/settings/account-crypto.test.ts` for RED/GREEN encryption behavior.
- Create: `src/lib/settings/repository.ts` for Drizzle profile, wishlist, and bank account persistence.
- Create: `app/api/admin/settings/route.ts` for authenticated form/json updates.
- Create: `app/admin/settings/page.tsx` for the settings UI.
- Modify: `app/admin/layout.tsx` to link settings.
- Modify: `src/lib/public-wishlist/types.ts`, `service.ts`, and `repository.ts` to include public account guidance.
- Modify: `app/b/[slug]/page.tsx` to render account guidance when visibility permits.

### Task 1: Settings Domain Tests

**Files:**
- Create: `src/lib/settings/types.ts`
- Create: `src/lib/settings/service.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- loads profile, wishlist, and account settings by owner id.
- trims display name, description, slug, title, bank fields.
- rejects empty display name, invalid slug, duplicate slug, invalid birthday, invalid visibility, incomplete account fields.
- allows clearing account number while keeping an existing encrypted account.

- [ ] **Step 2: Run RED**

Run: `corepack pnpm test src/lib/settings/service.test.ts`
Expected: FAIL because `src/lib/settings/service.ts` does not exist.

### Task 2: Account Crypto Tests

**Files:**
- Create: `src/lib/settings/account-crypto.test.ts`
- Create: `src/lib/settings/account-crypto.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- encrypted value does not contain the source account number.
- decrypting with the same secret returns the original number.
- empty or missing secret returns an explicit error.
- malformed ciphertext returns `null`.

- [ ] **Step 2: Run RED**

Run: `corepack pnpm test src/lib/settings/account-crypto.test.ts`
Expected: FAIL because `encryptAccountNumber` is not implemented.

### Task 3: Settings Service and Crypto

**Files:**
- Modify: `src/lib/settings/types.ts`
- Modify: `src/lib/settings/service.ts`
- Modify: `src/lib/settings/account-crypto.ts`

- [ ] **Step 1: Implement minimal domain logic**

Use `parseWishlistSlug`, `isPublicThemeId`, and `PUBLIC_THEME_IDS`. Default account visibility is `hidden`. Require all bank fields when creating a new account. When updating an existing account, an empty account number means "keep current encrypted number."

- [ ] **Step 2: Run GREEN**

Run: `corepack pnpm test src/lib/settings/service.test.ts src/lib/settings/account-crypto.test.ts`
Expected: PASS.

### Task 4: Drizzle Repository and Admin Route

**Files:**
- Create: `src/lib/settings/repository.ts`
- Create: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Add owner-scoped repository**

Read from `profiles`, `wishlists`, and `bank_accounts` by `userId` / `ownerId`. Update profile and wishlist in a transaction. Update an existing bank account if present, otherwise insert one.

- [ ] **Step 2: Add authenticated route handler**

Use `auth()` inside the route handler. Parse both form and JSON requests. Redirect forms to `/admin/settings?saved=1` or `/admin/settings?error=<code>`, and return JSON for API callers.

- [ ] **Step 3: Run targeted tests**

Run: `corepack pnpm test src/lib/settings/service.test.ts src/lib/settings/account-crypto.test.ts`
Expected: PASS.

### Task 5: Admin Settings UI

**Files:**
- Create: `app/admin/settings/page.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Render server component page**

Use `requireUser()` and `getSettings()` with `DrizzleSettingsRepository`. Render profile fields, wishlist slug/title/theme fields, and bank account fields with visibility options.

- [ ] **Step 2: Link settings in admin nav**

Add `/admin/settings` to the existing admin layout nav.

### Task 6: Public Account Guidance

**Files:**
- Modify: `src/lib/public-wishlist/types.ts`
- Modify: `src/lib/public-wishlist/repository.ts`
- Modify: `src/lib/public-wishlist/service.ts`
- Modify: `app/b/[slug]/page.tsx`

- [ ] **Step 1: Extend public wishlist result**

Public repository loads the owner's account. Service decrypts only when visibility is `always_visible`, `reveal_on_click`, or `copy_only`; `hidden` returns `null`.

- [ ] **Step 2: Render account guidance**

Show bank name, holder, and account number for `always_visible`; use `<details>` for `reveal_on_click`; use a copy-only style text for `copy_only`; render nothing for `hidden`.

### Task 7: Full Verification and Commit

**Files:**
- All changed files

- [ ] **Step 1: Run verification**

Run:
- `corepack pnpm test`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- dummy-env `corepack pnpm build`
- `git diff --check`

- [ ] **Step 2: Commit**

Run:
- `git add docs src app`
- `git commit -m "feat: add admin settings and account guidance"`
