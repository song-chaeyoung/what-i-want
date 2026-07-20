# SEO·GEO Crawler Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈과 샘플만 검색·AI 답변 노출 대상으로 선언하고, 사용자별·인증·관리 경로를 보호하는 robots, sitemap, canonical, Open Graph URL 메타데이터를 구현합니다.

**Architecture:** Next.js 16의 `MetadataRoute.Robots`, `MetadataRoute.Sitemap`, 페이지별 `Metadata` API를 사용합니다. 사이트 기준 URL 계산은 순수 함수로 분리하고, sitemap은 DB나 세션을 읽지 않는 정적 함수로 유지합니다. 검색·답변 크롤러는 공개 HTML을 읽어 `noindex`를 확인할 수 있게 하며, 학습용 크롤러는 사용자별 경로를 robots 규칙으로 차단합니다.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Vitest 4.1.6, pnpm

## Global Constraints

- 패키지 매니저는 pnpm만 사용합니다.
- 검색 인덱싱 및 sitemap 대상은 `/`와 `/sample`뿐입니다.
- `/wishlist/[slug]`, `/login`, `/onboarding`, `/admin/**`는 검색 인덱싱 대상이 아닙니다.
- `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`을 차단하지 않습니다.
- `GPTBot`, `ClaudeBot`, `Google-Extended`는 홈과 샘플만 사용할 수 있고 사용자별·인증·관리 경로에는 접근할 수 없습니다.
- 기존 OG 이미지와 소셜 공유 메타데이터는 유지합니다.
- JSON-LD, `llms.txt`, Search Console 제출은 이번 구현에 포함하지 않습니다.
- Vitest/Vite 검증에는 Node `^20.19.0 || >=22.12.0`이 필요합니다. 현재 기본 Node `v20.15.0`으로 테스트가 시작되지 않으면 호환 Node 런타임을 먼저 선택합니다.

---

## File Structure

- Create `src/lib/metadata/site-url.ts`: `AUTH_URL` 정규화와 운영 도메인 fallback을 담당합니다.
- Create `src/lib/metadata/site-url.test.ts`: 사이트 URL 순수 함수의 정상·경계 입력을 검증합니다.
- Modify `app/layout.tsx`: 로컬 URL 계산을 제거하고 공유 함수를 사용합니다.
- Modify `src/lib/design/og-image-contract.test.ts`: layout이 공유 URL 함수를 사용한다는 계약으로 갱신합니다.
- Create `app/robots.ts`: 일반 검색·답변 봇과 학습 봇의 크롤링 정책을 반환합니다.
- Create `app/sitemap.ts`: 홈과 샘플 두 URL만 반환합니다.
- Create `src/lib/design/metadata-routes.test.ts`: robots와 sitemap 반환값을 직접 검증합니다.
- Modify `app/page.tsx`: 홈 canonical, `og:url`, index/follow를 선언합니다.
- Modify `app/sample/page.tsx`: 샘플 canonical, `og:url`, index/follow를 선언합니다.
- Modify `app/wishlist/[slug]/page.tsx`: 동적 공개 위시리스트를 noindex/nofollow로 선언합니다.
- Modify `app/login/page.tsx`: 로그인 페이지를 noindex/nofollow로 선언합니다.
- Modify `app/onboarding/page.tsx`: 온보딩 페이지를 noindex/nofollow로 선언합니다.
- Modify `app/admin/layout.tsx`: 전체 관리 route segment를 noindex/nofollow로 선언합니다.
- Create `src/lib/design/seo-metadata-contract.test.ts`: 페이지별 메타데이터 계약을 검증합니다.

---

### Task 1: 사이트 기준 URL을 단일 함수로 통합

**Files:**
- Create: `src/lib/metadata/site-url.ts`
- Create: `src/lib/metadata/site-url.test.ts`
- Modify: `app/layout.tsx:1-25`
- Modify: `src/lib/design/og-image-contract.test.ts:54-64`

**Interfaces:**
- Produces: `resolveSiteUrl(raw?: string): URL`
- Consumes: `process.env.AUTH_URL` when `raw` is omitted
- Fallback: `https://iwantbirthdaygift.com/`

