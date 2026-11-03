# 뭐갖고싶어 전역 작업 점검

작성일: 2026-06-09
최종 코드 대조일: 2026-10-30

> 이 문서는 날짜가 있는 작업 점검 기록입니다. 아래 구현 설명은 2026-10-30 저장소와 정적으로 대조했으며, `검증 결과`의 명령 실행 기록은 2026-06-09 결과 그대로 보존합니다. 이번 대조에서 라이브 OAuth, 운영 DB, 배포 환경이나 E2E를 실행해 확인하지 않았습니다.

## 목적

이 문서는 현재 저장소의 제품 방향, 구현된 범위, 남은 작업, 검증 상태를 한곳에서 확인하기 위한 작업 점검 문서입니다.

근거는 저장소 파일 검사와 별도로 날짜를 표시한 검증 명령 기록입니다. 구현 파일과 테스트 파일의 존재는 실제 환경 검증의 완료를 뜻하지 않습니다.

## 제품 요약

`뭐갖고싶어`는 생일자가 받고 싶은 선물을 위시리스트로 만들고, 친구들이 공개 링크로 들어와 선물과 계좌 안내를 확인한 뒤 비공개 메시지와 금액을 남길 수 있는 생일 위시리스트 서비스입니다.

주요 사용자 흐름:

- 생일자: Google/Kakao 로그인 -> 온보딩 -> `/admin`에서 선물, 메시지, 설정, 공개 링크 관리
- 친구: 로그인 없이 `/wishlist/[slug]` 접속 -> 선물 확인 -> 마음과 메시지 남김

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
  - 근거: `app/wishlist/[slug]/page.tsx`, `app/wishlist/[slug]/not-found.tsx`, `src/lib/public-wishlist/service.ts`, `src/lib/wishlist/theme.ts`, `app/public-themes.css`

- [x] 공개 참여 폼과 메시지/금액 저장 경로
  - 현재 공개 화면은 Server Action으로 제출하고, HTTP API도 별도로 유지합니다.
  - 근거: [공개 참여 폼](../../components/public-wishlist-view.tsx), [Server Action](../../app/wishlist/[slug]/actions.ts), [HTTP API](../../app/api/public/wishlists/[slug]/participation/route.ts), [참여 서비스](../../src/lib/public-participation/service.ts), [저장 구현](../../src/lib/public-participation/repository.ts)

- [x] 어드민 대시보드, 선물 관리, 메시지함, 설정 화면
  - 근거: `app/admin/page.tsx`, `app/admin/wishes/page.tsx`, `app/admin/messages/page.tsx`, `app/admin/settings/page.tsx`, `src/lib/wishes/service.ts`, `src/lib/admin-messages/service.ts`, `src/lib/settings/service.ts`

- [x] 계좌 안내 암호화와 공개 방식별 표시
  - 근거: `src/lib/settings/account-crypto.ts`, `src/lib/settings/service.ts`, `src/lib/public-wishlist/service.ts`, `app/wishlist/[slug]/page.tsx`

- [x] Public Pixel / Admin Calm 비주얼 방향 반영
  - 근거: `app/public-themes.css`, `app/admin/admin-ui.tsx`, `src/lib/design/public-theme-contract.test.ts`, `src/lib/design/admin-theme-contract.test.ts`

## 디자인/UX 참고 요약 (2026-06-09 기록)

아래는 당시 Lazyweb 로컬 산출물에서 기록한 참고 결론입니다. 2026-10-30 현재 체크아웃에는 아래 세 리포트가 없으므로 다시 열어 검증할 수 없습니다. 현행 설명은 [비주얼 설계](../superpowers/specs/2026-05-14-mwagotgo-sipeo-visual-system-design.md), [공개 뷰](../../components/public-wishlist-view.tsx), [관리자 UI](../../app/admin/admin-ui.tsx), [선물 관리](../../app/admin/wishes/page.tsx)와 대조합니다.

- 공개 페이지는 친구에게 보내는 감성 카드처럼 보여야 하며, 선물 카드와 기여 폼을 같은 문맥에서 빠르게 이해할 수 있어야 합니다.
  - 근거: `.lazyweb/quick-references/overall-ui-2026-06-02/report.html`
