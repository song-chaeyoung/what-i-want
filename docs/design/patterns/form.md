# 폼

코드 대조일: 2026-10-30

[디자인 가이드](../README.md) · [기초 규칙](../foundations.md) · [피드백](feedback.md)

이 문서는 기존 입력·제출 흐름을 재사용하기 위한 안내입니다. 현재 구현, 유지할 계약, 미결정 개선을 구분하며 새 폼 라이브러리나 일괄 리팩터링을 요구하지 않습니다. 코드 대조는 정적 확인이며 실환경 제출 검증 기록은 아닙니다.

## 사용 상황

- 관리자 선물·설정처럼 반복 입력하는 화면은 관리자 폼의 밀도와 재사용 대상을 먼저 확인합니다.
- 로그인·온보딩은 고정 브랜드 화면이며 공개 테마 선택을 따르지 않습니다. 온보딩 입력 규칙은 해당 페이지·서비스를 확인합니다.
- 친구의 공개 참여는 메시지만 보내기와 선물별 금액 참여를 구분합니다. 샘플은 입력을 체험하되 저장하지 않는 별도 문맥입니다.

근거: [관리자 선물](../../../app/admin/wishes/page.tsx), [설정](../../../app/admin/settings/page.tsx), [온보딩](../../../app/onboarding/page.tsx), [공개 화면](../../../components/public-wishlist-view.tsx), [샘플](../../../app/sample/page.tsx).

## 현재 구현과 근거

### 영역별 재사용 대상

| 영역 | 현재 구성 | 작업할 때의 선택 |
| --- | --- | --- |
| 관리자 선물·설정 | `AdminField`, `adminInputClassName`, `adminTextareaClassName`, 관리자 버튼 클래스 | [admin-ui.tsx](../../../app/admin/admin-ui.tsx)를 먼저 재사용합니다. `AdminField`는 label·필수 표시·hint를 담당하며 실제 input 제약은 호출부가 지정합니다. |
| 온보딩 | 페이지 내부 `Field`와 입력 클래스, `BirthdayPicker` | [온보딩 페이지](../../../app/onboarding/page.tsx) 문맥을 유지합니다. `Field`는 다른 파일에서 import하는 공통 export가 아닙니다. 생일 선택은 [BirthdayPicker](../../../app/onboarding/birthday-picker.tsx)가 shadcn/Radix UI를 사용합니다. |
| 공개 위시리스트·샘플 | `PublicWishlistView` 내부 `PublicField`와 공개 입력 클래스 | [공개 화면](../../../components/public-wishlist-view.tsx)의 `.pub-field`와 테마 토큰을 유지합니다. `PublicField`도 페이지 컴포넌트 내부 함수이며 관리자 `AdminField`와 같지 않습니다. |

### 입력과 검증

| 대상 | 브라우저 입력 제약 | 서버에서 확인하는 내용 |
| --- | --- | --- |
| 선물 추가·수정 | 이름 필수·120자, 목표 금액 필수·정수·범위, URL 입력 타입 | 제목 trim·길이, 목표 금액 1–2,147,483,647, URL의 http/https를 [선물 서비스](../../../src/lib/wishes/service.ts)에서 검사합니다. |
| 공개 메시지 | 이름 최대 80자·선택, 메시지 필수·최대 500자 | 이름 정규화와 메시지 trim·필수·길이를 [참여 서비스](../../../src/lib/public-participation/service.ts)에서 검사합니다. |
| 선물별 공개 참여 | 위 메시지 필드와 금액 필수·`min=1`·`step=1` | 서버 금액 상한은 100,000,000이며 소속·공개 여부·선물 상태도 검사합니다. HTML 입력에는 이 상한 `max`가 현재 없습니다. |
| 온보딩·설정 | 각 페이지의 필수 입력과 생일 UI | 온보딩은 [온보딩 서비스](../../../src/lib/onboarding/service.ts), 설정은 [설정 서비스](../../../src/lib/settings/service.ts)가 최종 검증합니다. 생일은 선택이며 입력 시 날짜·연령을 확인합니다. |

