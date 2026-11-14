# E2E 테스트 명세

이 디렉터리는 Playwright 테스트의 시나리오와 기대 동작을 설명합니다. 제품·기능 설계 문서가 있는 `docs/superpowers/specs/`와 구분합니다. 전체 문서 역할은 [문서 안내](../docs/README.md)를 확인합니다.

## 읽는 순서

1. [샘플 위시리스트 테스트 계획](sample-wishlist.md), [공개 위시리스트 참여 흐름 테스트 계획](wishlist-participation.md), [관리자 화면 테스트 계획(1차)](admin-management.md)에서 대상·전제·시나리오·범위 밖 항목을 확인합니다.
2. [Playwright 설정](../playwright.config.ts)에서 실제 실행 프로젝트·baseURL·웹 서버 설정을 확인합니다.
3. [샘플 테마 테스트](../tests/sample/valid-themes.spec.ts) 등 `tests/sample/`, `tests/wishlist/`, `tests/admin/`의 코드와 기대 동작을 대조합니다. [비로그인 온보딩 테스트](../tests/auth/onboarding-unauthenticated.spec.ts)는 별도 인증 경계 사례입니다. `tests/admin/`은 OAuth 대신 [관리자 fixture](../tests/fixtures/admin.ts)가 `sessions` 행과 세션 쿠키를 넣어 로그인합니다.

`pnpm test:e2e`로 실행할 수 있습니다. 실행 전에 로컬 Postgres(`localhost:5432`)가 떠 있어야 하고, 최초 1회 `createdb mwagotgo_e2e`로 E2E 전용 DB를 만듭니다. 스키마는 [globalSetup](../tests/global-setup.ts)이 마이그레이션으로 맞추고, Playwright가 띄우는 3200 포트 dev 서버는 `DATABASE_URL`·`ACCOUNT_ENCRYPTION_SECRET`만 [E2E 값](../tests/support/e2e-db.ts)으로 바꿉니다. 현재 설정은 데스크톱 Chromium이며, `/sample`은 실제 공개 뷰를 읽기 전용 데모로 재사용하고, `tests/wishlist/`와 `tests/admin/`은 이 로컬 DB에 쓰고 조회합니다. 테스트 파일이 있다는 사실은 실제 OAuth 흐름이나 시각적 회귀 비교가 검증됐다는 뜻이 아닙니다.

UI 사용 규칙은 [디자인 가이드](../docs/design/README.md)에 둡니다. 시나리오와 코드가 다르면 현재 동작과 의도를 대조한 뒤 함께 갱신하고, 실제 실행 결과는 날짜가 있는 점검 기록에 남깁니다.
