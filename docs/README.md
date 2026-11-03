# 문서 안내

정리 기준일: 2026-10-30

이 문서는 `뭐갖고싶어`의 문서 역할과 읽는 순서를 안내합니다. 기존 파일은 이동하지 않고, 현행 사용 규칙·설계 의도·과거 실행 기록을 구분합니다.

## 읽는 순서

| 하려는 일 | 먼저 읽을 문서 | 이어서 확인할 근거 |
| --- | --- | --- |
| 제품과 사용자 흐름 파악 | [프로젝트 소개](../README.md) | [서비스 설계](superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md) |
| UI 작성·수정 | [디자인 가이드](design/README.md) | 대상 영역의 토큰·컴포넌트·패턴과 실제 화면 코드 |
| 특정 기능의 의도 확인 | 아래 기능별 설계 | 해당 기능 코드와 테스트 |
| DB 스키마 변경·반영 | [DB 운영 가이드](db-migrations.md) | [Drizzle 설정](../drizzle.config.ts), [마이그레이션 journal](../src/lib/db/migrations/meta/_journal.json), 실제 DB 진단 |
| E2E 작성·수정 | [테스트 명세 안내](../specs/README.md) | [Playwright 설정](../playwright.config.ts), 해당 테스트 코드 |
| 과거 결정·검증 확인 | 아래 계획·점검 기록 | 기록 날짜와 당시 범위, 이후 변경된 코드 |

AI 에이전트의 공통 작업 지침은 [AGENTS.md](../AGENTS.md)에 있습니다. [CLAUDE.md](../CLAUDE.md)도 같은 진입점을 참조합니다.

## 문서 위계와 역할

문서의 위치는 역할을 나타냅니다. 파일명의 날짜만으로 우선순위를 정하지 않습니다.

| 위치 | 역할 | 유지할 내용 |
| --- | --- | --- |
| 루트 `README.md` | 제품 소개와 문서 진입점 | 사용 흐름·현재 기능·운영 안내 링크 |
| `AGENTS.md` | 에이전트가 읽을 문서와 작업 규칙 | 상황별 참조 경로, 검증·변경 원칙 |
| `docs/design/` | 현재 UI를 선택·재사용하는 가이드 | 디자인 영역·토큰 역할·컴포넌트 선택·상태와 흐름 |
| `docs/superpowers/specs/` | 서비스·기능의 설계 의도와 구현 범위 | 제품 제약·기능별 결정·명시적 예외·현행 구현과의 차이 |
| `docs/superpowers/plans/` | 당시 실행 계획의 기록 | 최초 순서·코드 구상·후속 변경 안내. 현행 작업 목록으로 자동 재실행하지 않음 |
| `docs/tasks/` | 날짜별 조사·검증 기록 | 확인 방법·실행 날짜·결과·확인하지 않은 범위 |
| 루트 `specs/` | E2E 시나리오와 기대 동작 | 테스트 의도·대상·전제·범위 밖 항목 |
| `docs/db-migrations.md` | DB 운영 절차 | 현재 명령·진단 기준과 과거 baseline 예시의 구분 |

루트 `specs/`는 테스트 명세이고, `docs/superpowers/specs/`는 제품·기능 설계입니다. 서로 다른 역할이므로 같은 이름만 보고 혼용하지 않습니다.

## 설계 문서

| 문서 | 담당 범위 |
| --- | --- |
| [서비스 설계](superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md) | 사용자·기능·데이터·권한·아키텍처와 초기 범위 |
| [비주얼 시스템 설계](superpowers/specs/2026-05-14-mwagotgo-sipeo-visual-system-design.md) | Public Pixel / Admin Calm의 배경, 초기 결정과 현재 표현 |
| [SEO·메타데이터 설계](superpowers/specs/2026-07-20-seo-geo-crawler-metadata-design.md) | sitemap·크롤러·canonical·개인 페이지 비노출 의도 |
| [관리자 첫 진입 안내 설계](superpowers/specs/2026-07-22-admin-first-entry-guide-design.md) | 안내 모달의 흐름·저장·모션·접근성과 관리자 장식 예외 |