- 관리자 화면은 공개 페이지 테마와 분리된 운영 UI로 유지합니다. 카드 장식보다 앱 shell, 지표, 조밀한 목록, 짧은 폼을 우선합니다.
  - 근거: `.lazyweb/quick-references/admin-ui-rebuild-2026-06-02/report.html`
- 선물 관리 화면은 긴 추가 폼을 먼저 보여주기보다 상태 탭과 리스트를 먼저 보여주고, 선물 추가는 접힘 영역이나 별도 패널로 낮춥니다.
  - 근거: `.lazyweb/quick-references/admin-wishes-mobile-2026-06-02/report.html`
- Lazyweb MCP 도구는 해당 리포트 작성 세션에서 직접 노출되지 않았고, 로컬 저장 리포트와 공개 레퍼런스를 근거로 삼았습니다.
  - 근거: `.lazyweb/quick-references/overall-ui-2026-06-02/report.html`

## 남은 작업

### P0: README와 Neon 환경 변수 문서 계약 맞추기

- [x] `README.md`에 `Neon`, `DATABASE_URL`, `DATABASE_DIRECT_URL` 설명을 복구했습니다.
- 근거: `corepack pnpm test src/lib/db/neon-config-contract.test.ts`가 통과합니다.
- 완료 내용: 서비스 소개형 README를 유지하면서 `운영 설정` 섹션에 Neon URL 슬롯과 `pnpm db:push` 사용 범위를 문서화했습니다.
- 관련 파일: `README.md`, `src/lib/db/neon-config-contract.test.ts`, `.env.example`, `drizzle.config.ts`

### P1: 개인별/기본 OG 이미지 구현

- [x] `/wishlist/[slug]/opengraph-image`를 추가해 개인별 공개 위시리스트 OG 이미지를 생성합니다.
- [x] 기본 서비스 OG 이미지와 metadata의 `openGraph`/`twitter` 필드를 보강했습니다.
- 근거: 서비스 설계는 개인별 OG 이미지와 기본 서비스 OG 이미지를 포함 범위로 둡니다.
- 완료 내용: `app/opengraph-image.tsx`, `app/wishlist/[slug]/opengraph-image.tsx`, `app/layout.tsx` metadata를 추가했습니다.
- 검증: `src/lib/design/og-image-contract.test.ts`, `corepack pnpm test`, `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm build`
- 관련 파일: `app/wishlist/[slug]/opengraph-image.tsx`, `app/opengraph-image.tsx`, `app/layout.tsx`, `src/lib/design/og-image-contract.test.ts`
- 2026-10-30 대조: 개인별 OG 이미지는 존재하지만 공개 페이지의 선택 테마에 따라 팔레트를 바꾸지는 않습니다. OG 생성 완료와 테마 연동 완료를 구분합니다. 근거: [개인별 OG](../../app/wishlist/[slug]/opengraph-image.tsx)

### P1: 공개 메시지 abuse 방지와 rate limit

- [x] 공개 참여 Server Action과 HTTP API에 rate limit 호출이 있습니다.
- [x] 제한 발생 시 Server Action은 `rate_limited` 오류로 이동하고, HTTP API는 요청 형식에 따라 오류 응답 또는 리다이렉트를 반환합니다.
- 근거: 서비스 설계의 친구 메시지 작성 제한에 rate limit이 포함되어 있습니다.
- 2026-10-30 대조: 위시리스트 slug·IP·User-Agent 조합을 기준으로 60초에 5회 제한하는 메모리 구현입니다. 단일 런타임의 best-effort 제한이며 분산 환경 전체의 제한을 보장하지 않습니다. 운영 배포에서의 효과는 이번에 검증하지 않았습니다.
- 근거: [rate limit 구현](../../src/lib/public-participation/rate-limit.ts), [Server Action](../../app/wishlist/[slug]/actions.ts), [HTTP API](../../app/api/public/wishlists/[slug]/participation/route.ts), [단위 테스트](../../src/lib/public-participation/rate-limit.test.ts)

### P2: 계획 문서 상태 정리

