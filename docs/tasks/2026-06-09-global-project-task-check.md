# 뭐갖고싶어 전역 작업 점검

작성일: 2026-06-09

## 목적

이 문서는 현재 저장소의 제품 방향, 구현된 범위, 남은 작업, 검증 상태를 한곳에서 확인하기 위한 작업 점검 문서입니다.

근거는 현재 저장소 파일 검사와 2026-06-09에 실행한 검증 명령입니다. 라이브 OAuth, 실제 Neon DB 연결, 배포 환경 동작은 이 문서 작성 시점에 직접 검증하지 않았습니다.

## 제품 요약

`뭐갖고싶어`는 생일자가 받고 싶은 선물을 위시리스트로 만들고, 친구들이 공개 링크로 들어와 선물과 계좌 안내를 확인한 뒤 비공개 메시지와 금액을 남길 수 있는 생일 위시리스트 서비스입니다.

주요 사용자 흐름:

- 생일자: Google/Kakao 로그인 -> 온보딩 -> `/admin`에서 선물, 메시지, 설정, 공개 링크 관리
- 친구: 로그인 없이 `/b/[slug]` 접속 -> 선물 확인 -> 마음과 메시지 남김

근거:

- `README.md`
- `docs/superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md`
- `docs/superpowers/specs/2026-05-14-mwagotgo-sipeo-visual-system-design.md`

## 현재 구현 상태

### 완료로 보는 범위

- [x] Auth.js 기반 Google/Kakao 로그인 골격
  - 근거: `auth.ts`, `app/login/actions.ts`, `app/api/auth/[...nextauth]/route.ts`

- [x] 로그인 후 온보딩 상태에 따른 진입 분기
  - 근거: `app/login/page.tsx`, `app/auth/after-login/route.ts`, `src/lib/auth/login-ui-contract.test.ts`

- [x] 신규 사용자 온보딩과 서버 생성 공개 slug
  - 근거: `app/onboarding/page.tsx`, `app/onboarding/birthday-picker.tsx`, `app/api/onboarding/route.ts`, `src/lib/onboarding/service.ts`, `src/lib/wishlist/slug.ts`

- [x] Postgres/Drizzle schema와 Neon direct/runtime URL 분리
  - 근거: `src/lib/db/schema/index.ts`, `src/lib/db/schema/service.ts`, `drizzle.config.ts`, `.env.example`

- [x] 공개 위시리스트 조회와 공개 테마 적용
  - 근거: `app/b/[slug]/page.tsx`, `app/b/[slug]/not-found.tsx`, `src/lib/public-wishlist/service.ts`, `src/lib/wishlist/theme.ts`, `app/public-themes.css`

- [x] 공개 참여 폼과 메시지/금액 저장 경로
  - 근거: `app/b/[slug]/page.tsx`, `app/api/public/wishlists/[slug]/participation/route.ts`, `src/lib/public-participation/service.ts`, `src/lib/public-participation/repository.ts`

- [x] 어드민 대시보드, 선물 관리, 메시지함, 설정 화면
  - 근거: `app/admin/page.tsx`, `app/admin/wishes/page.tsx`, `app/admin/messages/page.tsx`, `app/admin/settings/page.tsx`, `src/lib/wishes/service.ts`, `src/lib/admin-messages/service.ts`, `src/lib/settings/service.ts`

- [x] 계좌 안내 암호화와 공개 방식별 표시
  - 근거: `src/lib/settings/account-crypto.ts`, `src/lib/settings/service.ts`, `src/lib/public-wishlist/service.ts`, `app/b/[slug]/page.tsx`

- [x] Public Pixel / Admin Calm 비주얼 방향 반영
  - 근거: `app/public-themes.css`, `app/admin/admin-ui.tsx`, `src/lib/design/public-theme-contract.test.ts`, `src/lib/design/admin-theme-contract.test.ts`

## 남은 작업

### P0: README와 Neon 환경 변수 문서 계약 맞추기

- [x] `README.md`에 `Neon`, `DATABASE_URL`, `DATABASE_DIRECT_URL` 설명을 복구했습니다.
- 근거: `corepack pnpm test src/lib/db/neon-config-contract.test.ts`가 통과합니다.
- 완료 내용: 서비스 소개형 README를 유지하면서 `운영 설정` 섹션에 Neon URL 슬롯과 `pnpm db:push` 사용 범위를 문서화했습니다.
- 관련 파일: `README.md`, `src/lib/db/neon-config-contract.test.ts`, `.env.example`, `drizzle.config.ts`

### P1: 개인별/기본 OG 이미지 구현