디자인 가이드는 위 문서의 제품 의도와 기능별 예외를 바탕으로, 반복되는 UI 작업에서 무엇을 재사용할지 안내합니다. 기능별 설계를 전부 복사해 또 하나의 원본으로 만들지 않습니다.

## 계획·점검 이력

다음 계획은 최초 구현의 기록입니다. 파일 생성 목록·체크박스·코드 예시가 현재 구현과 같다고 가정하지 말고 상단의 역할과 후속 변경 안내부터 읽습니다.

- [기반 구현 계획](superpowers/plans/2026-05-14-mwagotgo-sipeo-foundation-plan.md)
- [설정·계좌 계획](superpowers/plans/2026-05-15-admin-settings-bank-account-plan.md)
- [공개 참여 계획](superpowers/plans/2026-05-15-public-participation-plan.md)
- [공개 테마 통합 계획](superpowers/plans/2026-06-01-public-theme-token-integration.md)
- [SEO·메타데이터 계획](superpowers/plans/2026-07-20-seo-geo-crawler-metadata-plan.md)
- [관리자 첫 진입 안내 계획](superpowers/plans/2026-07-22-admin-first-entry-guide-plan.md): DB 완료 저장 방식은 폐기됐으며 localStorage 전환 안내를 우선 확인합니다.
- [2026-06-09 전역 점검](tasks/2026-06-09-global-project-task-check.md): 2026-10-30 코드 대조 내용을 덧붙였지만 명령 실행 결과는 각 기록의 날짜를 따릅니다.

## 코드와 문서가 다를 때

1. 토큰 값·컴포넌트 API·실제 동작은 코드를 확인합니다. 문서의 예시를 코드에 존재하는 API로 가정하지 않습니다.
2. 제품 제약과 사용 의도는 서비스·기능 설계를 확인합니다. 코드에 있다는 이유만으로 모든 동작을 권장 규칙으로 정하지 않습니다.
3. 같은 영역의 UI 선택은 디자인 가이드를 따르고, 기능별 예외는 해당 설계의 근거를 연결합니다. 일반화할 근거가 없는 예외는 다른 화면으로 확장하지 않습니다.
4. 의도와 구현이 다르면 차이와 영향을 기록합니다. 문서 정비만 요청받은 작업에서 코드를 바꾸거나, 미결정 개선을 구현 완료로 표시하지 않습니다.
5. 과거 계획과 테스트 기록은 현재 상태의 증명이 아닙니다. 현재 상태를 주장하려면 코드 대조 또는 새 검증 결과를 구분해 제시합니다.

예: 현재 개인별 OG는 고정 스타일이므로 ‘선택 테마가 OG에도 적용된다’고 안내하지 않습니다. 그렇다고 초기 OG 테마 연동 의도를 코드에 맞춰 없애지는 않고 미구현 차이로 남깁니다. 근거: [서비스 설계의 테마 범위](superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md#132-공개-페이지-테마), [개인별 OG](../app/wishlist/[slug]/opengraph-image.tsx).

## 문서 갱신 방법

- 현행 설계·가이드를 대조할 때는 코드 대조일과 근거 파일 링크를 남깁니다. 실제 화면 확인이나 테스트를 하지 않았다면 정적 대조로 표시합니다.
- 현재 구현, 유지할 사용 규칙, 미결정 사항을 구분합니다. 미래의 개선 제안을 현재 보장되는 동작처럼 쓰지 않습니다.
- 토큰 값이나 컴포넌트 구현 전체를 복사하기보다 원본을 연결하고 역할·선택 이유를 설명합니다.
- 과거 테스트 결과를 새 날짜의 통과 결과로 덮어쓰지 않습니다. 새 실행은 별도 날짜·명령·결과·범위로 기록합니다.
- 문서 변경은 상대 링크·파일 경로·문서 간 설명을 확인합니다. Markdown만 바뀌었다면 앱 전체 테스트를 완료했다고 표현하지 않습니다. 문서를 직접 검사하는 기존 테스트가 있으면 해당 검사도 실행합니다.
