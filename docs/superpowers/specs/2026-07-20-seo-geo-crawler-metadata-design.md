# 뭐갖고싶어 SEO·GEO 크롤러 및 메타데이터 설계

작성일: 2026-07-20

## 1. 목적

배포 사이트 `https://iwantbirthdaygift.com`에서 검색엔진과 AI 답변 엔진이 서비스 소개 페이지를 안정적으로 발견하고 인용할 수 있도록 메타데이터와 크롤러 정책을 보완합니다.

검색 노출 대상은 다음 두 페이지만으로 제한합니다.

- 홈: `/`
- 샘플 위시리스트: `/sample`

사용자별 공개 위시리스트, 로그인, 온보딩, 관리, 인증, API 경로는 sitemap에서 제외합니다. 특히 사용자별 위시리스트에 표시될 수 있는 이름, 소개, 계좌 안내가 검색 결과나 AI 학습 데이터에 의도치 않게 노출되지 않도록 별도 정책을 적용합니다.

## 2. 확인된 현재 상태

2026-07-20 배포본 점검 결과는 다음과 같습니다.

- `GET /robots.txt`가 `404`를 반환합니다.
- `GET /sitemap.xml`이 `404`를 반환합니다.
- 홈 문서에 canonical 링크가 없습니다.
- 홈 Open Graph 메타데이터에 `og:url`이 없습니다.
- 서비스 및 공개 위시리스트용 OG 이미지는 이미 구현되어 있습니다.
- 루트 메타데이터는 `AUTH_URL`을 기반으로 `metadataBase`를 계산합니다.

관련 코드:

- `app/layout.tsx`
- `app/page.tsx`
- `app/sample/page.tsx`
- `app/wishlist/[slug]/page.tsx`
- `app/login/page.tsx`
- `app/onboarding/page.tsx`
- `app/admin/layout.tsx`
- `src/lib/design/og-image-contract.test.ts`

## 3. 설계 원칙

### 3.1 검색 노출과 크롤링을 분리합니다

`robots.txt`는 크롤링 트래픽을 제어하고, 페이지별 `robots` 메타데이터는 검색 결과 포함 여부를 제어합니다.

Google 공식 문서에 따르면 `robots.txt`로 차단한 페이지는 크롤러가 `noindex` 메타데이터를 읽을 수 없으며, 외부 링크를 통해 URL 자체가 검색 결과에 나타날 수 있습니다. 따라서 공개 접근이 가능한 비노출 페이지는 검색 크롤러가 읽을 수 있게 두고 페이지 수준에서 `noindex`를 반환합니다.

### 3.2 sitemap은 명시적으로 두 URL만 제공합니다

동적 위시리스트 slug를 DB에서 읽거나 sitemap에 포함하지 않습니다. sitemap 생성은 DB와 인증 상태에 의존하지 않는 정적·결정적 함수로 유지합니다.

### 3.3 canonical과 `og:url`은 페이지별로 지정합니다

루트 layout에 canonical `/`을 넣으면 하위 페이지가 홈 canonical을 잘못 상속할 수 있습니다. 따라서 홈과 샘플 페이지가 각각 자신의 canonical과 `og:url`을 선언합니다.

### 3.4 검색·답변용 봇과 학습용 봇을 구분합니다

검색 및 사용자 요청에 따라 콘텐츠를 가져오는 봇은 홈과 샘플을 읽을 수 있어야 합니다. 모델 학습 목적의 봇도 마케팅 콘텐츠인 홈과 샘플만 읽을 수 있게 하며, 사용자별 위시리스트와 운영 경로는 차단합니다.

## 4. URL별 정책

