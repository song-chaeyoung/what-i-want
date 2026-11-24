# 온보딩

코드 대조일: 2026-11-18 (`main` @ `6bc5ea2`). 제출 대기·달력 이름 대조일: 2026-11-21.

[디자인 가이드](../README.md) · [기초 규칙](../foundations.md) · [폼](form.md) · [피드백](feedback.md) · [위시 카드](wish-card.md) · [메시지함](messages.md) · [공유 흐름](share-flow.md)

이 문서는 소셜 로그인 직후 위시리스트를 처음 만드는 화면의 기존 표현을 재사용하기 위한 안내입니다. 현재 구현, 유지할 규칙, 미결정 사항을 구분하며 새 단계나 입력 항목을 요구하지 않습니다. 이번 작성은 정적 코드 대조이며 화면·접근성·테스트를 새로 실행한 기록은 아닙니다.

## 사용 상황

- 로그인한 사용자가 온보딩을 마치지 않았으면 `/onboarding`으로 갑니다. 마친 사용자는 `/admin`으로 갑니다.
- 관리자 shell은 온보딩 미완료 상태를 `/onboarding`으로 되돌리므로, 온보딩 화면에는 관리자 사이드바가 없습니다.
- 온보딩은 고정 브랜드 화면입니다. 사용자의 공개 테마는 적용하지 않습니다.
- 공개 주소·계좌·테마는 이 화면에서 정하지 않고 관리자 설정에서 정합니다.

근거: [로그인 분기](../../../app/login/page.tsx), [온보딩 페이지](../../../app/onboarding/page.tsx), [관리자 shell](../../../app/admin/layout.tsx), [서비스 설계 8.3](../../superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md).

## 현재 구현과 근거

### 화면 구성

- 로고, 작은 라벨 `온보딩`, 제목 `기본 위시리스트 만들기`, 설명 한 줄, 폼 순서입니다. 틀은 [로그인](../../../app/login/page.tsx)과 같은 `pixel-dot-bg` 배경과 `Card variant="pixel"`(`surface="paper"`, `shadow="lg"`)이며 폭은 `max-w-2xl`(로그인은 `max-w-md`)입니다.
- 입력은 표시 이름(필수·80자), 생일(선택), 소개(선택), `만 14세 이상입니다.` 체크박스(필수)와 `위시리스트 만들기` 버튼입니다. 표시 이름은 소셜 계정 이름으로 미리 채워집니다.
- 입력은 Input·Textarea `onboarding` 변형, 버튼은 Button `cta`입니다. label은 페이지 내부 `Field`가 `htmlFor`로 연결합니다. `Field`는 공용 export가 아닙니다.
- 오류는 폼 위 [Alert](../../../components/ui/alert.tsx) `notice`에 인라인으로 표시합니다. 근거: [온보딩 페이지](../../../app/onboarding/page.tsx).

### 생일 선택과 14세 제한

- [BirthdayPicker](../../../app/onboarding/birthday-picker.tsx)는 달력 팝오버로 날짜를 고르고 `YYYY-MM-DD`를 숨김 input으로 보냅니다. 달력은 1900년부터 KST 오늘까지이고 미래 날짜는 고를 수 없습니다. `선택 해제`로 비울 수 있습니다. 스크린리더 이름은 `연도 선택`, `월 선택`, `이전 달`, `다음 달`입니다.
- 만 14세 미만 날짜를 고르면 `role="alert"` 경고가 나옵니다. 그 상태로 제출하면 [확인창](confirm-dialog.md)이 한 번 더 묻습니다. 제목은 `{연도}년생이 맞나요?`, 취소는 `연도 고치기`(달력을 열고 연도 선택으로 포커스, 제출하지 않음), 확인은 `이 생일로 제출`입니다(2026-11-24).
- 서버는 [온보딩 서비스](../../../src/lib/onboarding/service.ts)에서 만 14세 미만이면 소셜 로그인 정보를 지우고 [로그인 notice](../../../app/login/page.tsx)로 보냅니다. 연령 기준은 [age.ts](../../../src/lib/onboarding/age.ts)입니다.

### 제출과 결과