- [x] `docs/superpowers/plans/*`의 체크박스를 실제 구현 상태와 맞췄습니다.
- [x] 완료된 계획, 남은 계획, 더 이상 유효하지 않은 계획을 구분했습니다.
- 근거: public participation, admin settings, public theme 계획 문서에 2026-06-09 상태 업데이트를 추가했고, 현재 구현 파일과 테스트 존재 여부를 기준으로 완료 항목을 정리했습니다.
- 완료 내용: `docs/superpowers/plans/2026-05-15-public-participation-plan.md`, `docs/superpowers/plans/2026-05-15-admin-settings-bank-account-plan.md`, `docs/superpowers/plans/2026-06-01-public-theme-token-integration.md`의 상태를 갱신했습니다. 커밋 단계는 이번 요청 범위에서 제외했습니다.
- 관련 파일: `docs/superpowers/plans/2026-05-15-public-participation-plan.md`, `docs/superpowers/plans/2026-05-15-admin-settings-bank-account-plan.md`, `docs/superpowers/plans/2026-06-01-public-theme-token-integration.md`

### P2: 핵심 E2E 또는 실환경 흐름 검증

- [ ] 신규 사용자 로그인 후 온보딩 완료 흐름을 검증합니다.
- [ ] 생일자가 선물을 추가하고 공개 페이지에서 보이는지 검증합니다.
- [ ] 친구가 공개 페이지에서 메시지와 금액을 남기고 어드민 메시지함에서 확인되는지 검증합니다.
- [ ] 설정에서 계좌를 등록·수정한 뒤 공개 페이지 안내와 번호 복사가 맞는지 검증합니다. 현재 설정 저장은 `copy_only`이며 공개 방식 선택 UI는 없습니다. 근거: [계좌 설정](../../src/lib/settings/service.ts), [설정 화면](../../app/admin/settings/page.tsx).
- 근거: 서비스 설계의 E2E 테스트 전략에 핵심 사용자 흐름이 명시되어 있습니다.
- 2026-10-30 대조: [Playwright 설정](../../playwright.config.ts), [샘플 E2E 계획](../../specs/sample-wishlist.md), [샘플 테스트](../../tests/sample/valid-themes.spec.ts), [비로그인 온보딩 테스트](../../tests/auth/onboarding-unauthenticated.spec.ts)가 있습니다. 현재 설정은 데스크톱 Chromium이며 `/sample` 테스트는 읽기 전용 데모를 검증합니다.
- 위 네 가지 실제 로그인·DB 쓰기 흐름은 샘플 테스트의 존재만으로 완료 처리하지 않습니다. 이번 문서 작업에서는 E2E를 실행하지 않았습니다.

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

## 과거 검증 결과 (2026-06-09)

2026-06-09 P0 처리 후 실행 결과:

- [x] `corepack pnpm test`
  - 결과: 통과
  - 범위: 22개 테스트 파일 통과, 116개 테스트 통과

- [x] `corepack pnpm typecheck`
  - 결과: 통과

- [x] `corepack pnpm lint`
  - 결과: 통과

- [x] `corepack pnpm build`
  - 결과: 통과
  - 빌드 라우트 확인: `/`, `/admin`, `/admin/messages`, `/admin/settings`, `/admin/wishes`, `/api/admin/settings`, `/api/admin/wishes`, `/api/admin/wishes/[id]`, `/api/auth/[...nextauth]`, `/api/onboarding`, `/api/public/wishlists/[slug]/participation`, `/auth/after-login`, `/wishlist/[slug]`, `/login`, `/onboarding`
  - OG 라우트 확인: `/opengraph-image`, `/wishlist/-/opengraph-image`

## 전역 점검 루틴

기능 변경 시 아래 명령 중 변경 범위에 맞는 검증을 실행하고 실행 날짜와 결과를 기록합니다. 문서만 바뀐 작업은 링크·경로·설명 정합성을 우선 확인하며, 이 과거 점검 문서만으로 모든 앱 검증을 반복할 필요는 없습니다.

```powershell
git status --short
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

기능 변경 작업에서는 대상 테스트와 `typecheck`, `lint`, `build`를 함께 보고, 실패가 기존 이슈인지 새 변경 때문인지 구분합니다.

## 워킹트리 메모

2026-06-09 문서 작성 당시 `git status --short` 기준으로 기존 untracked `.claude/`가 있었습니다. 이 메모는 당시 기록이며 현재 워킹트리 상태를 설명하지 않습니다.