- [ ] **Step 1: Write the failing URL resolver tests**

Create `src/lib/metadata/site-url.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  test("uses the production domain when AUTH_URL is missing", () => {
    expect(resolveSiteUrl(undefined).href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });

  test("adds https when the protocol is omitted", () => {
    expect(resolveSiteUrl("iwantbirthdaygift.com").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });

  test("strips quotes, whitespace, and paths down to the origin", () => {
    expect(
      resolveSiteUrl('  "https://preview.example.com/base/path"  ').href,
    ).toBe("https://preview.example.com/");
  });

  test("preserves an explicit local development origin", () => {
    expect(resolveSiteUrl("http://localhost:3000").href).toBe(
      "http://localhost:3000/",
    );
  });

  test("falls back when the value is malformed", () => {
    expect(resolveSiteUrl("https://[").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run with a compatible Node runtime:

```bash
pnpm test -- src/lib/metadata/site-url.test.ts
```

Expected: FAIL because `src/lib/metadata/site-url.ts` does not exist.

- [ ] **Step 3: Implement the minimal URL resolver**

Create `src/lib/metadata/site-url.ts`:

```ts
const PRODUCTION_SITE_URL = "https://iwantbirthdaygift.com";

export function resolveSiteUrl(raw = process.env.AUTH_URL): URL {
  const normalized = raw?.trim().replace(/^["']|["']$/g, "");

  if (normalized) {
    const candidate = /^https?:\/\//.test(normalized)
      ? normalized
      : `https://${normalized}`;

    try {
      return new URL(new URL(candidate).origin);
    } catch {
      // Invalid environment values fall back to the canonical production origin.
    }
  }

  return new URL(PRODUCTION_SITE_URL);
}
```

Modify `app/layout.tsx`:

```ts
import type { Metadata } from "next";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";
```

Delete the local `resolveMetadataBase` function and replace:

```ts
metadataBase: resolveMetadataBase(),
```

with:

```ts
metadataBase: resolveSiteUrl(),
```

Update the root metadata contract assertions in `src/lib/design/og-image-contract.test.ts`:

```ts
expect(source).toContain(
  'import { resolveSiteUrl } from "@/src/lib/metadata/site-url";',
);
expect(source).toContain("metadataBase: resolveSiteUrl(),");
expect(source).not.toContain("function resolveMetadataBase");
```

- [ ] **Step 4: Run focused tests and typecheck**

```bash
pnpm test -- src/lib/metadata/site-url.test.ts src/lib/design/og-image-contract.test.ts
pnpm typecheck
```

Expected: both test files PASS and TypeScript exits `0`.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/metadata/site-url.ts src/lib/metadata/site-url.test.ts app/layout.tsx src/lib/design/og-image-contract.test.ts
git commit -m "refactor: centralize site metadata URL"
```

---

### Task 2: robots.txt와 sitemap.xml 메타데이터 라우트 추가

**Files:**
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Create: `src/lib/design/metadata-routes.test.ts`

**Interfaces:**
- Consumes: `resolveSiteUrl(): URL` from Task 1
- Produces: `robots(): MetadataRoute.Robots`
- Produces: `sitemap(): MetadataRoute.Sitemap`

- [ ] **Step 1: Write failing metadata route tests**

Create `src/lib/design/metadata-routes.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import robots from "../../../app/robots";
import sitemap from "../../../app/sitemap";

describe("metadata routes", () => {
  test("publishes only home and sample in the sitemap", () => {
    expect(sitemap()).toEqual([
      {
        url: "https://iwantbirthdaygift.com/",
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: "https://iwantbirthdaygift.com/sample",
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ]);
  });

  test("allows search and answer crawlers while protecting operations", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules).toContainEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/auth/"],
    });
    expect(JSON.stringify(result)).not.toContain("OAI-SearchBot");
    expect(JSON.stringify(result)).not.toContain("Claude-SearchBot");
    expect(JSON.stringify(result)).not.toContain("PerplexityBot");
  });

  test("limits training crawlers to marketing content", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules).toContainEqual({
      userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
      allow: ["/$", "/sample$"],
      disallow: "/",
    });
    expect(result.sitemap).toBe(
      "https://iwantbirthdaygift.com/sitemap.xml",
    );
    expect(result.host).toBe("https://iwantbirthdaygift.com");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

```bash
pnpm test -- src/lib/design/metadata-routes.test.ts
```

Expected: FAIL because `app/robots.ts` and `app/sitemap.ts` do not exist.

- [ ] **Step 3: Implement robots.ts**

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";

const OPERATIONAL_PATHS = ["/admin/", "/api/", "/auth/"];
export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: OPERATIONAL_PATHS,
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        allow: ["/$", "/sample$"],
        disallow: "/",
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).href,
    host: siteUrl.origin,
  };
}
```

- [ ] **Step 4: Implement sitemap.ts**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();

  return [
    {
      url: new URL("/", siteUrl).href,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/sample", siteUrl).href,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
```

- [ ] **Step 5: Run metadata route tests and typecheck**

```bash
pnpm test -- src/lib/design/metadata-routes.test.ts
pnpm typecheck
```

Expected: metadata route tests PASS and TypeScript exits `0`.

- [ ] **Step 6: Commit Task 2**

```bash
git add app/robots.ts app/sitemap.ts src/lib/design/metadata-routes.test.ts
git commit -m "feat: add SEO and GEO crawler routes"
```

---

### Task 3: 페이지별 canonical, Open Graph URL, noindex 추가

**Files:**
- Create: `src/lib/design/seo-metadata-contract.test.ts`
- Modify: `app/page.tsx:1-6`
- Modify: `app/sample/page.tsx:1-15`
- Modify: `app/wishlist/[slug]/page.tsx:13-48`
- Modify: `app/login/page.tsx:1-7`
- Modify: `app/onboarding/page.tsx:1-8`
- Modify: `app/admin/layout.tsx:1-18`

**Interfaces:**
- Produces indexable metadata for `/` and `/sample`
- Produces `noindex, nofollow` metadata for public user, login, onboarding, and admin routes
- Preserves existing public wishlist Open Graph and Twitter metadata

- [ ] **Step 1: Write failing source contract tests**

Create `src/lib/design/seo-metadata-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("SEO metadata contract", () => {
  test("indexes home with self canonical and Open Graph URL", () => {
    const source = read("app/page.tsx");

    expect(source).toContain('import type { Metadata } from "next";');
    expect(source).toContain('canonical: "/"');
    expect(source).toContain('url: "/"');
    expect(source).toContain("index: true");
    expect(source).toContain("follow: true");
  });

  test("indexes sample with self canonical and Open Graph URL", () => {
    const source = read("app/sample/page.tsx");

    expect(source).toContain('canonical: "/sample"');
    expect(source).toContain('url: "/sample"');
    expect(source).toContain("index: true");
    expect(source).toContain("follow: true");
  });

  test("keeps user and account routes out of search results", () => {
    for (const path of [
      "app/wishlist/[slug]/page.tsx",
      "app/login/page.tsx",
      "app/onboarding/page.tsx",
      "app/admin/layout.tsx",
    ]) {
      const source = read(path);
      expect(source, path).toContain("index: false");
      expect(source, path).toContain("follow: false");
    }
  });

  test("preserves public wishlist share metadata", () => {
    const source = read("app/wishlist/[slug]/page.tsx");

    expect(source).toContain("openGraph:");
    expect(source).toContain("twitter:");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

```bash
pnpm test -- src/lib/design/seo-metadata-contract.test.ts
```

Expected: FAIL because canonical, `og:url`, and noindex declarations are missing.

- [ ] **Step 3: Add complete home metadata without losing nested OG fields**

Add to `app/page.tsx`:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "뭐갖고싶어",
    description: "받고 싶은 선물을 링크 하나로 모아 공유하세요.",
    siteName: "뭐갖고싶어",
    locale: "ko_KR",
    type: "website",
    url: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

The full `openGraph` object is intentional because Next.js shallowly replaces nested metadata objects.

- [ ] **Step 4: Extend sample metadata with complete OG fields**

Replace the metadata object in `app/sample/page.tsx` with:

```ts
const sampleTitle = "샘플 위시리스트 | 뭐갖고싶어";
const sampleDescription =
  "뭐갖고싶어로 만들 수 있는 공개 위시리스트 샘플 페이지입니다.";

export const metadata: Metadata = {
  title: sampleTitle,
  description: sampleDescription,
  alternates: {
    canonical: "/sample",
  },
  openGraph: {
    title: sampleTitle,
    description: sampleDescription,
    siteName: "뭐갖고싶어",
    locale: "ko_KR",
    type: "website",
    url: "/sample",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

- [ ] **Step 5: Add noindex metadata to non-indexable routes**

For `app/login/page.tsx`, `app/onboarding/page.tsx`, and `app/admin/layout.tsx`, import `Metadata` and add:

```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

In both return branches of `app/wishlist/[slug]/page.tsx` `generateMetadata`, add:

```ts
robots: {
  index: false,
  follow: false,
},
```

Do not remove the existing `openGraph` or `twitter` objects.

- [ ] **Step 6: Run metadata contract tests and full typecheck**

```bash
pnpm test -- src/lib/design/seo-metadata-contract.test.ts src/lib/design/og-image-contract.test.ts src/lib/auth/login-ui-contract.test.ts src/lib/onboarding/ui-contract.test.ts src/lib/design/admin-theme-contract.test.ts
pnpm typecheck
```

Expected: focused contract tests PASS and TypeScript exits `0`.

- [ ] **Step 7: Commit Task 3**

```bash
git add app/page.tsx app/sample/page.tsx 'app/wishlist/[slug]/page.tsx' app/login/page.tsx app/onboarding/page.tsx app/admin/layout.tsx src/lib/design/seo-metadata-contract.test.ts
git commit -m "feat: define indexable page metadata"
```

---

### Task 4: 전체 자동 검증과 로컬 HTTP 출력 확인

**Files:**
- Verify only; modify no files unless a verified failure requires a scoped fix

**Interfaces:**
- Consumes all outputs from Tasks 1-3
- Produces verification evidence for type, lint, tests, build, and generated routes

- [ ] **Step 1: Run the complete automated checks**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: every command exits `0`. If Vitest fails before loading config, confirm the active Node version satisfies Vite `^20.19.0 || >=22.12.0` before diagnosing application code.

- [ ] **Step 2: Start the production build locally**

```bash
pnpm start
```

Expected: Next.js serves the built app on the configured local port.

- [ ] **Step 3: Verify generated robots and sitemap responses**

```bash
curl -i http://localhost:3000/robots.txt
curl -i http://localhost:3000/sitemap.xml
```

Expected:

- `/robots.txt` returns `200` and `text/plain`.
- `/sitemap.xml` returns `200` and XML.
- sitemap contains only `https://iwantbirthdaygift.com/` and `https://iwantbirthdaygift.com/sample`.
- robots contains the wildcard rule, sitemap URL, host, and training-bot protection rules.

- [ ] **Step 4: Verify rendered page metadata**

```bash
curl -s http://localhost:3000/
curl -s http://localhost:3000/sample
curl -s http://localhost:3000/login
```

Expected:

- Home includes canonical and `og:url` for `https://iwantbirthdaygift.com/`.
- Sample includes canonical and `og:url` for `https://iwantbirthdaygift.com/sample`.
- Login includes `noindex, nofollow`.
- Public wishlist noindex is covered by the source contract and route metadata tests because a valid local slug requires DB fixtures.

- [ ] **Step 5: Check the final diff and repository state**

```bash
git diff --check
git status --short
git log -4 --oneline
```

Expected: no whitespace errors, only intended files changed or committed, and the three implementation commits are present.

---

## Post-deploy Follow-up

After the user separately authorizes deployment or the normal deployment pipeline publishes the commits:

```bash
curl -I https://iwantbirthdaygift.com/robots.txt
curl -I https://iwantbirthdaygift.com/sitemap.xml
```

Then inspect production HTML for canonical, `og:url`, and `robots` meta tags. Google Search Console and Bing Webmaster Tools submission remains a separately authorized external action.