| 경로 | sitemap | 검색 인덱싱 | 일반 검색·답변 크롤링 | AI 학습 크롤링 |
| --- | --- | --- | --- | --- |
| `/` | 포함 | `index, follow` | 허용 | 허용 |
| `/sample` | 포함 | `index, follow` | 허용 | 허용 |
| `/wishlist/[slug]` | 제외 | `noindex, nofollow` | `noindex` 확인을 위해 허용 | 차단 |
| `/login` | 제외 | `noindex, nofollow` | `noindex` 확인을 위해 허용 | 차단 |
| `/onboarding` | 제외 | `noindex, nofollow` | `noindex` 확인을 위해 허용 | 차단 |
| `/admin/**` | 제외 | 인증으로 보호 | 차단 | 차단 |
| `/api/**` | 제외 | 해당 없음 | 차단 | 차단 |
| `/auth/**` | 제외 | 해당 없음 | 차단 | 차단 |

## 5. 크롤러 정책

### 5.1 일반 검색·답변 크롤러

기본 `User-agent: *` 규칙은 공개 HTML 접근을 허용하고 운영 경로만 차단합니다.

- 허용 대상 예시: Googlebot, Bingbot, 네이버 검색 크롤러, `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`
- 허용: `/`
- 차단: `/admin/`, `/api/`, `/auth/`
- sitemap: `https://iwantbirthdaygift.com/sitemap.xml`
- host: `https://iwantbirthdaygift.com`

`/wishlist/`, `/login`, `/onboarding`은 이 기본 그룹에서 차단하지 않습니다. 해당 페이지의 `noindex` 메타데이터를 크롤러가 읽어야 하기 때문입니다.

### 5.2 AI 학습·확장 크롤러

다음 토큰은 별도 규칙으로 관리합니다.

- `GPTBot`: OpenAI 모델 학습 목적
- `ClaudeBot`: Anthropic 모델 학습 목적
- `Google-Extended`: Gemini 모델 학습 및 Google 검색 기반 그라운딩 제어

각 봇은 전체 경로를 기본 차단하고 홈과 샘플의 정확한 경로만 예외로 허용합니다.

- 허용: `/$`, `/sample$`
- 차단: `/`

robots 경로 패턴의 `$` 끝 일치 문자를 사용하므로 `/sample`의 하위 경로나 앞으로 추가될 새 라우트가 학습용 봇에 자동으로 허용되지 않습니다. 이 규칙은 사용자별·인증·관리 경로를 포함한 나머지 전체 경로를 차단합니다.

이 정책은 서비스 소개 콘텐츠의 GEO 가능성을 열어 두면서 사용자별 콘텐츠는 학습 수집 대상에서 제외합니다.

### 5.3 robots.txt의 한계

- robots 규칙 준수 여부는 크롤러 사업자에 따라 달라질 수 있습니다.
- User-Agent 문자열만으로 진짜 봇을 인증할 수 없습니다.
- 향후 WAF나 봇 차단 기능을 도입하면 공식 IP 대역 또는 검증 방식도 함께 적용해야 합니다.
- 크롤러 허용은 검색·AI 답변 노출의 필요조건일 수 있지만 노출이나 순위를 보장하지 않습니다.

## 6. 파일 설계

### 6.1 사이트 기준 URL 모듈

새 파일 `src/lib/metadata/site-url.ts`에서 사이트 기준 URL 계산을 담당합니다.

책임:

- 기존 `AUTH_URL` 값을 정리하고 `http://` 또는 `https://`가 없으면 보완합니다.
- 유효한 URL이면 origin 기준 URL을 반환합니다.
- 누락되거나 잘못된 값이면 `https://iwantbirthdaygift.com`을 반환합니다.
- `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`가 동일한 기준 URL을 사용하게 합니다.

기존 `app/layout.tsx`의 `resolveMetadataBase` 로직은 이 모듈로 이동합니다. 메타데이터가 실수로 `localhost`를 canonical 또는 sitemap에 출력하지 않도록 운영 도메인을 최종 fallback으로 사용합니다.

### 6.2 `app/robots.ts`

Next.js `MetadataRoute.Robots`를 반환하는 정적 함수를 추가합니다.

책임:

- 기본 크롤러 규칙을 생성합니다.
- AI 학습·확장 봇별 보호 경로 규칙을 생성합니다.
- 절대 sitemap URL과 host를 제공합니다.
- DB, 세션, 요청 헤더를 읽지 않아 기본 캐시 가능한 메타데이터 라우트로 유지합니다.