공개 선물 참여 폼은 `open`이고 완료되지 않은 카드에 표시됩니다. 서버 저장은 `open` 상태를 확인합니다. 화면의 완료 판정과 서버 조건이 완전히 같다는 뜻은 아니며, UI 표시 여부로 권한·상태 검증을 대신하지 않습니다. 근거: [공개 카드의 canFund](../../../components/public-wishlist-view.tsx), [참여 저장](../../../src/lib/public-participation/repository.ts).

### 제출과 결과

| 문맥 | 실제 제출 경로 | 대기·성공·실패 |
| --- | --- | --- |
| 관리자 선물·설정 | 네이티브 `method="post"` → Route Handler → 서비스 | 성공·오류 코드를 redirect 쿼리로 전달하고 [AdminToastEvents](../../../app/admin/admin-toast-events.tsx)가 표시합니다. 일반 저장 버튼에는 공통 pending 처리가 없습니다. [선물 POST](../../../app/api/admin/wishes/route.ts), [설정 POST](../../../app/api/admin/settings/route.ts). |
| 온보딩 | 네이티브 POST → `/api/onboarding` | 성공 시 관리자 진입, 오류 시 페이지의 인라인 안내입니다. 연령 제한으로 계정 삭제 시 로그인 notice로 이동합니다. [온보딩 route](../../../app/api/onboarding/route.ts). |
| 공개 참여 | `submitParticipationAction.bind(null, slug)` → 참여 서비스 | [submit 버튼](../../../components/public-participation-submit-button.tsx)이 `useFormStatus`로 비활성화·`보내는 중...`을 표시합니다. 성공은 `sent`, 실패는 `error` redirect 후 [공개 피드백](../../../components/public-wishlist-toast-events.tsx)이 처리합니다. |
| 상품 정보 불러오기 | `type="button"` → 링크 미리보기 fetch | [LinkAutofillButton](../../../app/admin/wishes/link-autofill-button.tsx)은 로딩 중 비활성화하며 빈 필드만 채웁니다. 성공 안내는 저장 완료가 아니라 저장 전 확인 요청입니다. |

공개 참여 API Route Handler도 남아 있지만 현재 화면 폼의 action은 그 API URL이 아닌 [Server Action](../../../app/wishlist/[slug]/actions.ts)입니다. 두 경로를 같은 UI 제출 방식으로 설명하지 않습니다. 근거: [참여 API](../../../app/api/public/wishlists/[slug]/participation/route.ts).

### 샘플과 Enter 회귀

`demo`에서는 공개 Action을 연결하지 않고 disabled인 `type="submit"` 버튼과 샘플 안내를 표시합니다. 버튼을 `type="button"`으로 바꾸면 메시지 폼의 이름 필드에서 Enter가 암묵적 GET 제출을 일으킬 수 있었으므로 현재 타입을 유지합니다.

기존 회귀 검사는 Enter 후 navigation·쿼리·히스토리 변화가 없고 열린 폼과 입력값이 유지되는지 확인합니다. 입력한 이름·메시지·request id가 URL로 새지 않는 것이 이 문맥의 계약입니다. 근거: [현재 demo 구현](../../../components/public-wishlist-view.tsx), [Enter 회귀 테스트](../../../tests/sample/message-form-enter-key.spec.ts), [샘플 명세](../../../specs/sample-wishlist.md).

## 작업 시 유지할 규칙

