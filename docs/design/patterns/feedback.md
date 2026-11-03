# 상태와 피드백

코드 대조일: 2026-10-30

[디자인 가이드](../README.md) · [기초 규칙](../foundations.md) · [폼](form.md)

이 문서는 사용자가 기다림·처리 결과·빈 목록·확인 행동을 이해하도록 기존 표현을 선택하는 안내입니다. 같은 기능의 기존 문맥을 우선하며, 현재 구현의 존재와 품질 검증 완료를 구분합니다. 새 표시 시간 기준이나 모달·로딩 정책은 정하지 않습니다.

## 사용 상황

| 상황 | 기존 문맥에서 먼저 확인할 표현 | 근거 |
| --- | --- | --- |
| 저장·복사 등 사용자가 실행한 동작의 결과 | 해당 영역의 토스트 이벤트 또는 동작 컴포넌트 | [관리자 토스트](../../../app/admin/admin-toast-events.tsx), [공개 토스트](../../../components/public-wishlist-toast-events.tsx), [계좌 복사](../../../components/copy-account-number-button.tsx) |
| 온보딩 입력 오류·연령 안내 | 폼 가까이 남는 인라인 설명 | [온보딩](../../../app/onboarding/page.tsx), [생일 선택](../../../app/onboarding/birthday-picker.tsx), [로그인 notice](../../../app/login/page.tsx) |
| 라우트 데이터 대기·렌더 실패 | 그 라우트의 loading/error 경계 | [관리자 loading](../../../app/admin/loading.tsx), [관리자 error](../../../app/admin/error.tsx), [공개 loading](../../../app/wishlist/[slug]/loading.tsx), [공개 error](../../../app/wishlist/[slug]/error.tsx) |
| 조회는 성공했으나 목록이 없음 | 현재 필터·전체 목록·대상 화면에 맞는 빈 상태 | [관리자 선물](../../../app/admin/wishes/page.tsx), [메시지함](../../../app/admin/messages/page.tsx), [공개 목록](../../../components/public-wishlist-view.tsx) |
| 초기 사용 안내·파괴적 행동 확인 | 이미 해당 기능에 있는 안내 또는 확인 흐름 | [관리자 안내](../../../app/admin/admin-guide-dialog.tsx), [초기화 확인](../../../app/admin/settings/reset-wishlist-form.tsx) |

위 표는 모든 새 기능의 표현을 자동 결정하는 규칙이 아닙니다. 작업 대상과 의미가 같은 기존 흐름을 찾는 순서입니다.

## 현재 구현과 근거

### 토스트와 인라인 안내

전역 [Toaster](../../../components/ui/sonner.tsx)는 [루트 layout](../../../app/layout.tsx)에 있습니다. 관리자·공개·복사 동작에서 Sonner를 사용하며 화면마다 별도 토스터를 추가하는 구조가 아닙니다.

- 관리자 POST 성공/실패는 쿼리를 [AdminToastEvents](../../../app/admin/admin-toast-events.tsx)가 소비합니다. `saved`·`created`·`updated`·`deleted`·숨김/복구·초기화 결과를 표시하고 처리한 쿼리만 제거합니다.
- 계좌 없이 선물을 만든 경우 성공과 `missingAccount` 경고를 함께 전달하며 `계좌 등록` 액션을 제공합니다. 다수 피드백이 의도적으로 함께 나오는 사례입니다. 근거: [선물 POST](../../../app/api/admin/wishes/route.ts).
- 관리자 데이터 조회가 도메인 오류를 반환할 때는 [AdminToastMessage](../../../app/admin/admin-toast-message.tsx)가 지정 id의 토스트를 표시합니다. 예외로 error 경계에 도달한 경우와 다른 경로입니다.
- 공개 참여의 `sent`/`error`는 [PublicWishlistToastEvents](../../../components/public-wishlist-toast-events.tsx)가 소비하고 URL에서 제거합니다. 메시지만 성공하면 생성 CTA, 금액 참여 성공이면 계좌 유무에 따라 계좌 모달 또는 대체 안내가 나옵니다.
- 계좌 복사는 버튼의 `복사 완료`와 성공/실패 토스트를 함께 사용합니다. [공유 훅](../../../components/use-wishlist-share.ts)은 네이티브 공유 취소 시 조용히 종료하고, 클립보드 복사 성공·실패를 구분합니다.
- 온보딩 오류와 로그인 연령 notice는 인라인입니다. 생일 선택 중 연령 경고는 `role="alert"`를 사용합니다. 이를 기존 토스트 결과와 같은 안내로 복제하지 않습니다. 근거: 위 온보딩·생일·로그인 구현.

### 로딩·오류·404