- [ ] `/b/[slug]/opengraph-image`를 추가해 개인별 공개 위시리스트 OG 이미지를 생성합니다.
- [ ] 기본 서비스 OG 이미지 또는 metadata의 `openGraph`/`twitter` 필드를 보강합니다.
- 근거: 서비스 설계는 개인별 OG 이미지와 기본 서비스 OG 이미지를 포함 범위로 둡니다.
- 현재 확인: `rg --files app | rg 'opengraph-image'` 결과가 없고, `app/layout.tsx` metadata는 `title`과 `description`만 정의합니다.
- 관련 파일 후보: `app/b/[slug]/opengraph-image.tsx`, `app/opengraph-image.tsx`, `app/layout.tsx`, `src/lib/public-wishlist/service.ts`

### P1: 공개 메시지 abuse 방지와 rate limit

- [ ] 비로그인 공개 참여 API에 IP 또는 세션 기반 rate limit을 추가합니다.
- [ ] rate limit 발생 시 공개 페이지로 재시도 가능한 에러 코드를 돌려줍니다.
- 근거: 서비스 설계의 친구 메시지 작성 제한에 rate limit이 포함되어 있습니다.
- 현재 확인: `rg -n 'rate limit|rateLimit|ratelimit|IP|headers\\(|cookies\\(' src app docs` 실행 시 코드 구현 없이 문서만 검색됩니다.
- 관련 파일 후보: `app/api/public/wishlists/[slug]/participation/route.ts`, `src/lib/public-participation/service.ts`

### P2: 계획 문서 상태 정리

- [ ] `docs/superpowers/plans/*`의 체크박스를 실제 구현 상태와 맞춥니다.
- [ ] 완료된 계획, 남은 계획, 더 이상 유효하지 않은 계획을 구분합니다.
- 근거: public participation, admin settings, public theme 계획 문서의 체크박스는 미완료 상태지만 실제 구현 파일과 테스트가 존재합니다.
- 관련 파일: `docs/superpowers/plans/2026-05-15-public-participation-plan.md`, `docs/superpowers/plans/2026-05-15-admin-settings-bank-account-plan.md`, `docs/superpowers/plans/2026-06-01-public-theme-token-integration.md`

### P2: 핵심 E2E 또는 실환경 흐름 검증

- [ ] 신규 사용자 로그인 후 온보딩 완료 흐름을 검증합니다.
- [ ] 생일자가 선물을 추가하고 공개 페이지에서 보이는지 검증합니다.
- [ ] 친구가 공개 페이지에서 메시지와 금액을 남기고 어드민 메시지함에서 확인되는지 검증합니다.
- [ ] 설정에서 계좌 공개 방식을 바꾸고 공개 페이지 표시가 맞는지 검증합니다.
- 근거: 서비스 설계의 E2E 테스트 전략에 핵심 사용자 흐름이 명시되어 있습니다.
- 현재 확인: `rg --files | rg 'e2e|playwright|cypress'` 결과가 없습니다.
- 관련 파일 후보: Playwright 설정과 E2E 테스트, 또는 수동 QA 체크리스트 문서

## 명시적 제외 범위

다음 항목은 설계상 1차 범위에서 제외되어 있으므로 현재 남은 작업으로 보지 않습니다.

- 실제 결제
- 자동 정산
- 친구 회원가입
- 배송지 관리
- 알림톡, 문자, 이메일 알림
- AI 선물 추천
- 복잡한 테마 마켓

근거: `docs/superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md`

## 검증 결과

2026-06-09 P0 처리 후 실행 결과:

- [x] `corepack pnpm test`
  - 결과: 통과
  - 범위: 21개 테스트 파일 통과, 113개 테스트 통과

- [x] `corepack pnpm typecheck`
  - 결과: 통과

- [x] `corepack pnpm lint`
  - 결과: 통과

- [x] `corepack pnpm build`
  - 결과: 통과
  - 빌드 라우트 확인: `/`, `/admin`, `/admin/messages`, `/admin/settings`, `/admin/wishes`, `/api/admin/settings`, `/api/admin/wishes`, `/api/admin/wishes/[id]`, `/api/auth/[...nextauth]`, `/api/onboarding`, `/api/public/wishlists/[slug]/participation`, `/auth/after-login`, `/b/[slug]`, `/login`, `/onboarding`

## 전역 점검 루틴

새 작업 전후로 아래 순서로 확인합니다.

```powershell
git status --short
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

기능 변경 작업에서는 대상 테스트와 `typecheck`, `lint`, `build`를 함께 보고, 실패가 기존 이슈인지 새 변경 때문인지 구분합니다.

## 워킹트리 메모

문서 작성 전 `git status --short` 기준으로 기존 untracked `.claude/`가 있었습니다. 이 문서는 `.claude/`를 건드리지 않습니다.