1. 대상 영역의 label·입력·버튼 표현을 먼저 재사용합니다. placeholder만으로 label을 대체하지 않고 `htmlFor`와 input `id` 연결, 반복 카드별 고유 id를 보존합니다. 근거: 위 `AdminField`·`Field`·`PublicField` 구현.
2. HTML 제약과 서버 검증을 함께 확인합니다. 화면 변경만으로 서버 규칙을 약화하거나 서로 다른 금액 상한을 같다고 설명하지 않습니다. 근거: 위 입력 제약과 서비스 함수.
3. 폼의 action·method·필드명·숨김 필드 계약을 보존합니다. 관리자 수정/삭제의 `_method`, 공개 참여의 `wishItemId`·`clientRequestId`도 포함합니다. 근거: [관리자 폼](../../../app/admin/wishes/page.tsx), [공개 폼](../../../components/public-wishlist-view.tsx).
4. pending UI와 서버 중복 방지는 별도 책임입니다. 공개 버튼 비활성화와 [request id 검증](../../../src/lib/public-participation/service.ts), [중복 저장 방지](../../../src/lib/public-participation/repository.ts)를 서로 대체하지 않습니다.
5. 참여 성공을 결제·송금 완료로 바꾸지 않습니다. 기록과 모인 금액 반영 후 실제 송금은 별도 계좌 안내를 따릅니다. 근거: [참여 저장](../../../src/lib/public-participation/repository.ts), [공개 카피](../../../src/lib/design/copy.ts).

## 차이와 미결정

- **실패 시 입력 유지:** 현재 redirect 흐름은 필드별 오류·입력 상태를 반환하는 공통 구조가 아닙니다. 실환경 실패 후 값 복원은 별도 확인이 필요하며 모든 폼에서 보장된다고 쓰지 않습니다.
- **오류 위치:** 공개 참여는 코드별 토스트, 관리자 mutation 오류는 대부분 일반 토스트, 온보딩은 페이지 인라인입니다. 필드별 오류·오류 요약·`aria-describedby`를 포함한 공통 정책은 아직 정하지 않았습니다.
- **pending:** 공개 참여와 링크 불러오기는 구현되어 있지만 관리자 저장 전체의 공통 대기·중복 제출 표준은 없습니다.
- **포커스:** 관리자 입력은 테두리 변화가 있고 공개 입력은 `outline-none`이며 공통 focus 표현이 없습니다. 현재 값을 접근성 검증 완료 규칙으로 채택하지 않습니다. 근거: [관리자 입력](../../../app/admin/admin-ui.tsx), [공개 입력](../../../components/public-wishlist-view.tsx), [공개 CSS](../../../app/public-themes.css).
- **라이브러리:** 현재 네이티브 폼과 서비스 검증으로 흐름을 설명할 수 있습니다. RHF/Zod 도입은 이 가이드의 선행 조건이 아니며, 도입 필요 여부를 영구적으로 결정하지도 않습니다. 근거: [의존성](../../../package.json), 위 제출·검증 구현.

## 확인 방법

수정 영역에 해당하는 기존 검사를 고릅니다. 파일 계약 검사는 소스 연결을 확인하고, 실제 브라우저 조작과 서버 저장 검증은 별도로 구분합니다.

- 검증·참여 계약: [선물 서비스 테스트](../../../src/lib/wishes/service.test.ts), [참여 서비스 테스트](../../../src/lib/public-participation/service.test.ts), [공개 UI 계약](../../../src/lib/public-participation/ui-contract.test.ts), [오류 처리 계약](../../../src/lib/public-participation/route-error-contract.test.ts).
- 브라우저 입력: [메시지 폼](../../../tests/sample/message-form-fields-and-disabled-submit.spec.ts), [선물 폼](../../../tests/sample/gift-form-fields-and-disabled-submit.spec.ts), [금액 제약](../../../tests/sample/gift-form-input-constraints.spec.ts), [Enter 회귀](../../../tests/sample/message-form-enter-key.spec.ts).
- 실제 제출: 관리자 정상/검증 실패, 공개 pending/성공/실패/재전송을 해당 환경에서 확인합니다. `/sample`은 저장하지 않으므로 실환경 참여 검증을 대신하지 않습니다.

이 문서 작성 시 위 테스트와 실환경 제출은 실행하지 않았습니다. 명령은 [package.json](../../../package.json)의 `pnpm test`, `pnpm test:e2e`를 사용합니다.