| 범위 | 현재 기다림 표현 | 실패 시 표현 |
| --- | --- | --- |
| 루트 | 제품명과 `불러오는 중이에요…`, pulse | 오류 안내와 재시도·처음으로. [loading](../../../app/loading.tsx), [error](../../../app/error.tsx) |
| 관리자 | 지표·블록 skeleton, pulse | 차분한 카드와 `다시 시도`. [loading](../../../app/admin/loading.tsx), [error](../../../app/admin/error.tsx) |
| 공개 | 전체 너비 헤더와 카드 skeleton, pulse | 공개 카드의 재시도 또는 404의 `처음으로`. [loading](../../../app/wishlist/[slug]/loading.tsx), [error](../../../app/wishlist/[slug]/error.tsx), [404](../../../app/wishlist/[slug]/not-found.tsx) |

공개 경계에는 조회한 `data-theme`가 없으므로 `.pub-page`의 기본 `pixel_y2k`로 표시합니다. 선택 테마의 로딩 보장을 뜻하지 않습니다. 근거: 위 경계 파일과 [공개 기본 CSS](../../../app/public-themes.css).

제출 대기는 라우트 skeleton과 다릅니다. 공개 참여는 버튼의 `보내는 중...`, 링크 정보 불러오기는 `불러오는 중…`과 비활성화를 사용합니다. 근거: [공개 submit](../../../components/public-participation-submit-button.tsx), [링크 불러오기](../../../app/admin/wishes/link-autofill-button.tsx).

### 빈 상태와 다음 행동

| 대상 | 현재 구분 | 다음 행동 |
| --- | --- | --- |
| 관리자 선물 전체 0건 | `등록된 선물이 없습니다.` | `선물 추가하기` → `#create-wish`. 전체 목록이 비었고 필터가 없으면 추가 패널을 기본으로 펼칩니다. |
| 관리자 선물 필터 0건 | 선택 상태의 선물이 없다는 문구 | `전체 선물 보기` → `/admin/wishes`. 전체 데이터가 사라진 것으로 설명하지 않습니다. |
| 받은 메시지 0건 | 아직 메시지가 없다는 안내 | 공개 페이지 보기·선물 관리하기 CTA. |
| 숨긴 메시지 0건 | `숨긴 메시지가 없습니다.` | 받은 메시지에서 숨긴 기록이 표시된다는 설명. 신규 사용자 첫 행동 CTA를 반복하지 않습니다. |
| 공개 선물 0건 | `아직 공개된 선물이 없어요` | 소유자가 추가하면 나타난다는 설명. 메시지 폼·계좌 안내·생성 CTA 등 기존 페이지 구조는 유지합니다. |

근거: [관리자 선물 분기](../../../app/admin/wishes/page.tsx), [메시지함 분기](../../../app/admin/messages/page.tsx), [공개 빈 상태](../../../components/public-wishlist-view.tsx), [공통 카피](../../../src/lib/design/copy.ts). 숨긴 선물만 있어도 공개 목록은 0건일 수 있으므로 등록 데이터가 전혀 없다고 단정하지 않습니다. [공개 필터](../../../src/lib/public-wishlist/service.ts).

### 모달과 행동 확인

- **첫 진입 안내:** [관리자 안내](../../../app/admin/admin-guide-dialog.tsx)는 Radix Dialog의 Title·Description·Portal을 사용하고 주요 버튼 초기 포커스, Escape 처리, 상태 알림을 구현합니다. 기능별 사용 규칙은 [안내 설계](../../superpowers/specs/2026-07-22-admin-first-entry-guide-design.md)를 따릅니다. 이것이 모든 모달의 접근성 감사를 완료했다는 뜻은 아닙니다.
- **금액 참여 후 계좌 안내:** [AccountRevealModal](../../../components/public-wishlist-toast-events.tsx)은 커스텀 `role="dialog"`와 닫기 버튼입니다. Radix 안내와 같은 포커스 트랩·Escape·복원 처리를 확인할 수 없으므로 접근성 재사용 사례로 일반화하지 않습니다.
- **참여 숨김:** [HideMessageForm](../../../app/admin/messages/hide-message-form.tsx)은 `window.confirm`으로 금액 차감과 복구 가능 여부를 안내한 뒤 POST합니다.
- **위시리스트 초기화:** [ResetWishlistForm](../../../app/admin/settings/reset-wishlist-form.tsx)은 삭제 대상과 유지 대상을 확인한 뒤 POST합니다. 프로필·공개 주소·테마·계좌 안내는 유지합니다. 실제 삭제 범위 근거: [reset repository](../../../src/lib/wishlist-reset/repository.ts).
- **온보딩 연령 확인:** [BirthdayPicker](../../../app/onboarding/birthday-picker.tsx)는 만 14세 미만으로 판단되는 날짜 선택 시 경고를 표시하고, 해당 폼 제출 시 브라우저 확인을 제공합니다. 실제 거절·삭제 판단은 [서버 서비스](../../../src/lib/onboarding/service.ts)에 있습니다. 브라우저 확인을 서버 검증 대신 사용하지 않습니다.