- 네이티브 POST로 [온보딩 route](../../../app/api/onboarding/route.ts)에 보냅니다. 성공하면 `/admin`으로 이동하고, 오류면 `/onboarding?error=코드`로 돌아와 인라인 안내를 보여 줍니다. 미로그인 요청은 `/login`으로 갑니다.
- 서버가 만드는 값은 랜덤 공개 주소, 제목 `{표시 이름}님의 위시리스트`, 기본 테마, `public` 공개 상태입니다. 사용자는 주소를 입력하지 않습니다.
- 제출 버튼은 제출 중 `disabled`가 되고 라벨이 `위시리스트 만들기`에서 `만드는 중…`으로 바뀝니다. 폭과 색은 Button `cta` 그대로이며 스피너는 없습니다. 폼은 최상위로 POST하고, 응답이 올 때까지 현재 페이지가 보입니다. 뒤로가기로 페이지가 복원되면 잠금을 풉니다. 만 14세 확인에서 취소를 누르면 잠그지 않습니다. 근거: [제출 버튼](../../../app/onboarding/submit-button.tsx).

## 작업 시 유지할 규칙

1. 온보딩 입력은 페이지 내부 `Field`와 Input·Textarea `onboarding`, 제출 버튼은 Button `cta`를 재사용합니다. 근거: 위 화면 구성, [입력 계약 테스트](../../../src/lib/design/input-contract.test.ts).
2. 오류는 폼 위 인라인 `notice`로 두고 같은 오류를 토스트로 중복 표시하지 않습니다. 근거: [온보딩 페이지](../../../app/onboarding/page.tsx), [피드백 규칙 1](feedback.md).
3. 공개 주소 입력을 온보딩에 추가하지 않습니다. 근거: [UI 계약 테스트](../../../src/lib/onboarding/ui-contract.test.ts)의 `does not ask users to enter a public slug`.
4. 14세 미만 경고와 제출 직전 확인은 서버 판정을 대신하지 않습니다. 최종 판단은 서버가 합니다. 근거: [피드백 패턴](feedback.md), [온보딩 서비스](../../../src/lib/onboarding/service.ts).
5. 생일은 선택 입력이며 숨김 input 값은 `YYYY-MM-DD` 형식을 유지합니다. 근거: [BirthdayPicker](../../../app/onboarding/birthday-picker.tsx), [서비스](../../../src/lib/onboarding/service.ts).

## 차이와 미결정

- **Button 변형:** 생일 버튼과 `선택 해제`는 shadcn `outline`·`ghost`를 `className`으로 덮어 씁니다. [기초 규칙](../foundations.md)의 "shadcn 기본 변형은 관리자·공개 화면에서 쓰지 않는다"는 온보딩을 다루지 않으므로 이 사용은 규칙 위반이 아니지만, 전용 변형으로 옮길지는 정하지 않았습니다.
- **로고 링크:** 로그인의 로고는 `/`로 가는 링크이고 온보딩의 로고는 링크가 없습니다.
- **글자 크기:** 제목 `break-keep`이 320px·글자 200%에서 넘치는지 이번에 확인하지 않았습니다.

## 확인 방법

- 소스 연결: [온보딩 UI 계약](../../../src/lib/onboarding/ui-contract.test.ts), [페이지 검증](../../../src/lib/onboarding/page.test.ts), [서비스](../../../src/lib/onboarding/service.test.ts), [나이 계산](../../../src/lib/onboarding/age.test.ts), [route](../../../src/lib/onboarding/route.test.ts).
- 브라우저: [온보딩 완료](../../../tests/admin/complete-onboarding.spec.ts), [제출 중 버튼](../../../tests/admin/onboarding-submit-pending.spec.ts), [14세 확인 필수](../../../tests/admin/onboarding-age-confirmation-required.spec.ts), [미완료 시 리다이렉트](../../../tests/admin/incomplete-onboarding-redirect.spec.ts), [비로그인 제출](../../../tests/auth/onboarding-unauthenticated.spec.ts). 관리자 fixture는 OAuth 대신 세션 행을 넣어 로그인합니다.
- 화면: 320·390·1440px에서 오류 안내 유무, 달력 팝오버, 14세 미만 경고를 확인합니다. 글자를 키우는 변경이면 320px에서 100·150·200%를 확인합니다. 온보딩은 공개 테마를 쓰지 않으므로 테마 확인은 필요 없습니다.

이 문서 작성 시 위 테스트와 화면은 실행하지 않았습니다. 명령은 [package.json](../../../package.json)의 `pnpm test`, `pnpm test:e2e`를 사용합니다.