### 6.3 `app/sitemap.ts`

Next.js `MetadataRoute.Sitemap`을 반환하는 정적 함수를 추가합니다.

반환 항목:

- `https://iwantbirthdaygift.com/`
  - `changeFrequency: "monthly"`
  - `priority: 1`
- `https://iwantbirthdaygift.com/sample`
  - `changeFrequency: "monthly"`
  - `priority: 0.8`

실제 콘텐츠 수정 시각을 추적하지 않으므로 부정확한 `lastModified`는 넣지 않습니다.

### 6.4 홈 메타데이터

`app/page.tsx`에 페이지 수준 `Metadata`를 추가합니다.

- `alternates.canonical: "/"`
- `openGraph.url: "/"`
- `robots.index: true`
- `robots.follow: true`

기존 루트 title, description, OG 이미지 설정은 그대로 상속합니다.

### 6.5 샘플 메타데이터

`app/sample/page.tsx`의 기존 `metadata`를 확장합니다.

- `alternates.canonical: "/sample"`
- `openGraph.url: "/sample"`
- `robots.index: true`
- `robots.follow: true`

기존 샘플 title과 description은 유지합니다.

### 6.6 비노출 페이지 메타데이터

다음 페이지 또는 route segment에 `robots: { index: false, follow: false }`를 추가합니다.

- `app/wishlist/[slug]/page.tsx`의 `generateMetadata`
- `app/login/page.tsx`
- `app/onboarding/page.tsx`
- `app/admin/layout.tsx`

공개 위시리스트의 OG title, description, image는 공유 미리보기를 위해 유지합니다. `noindex`는 소셜 공유용 Open Graph 메타데이터를 제거하지 않습니다.

## 7. 데이터 흐름

```text
AUTH_URL 또는 운영 fallback
→ resolveSiteUrl()
→ metadataBase / robots sitemap·host / sitemap URL 생성

검색·답변 크롤러
→ /robots.txt 확인
→ / 또는 /sample 크롤링
→ canonical + index/follow + OG URL 확인
→ /sitemap.xml에서 두 URL만 발견

공개 위시리스트 크롤러
→ 페이지 접근
→ noindex, nofollow 확인
→ 검색 결과에서 제외

AI 학습 크롤러
→ /robots.txt의 봇별 규칙 확인
→ /와 /sample만 수집 가능
→ 사용자별·인증·관리 경로 차단
```

## 8. 오류 처리

- `AUTH_URL`이 없거나 잘못되어도 빌드와 메타데이터 라우트 생성은 실패하지 않습니다.
- URL fallback은 항상 `https://iwantbirthdaygift.com`입니다.
- sitemap은 DB를 조회하지 않으므로 DB 장애와 무관하게 반환됩니다.
- robots와 sitemap 함수는 네트워크를 호출하지 않습니다.
- 존재하지 않는 페이지나 비공개 데이터 때문에 sitemap 생성이 실패하는 경로를 만들지 않습니다.

## 9. 테스트 전략

### 9.1 테스트 우선 순서

1. 사이트 URL 정규화와 fallback 테스트를 먼저 작성합니다.
2. robots 함수의 기본·AI 봇별 규칙 테스트를 작성합니다.
3. sitemap이 홈·샘플 두 URL만 반환하는 테스트를 작성합니다.
4. 홈·샘플 canonical과 `og:url` 계약 테스트를 작성합니다.
5. 공개 위시리스트·로그인·온보딩·관리 화면의 `noindex` 계약 테스트를 작성합니다.
6. 구현 후 전체 검증을 수행합니다.

### 9.2 자동 검증

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

현재 로컬 Node `v20.15.0`은 설치된 Vite `8.0.12`의 요구사항인 `^20.19.0 || >=22.12.0`보다 낮아 Vitest 설정 로딩이 실패합니다. 구현 검증 전 호환되는 Node 런타임을 사용해야 하며, 테스트 실패를 코드 실패로 오판하지 않습니다.

### 9.3 로컬 런타임 검증