확인 방식은 현재 기능마다 다릅니다. 모든 작업을 커스텀 모달로 통합하거나 모든 삭제에 같은 확인창을 추가하는 규칙은 정하지 않았습니다.

## 작업 시 유지할 규칙

1. 같은 redirect 결과를 토스트와 인라인 성공/오류 박스에 중복 표시하지 않습니다. 관리자·공개의 기존 결과 처리 계약을 먼저 보존합니다. 근거: [관리자 토스트 계약](../../../src/lib/design/admin-toast-contract.test.ts), [공개 참여 계약](../../../src/lib/public-participation/ui-contract.test.ts).
2. 성공·오류·빈 목록을 구분합니다. 필터 0건을 첫 데이터 0건으로 바꾸거나 정상 빈 목록을 오류 경계로 처리하지 않습니다. 근거: 위 빈 상태 분기.
3. 결과에 필요한 다음 행동과 실제 영향을 유지합니다. 계좌 미등록 안내·참여 숨김의 금액 변화·초기화 유지 대상을 단순한 성공 문구로 지우지 않습니다. 근거: 위 POST·확인 흐름.
4. 재시도·처음으로·닫기·필터 해제 등 해당 경로의 복귀 수단을 유지합니다. 라우트 실패와 저장 실패를 하나의 복사된 화면으로 바꾸지 않습니다. 근거: 위 경계·토스트·모달 구현.
5. 모달에 `role`이 있다는 이유만으로 키보드·스크린 리더 동작까지 보장된다고 설명하지 않습니다. 기능별 구현과 수동 확인 결과를 구분합니다. 근거: 위 두 모달의 구조 차이.

## 차이와 미결정

- 관리자 mutation 오류는 대부분 일반 문구이고 공개 참여는 코드별 문구입니다. 필드 오류·오류 요약과 토스트의 공통 분담은 [폼 가이드](form.md)의 미결정 사항입니다.
- 로딩을 몇 ms 뒤에 표시하거나 최소 몇 ms 유지하는 시간 규칙은 없습니다. 현 skeleton의 개수·모양을 완성 화면과 항상 동일한 계약으로 일반화하지 않습니다.
- 관리자 안내에는 reduced-motion 처리가 있으나 route skeleton의 pulse 등 전체 모션의 공통 대응이 완료된 것은 아닙니다. 전체 정책은 미결정입니다.
- 커스텀 계좌 모달의 포커스·Escape·포커스 복원은 미검증입니다. 공개 토스트는 `body:has(.pub-page[data-theme=...])`로 전역 Toaster에 토큰을 전달하도록 정의되어 있지만, 이번 정적 대조로 실제 표시·대비의 검증 완료를 주장하지 않습니다. 근거: [모달 구현](../../../components/public-wishlist-toast-events.tsx), [전역 Toaster](../../../app/layout.tsx), [토스트 CSS](../../../app/globals.css), [공개 토큰](../../../app/public-themes.css).

## 확인 방법

- 소스 연결: [전역 토스트 계약](../../../src/lib/design/global-toast-contract.test.ts), [관리자 토스트 계약](../../../src/lib/design/admin-toast-contract.test.ts), [공개 결과 계약](../../../src/lib/public-participation/ui-contract.test.ts), [안내 UI 계약](../../../src/lib/design/admin-guide-ui-contract.test.ts).
- 브라우저 결과: [클립보드 실패 토스트](../../../tests/sample/clipboard-failure-toasts.spec.ts), [공유 경로](../../../tests/sample/native-share-paths.spec.ts), [계좌 복사](../../../tests/sample/copy-account-number.spec.ts). 샘플은 실제 참여 저장 성공·실패 검증을 대신하지 않습니다.
- 변경한 화면은 대기·예외·정상 빈 목록·필터 0건·행동 결과를 구분해 확인합니다. 모달 변경은 키보드 진입·이동·닫기·복원과 상태 읽기를 별도로 확인합니다.

이 문서 작성은 정적 코드 대조입니다. 위 테스트·접근성 수동 감사·실환경 동작은 새로 실행하지 않았습니다. 검사 명령은 [package.json](../../../package.json)의 `pnpm test`, `pnpm test:e2e`를 사용합니다.
