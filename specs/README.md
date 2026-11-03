# E2E 테스트 명세

이 디렉터리는 Playwright 테스트의 시나리오와 기대 동작을 설명합니다. 제품·기능 설계 문서가 있는 `docs/superpowers/specs/`와 구분합니다. 전체 문서 역할은 [문서 안내](../docs/README.md)를 확인합니다.

## 읽는 순서

1. [샘플 위시리스트 테스트 계획](sample-wishlist.md)에서 대상·전제·시나리오·범위 밖 항목을 확인합니다.
2. [Playwright 설정](../playwright.config.ts)에서 실제 실행 프로젝트·baseURL·웹 서버 설정을 확인합니다.
3. [샘플 테마 테스트](../tests/sample/valid-themes.spec.ts) 등 `tests/sample/`의 코드와 기대 동작을 대조합니다. [비로그인 온보딩 테스트](../tests/auth/onboarding-unauthenticated.spec.ts)는 별도 인증 경계 사례입니다.

`pnpm test:e2e`로 실행할 수 있습니다. 현재 설정은 데스크톱 Chromium이며, `/sample`은 실제 공개 뷰를 읽기 전용 데모로 재사용합니다. 테스트 파일이 있다는 사실은 실제 OAuth·DB 쓰기 흐름이나 시각적 회귀 비교가 검증됐다는 뜻이 아닙니다.

시나리오와 코드가 다르면 현재 동작과 의도를 대조한 뒤 함께 갱신하고, 실제 실행 결과는 날짜가 있는 점검 기록에 남깁니다.