빌드된 앱을 실행한 뒤 다음을 확인합니다.

- `/robots.txt`가 `200`과 `text/plain`을 반환합니다.
- `/sitemap.xml`이 `200`과 XML content type을 반환합니다.
- sitemap에는 `/`와 `/sample`만 있습니다.
- 홈 canonical과 `og:url`은 `https://iwantbirthdaygift.com/`입니다.
- 샘플 canonical과 `og:url`은 `https://iwantbirthdaygift.com/sample`입니다.
- 공개 위시리스트, 로그인, 온보딩 응답에는 `noindex`가 있습니다.
- robots 출력에 `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`을 막는 규칙이 없습니다.
- robots 출력의 `GPTBot`, `ClaudeBot`, `Google-Extended` 규칙은 사용자별·인증·관리 경로를 차단합니다.

### 9.4 배포 후 검증

배포 이후 실제 운영 URL에서 다음을 다시 확인합니다.

- `curl -I https://iwantbirthdaygift.com/robots.txt`
- `curl -I https://iwantbirthdaygift.com/sitemap.xml`
- 운영 HTML의 canonical, `og:url`, robots 메타데이터
- Google Search Console 및 Bing Webmaster Tools에 sitemap 제출

Search Console과 Bing Webmaster Tools 등록·제출은 외부 계정 상태를 변경하므로 별도 사용자 승인 작업으로 남깁니다.

## 10. 완료 기준

- 운영 `/robots.txt`와 `/sitemap.xml`이 더 이상 404가 아닙니다.
- sitemap에는 홈과 샘플만 포함됩니다.
- 홈과 샘플은 각각 자기 자신을 canonical 및 `og:url`로 가리킵니다.
- 공개 위시리스트, 로그인, 온보딩, 관리 화면은 검색 인덱싱 대상이 아닙니다.
- 검색 및 AI 답변 크롤러는 홈과 샘플을 크롤링할 수 있습니다.
- AI 학습 크롤러는 홈과 샘플만 사용할 수 있고 사용자별 콘텐츠에는 접근할 수 없습니다.
- 기존 OG 이미지와 공유 미리보기 동작은 유지됩니다.
- typecheck, lint, test, build 결과가 기록됩니다.

## 11. 제외 범위

다음은 이번 작업에 포함하지 않습니다.

- 사용자별 위시리스트를 sitemap에 추가하는 기능
- DB 기반 동적 sitemap
- JSON-LD 구조화 데이터
- `llms.txt`
- 검색 순위 또는 AI 답변 인용 보장
- Search Console·Bing Webmaster Tools 계정 연결 및 sitemap 제출
- CDN/WAF의 봇 IP 허용 목록 자동 동기화
- 디자인 또는 문구 변경

구조화 데이터와 `llms.txt`는 실제 검색 노출 데이터를 확인한 뒤 별도 작업으로 평가합니다. 현재 범위에서는 표준화된 Next.js 메타데이터, sitemap, robots, canonical, 공식 크롤러 정책을 우선합니다.

## 12. 근거 문서

- Next.js 16 로컬 문서: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
- Next.js 16 로컬 문서: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- Next.js 16 로컬 문서: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
- Google Search Central robots 안내: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Google robots meta 안내: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google-Extended 안내: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- OpenAI 게시자·개발자 안내: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Anthropic 크롤러 안내: https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Perplexity 크롤러 안내: https://docs.perplexity.ai/docs/resources/perplexity-crawlers

## 13. 결정 기록

- 검색 대상은 홈과 샘플만으로 확정했습니다.
- 사용자별 공개 위시리스트는 sitemap에서 제외하고 `noindex, nofollow`를 적용합니다.
- 검색·답변 크롤러는 공개 페이지를 읽을 수 있게 합니다.
- 모델 학습 크롤러는 홈과 샘플만 허용합니다.
- canonical은 루트 layout이 아니라 페이지 수준에서 지정합니다.
- 구현은 Next.js의 `robots.ts`, `sitemap.ts`, Metadata API를 사용합니다.
