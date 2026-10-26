# Sample Wishlist Page (/sample) E2E Test Plan

## Application Overview

## 대상 및 범위

"뭐갖고싶어"(생일 위시리스트 서비스)의 공개 샘플 페이지 `/sample` 을 검증하는 E2E 테스트 계획입니다.

- 페이지 소스: `app/sample/page.tsx` -> `components/public-wishlist-view.tsx` (하드코딩 목 데이터 + `demo` 모드). DB 쓰기 없음.
- 지원 쿼리: `?theme=pixel_y2k|mono_bw|soft_pastel` (알 수 없는 값은 `pixel_y2k` 로 폴백, `<main data-theme>` 로 적용).
- baseURL: `http://localhost:3200` (`playwright.config.ts`, project: chromium only). 모든 시나리오는 `tests/seed.spec.ts` 를 시드로 하며, 각 시나리오는 새 페이지에서 `page.goto('/sample')` 로 시작합니다.
- 범위 밖: Google/Kakao 로그인 버튼 클릭, OAuth, 실제 데이터 쓰기. `/login` 은 "내 위시리스트 만들기" CTA 의 도착 URL 확인 용도로만 이동합니다.

## 탐색으로 확인한 실제 렌더링 데이터 (기본 테마)

- 문서 title: `샘플 위시리스트 | 뭐갖고싶어`
- 헤더: 링크 `뭐갖고싶어`(href `/`), pill `birthday wishlist`, 생일 배지 `5월 15일 · D-201`(2026-10-26 기준, 날짜에 따라 변동), pill `SAMPLE`, 버튼 `공유하기`
- `h1` `민지님의 위시리스트`, 소개문 `올해도 함께 축하해줘서 고마워요. 편하게 골라주세요!`
- 요약(dl): `선물` = `2개`, `모인 마음` = `₩43,040`
- 계좌 안내(details, 기본 열림): `gift account` / `계좌 안내` / `마음은 이 계좌로 전할 수 있어요.`, 예금주 `김민지`, `민지은행 0000-00-0000000`, 버튼 `계좌번호 복사`
- 축하 메시지(details, 기본 닫힘): `gift note` / `축하 메시지 남기기` / `결제 없이 메시지만 전할 수 있어요.`
- 선물 카드 1: `NO. 1`, `마음 모으는 중`, h2 `무선 헤드폰`, `출퇴근길에 늘 쓰고 다닐 헤드폰이에요. 색은 크림색이 좋아요!`, `₩32,400`, `₩45,000 중`, `72% 달성`
- 선물 카드 2: `NO. 2`, `마음 모으는 중`, h2 `생일 케이크`, `올해는 딸기 생크림 케이크로 함께 축하해주세요.`, `₩10,640`, `₩28,000 중`, `38% 달성`
- 각 카드 하단 details summary `이 선물에 마음 보태기` (기본 닫힘). 상품 링크(`선물 링크 보기`)와 이미지는 없고 `GIFT` 폴백 그래픽만 표시됨.
- CTA: 텍스트 `make your own` + 링크 `내 위시리스트 만들기` (href `/login`)
- 푸터: `이용약관`(/terms), `개인정보 처리방침`(/privacy), `문의하기`(https://forms.gle/WYpBboXs3WphC7ai6), `© 2026 뭐갖고싶어`

## 테스트 생성기(generator)를 위한 공통 주의사항

1. **로딩 셸 대기**: 첫 응답 시 별도의 `<main>` 안에 `불러오는 중이에요…` 로딩 화면이 잠깐 나타나며, 이때 `getByRole('main')` 이 2개로 잡힐 수 있습니다(strict mode 위반). 반드시 `page.locator('main[data-theme]')` 또는 `getByRole('heading', { level: 1, name: '민지님의 위시리스트' })` 가 보일 때까지 기다린 뒤 검증하세요. dev 서버 첫 컴파일은 느릴 수 있으니 필요시 timeout 을 늘리세요.
2. **생일 배지는 날짜 의존**: `5월 15일 · D-<N>` 의 N 은 실행 날짜(KST 기준)에 따라 달라집니다. `/^5월 15일 · (D-\d+|D-DAY)$/` 정규식으로만 검증하고 숫자를 고정하지 마세요.
3. **통화 기호**: 금액은 `Intl.NumberFormat('ko-KR', KRW)` 결과(`₩43,040`)입니다. 기호는 전각 원화 기호(U+20A9)이므로 복사해서 쓰거나 `/43,040/` 정규식을 사용하세요.
4. **클립보드 권한 (Chromium)**: 클립보드 내용을 `navigator.clipboard.readText()` 로 읽으려면 컨텍스트에 `clipboard-read`, `clipboard-write` 권한이 필요합니다. `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })` 또는 `context.grantPermissions([...], { origin: 'http://localhost:3200' })` 로 부여하세요. 권한 거부 상태를 추측으로 시뮬레이션하지 말고, 실패 경로는 시나리오 8 처럼 `navigator.clipboard.writeText` 를 `addInitScript` 로 reject 되도록 스텁하세요.
5. **`navigator.share` 는 데스크톱 Chromium(macOS)에서 function 으로 존재**: 탐색 시 `typeof navigator.share === 'function'` 이었고, 스텁 없이 `공유하기` 를 누르면 토스트도 라벨 변경도 없었습니다(네이티브 공유 시트 호출). 따라서 클립보드 폴백을 검증하려면 `page.addInitScript` 로 `Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })` 를 먼저 설정해야 하고, 네이티브 경로 검증은 함수 스텁으로 호출 인자를 기록해야 합니다. `addInitScript` 는 `page.goto` 이전에 호출하세요.
6. **토스트는 누적됨**: sonner 토스트(`[data-sonner-toast]`)는 2초 후 라벨이 복귀해도 남아 있고 새 토스트와 겹쳐 쌓입니다. 개수 대신 `getByText('<정확한 문구>')` 로 검증하세요. 또한 헤더 `공유하기` 버튼과 계좌 `계좌번호 복사` 버튼은 모두 복사 후 라벨이 `복사 완료` 로 바뀌므로 반드시 영역(헤더 / 계좌 details)으로 범위를 좁혀 찾으세요.
7. **중복 라벨 주의**: `이름`, `메시지`, `마음 보내기` 텍스트가 메시지 폼, 선물 카드 1, 선물 카드 2 에 각각 존재합니다(id: `message-sender`/`message-body`, `participation-amount|sender|body-sample-headphones`, `...-sample-cake`). `getByRole('article').filter({ hasText: '무선 헤드폰' })` 또는 해당 `details` 로 범위를 좁히세요. 닫힌 `details` 안의 필드는 보이지 않으므로 먼저 summary 를 클릭해 여세요.
8. **canonical 호스트**: `<link rel="canonical">` 와 `og:url` 은 개발 환경에서 `http://localhost:3000/sample` 로 출력됩니다(metadataBase 기준). 호스트는 단언하지 말고 pathname `/sample` 만 확인하세요.
9. **number 입력**: `type="number"` 입력에는 `fill('abc')` 가 에러를 던집니다. 문자 입력 차단은 `pressSequentially('abc')` 후 값이 빈 문자열인지로 확인하세요.

## 탐색 중 발견한 사항 (계획에 반영됨)

- **[수정된 버그 / 시나리오 10 은 회귀 테스트]** 탐색 당시 축하 메시지 폼은 `<form>` 에 submit 버튼이 없고(버튼이 `type="button"` + disabled) action 도 없으며 텍스트 입력이 `이름` 하나뿐이라, 메시지를 입력한 뒤 `이름` 필드에서 Enter 를 누르면 브라우저 기본 암묵적 제출(GET)이 발생했습니다. 실제로 `/sample?clientRequestId=<uuid>&senderName=%EC%A7%80%EB%AF%BC&body=%EC%83%9D%EC%9D%BC+%EC%B6%95%ED%95%98%ED%95%B4%21` 로 이동했고, 입력한 이름/메시지가 URL 쿼리에 노출되었으며 폼이 닫히고 입력값이 사라졌습니다. 읽기 전용 데모의 의도("제출 불가")와 "메시지는 비공개" 요구사항에 어긋나므로, 데모 버튼을 disabled 인 `type="submit"` 으로 바꿔 수정했습니다(`components/public-wishlist-view.tsx` 의 `ParticipationSubmit`). 시나리오 10 은 이 동작이 다시 생기지 않는지 확인하며, `test.fail()`/`test.fixme()`/`test.skip()` 을 달지 않습니다. (선물 카드 폼은 `보낼 마음` + `이름` 두 개의 입력이 있어 Enter 로 제출되지 않음을 확인했습니다.)
- **[관찰 / 시나리오 6, 7]** 공유 버튼이 만드는 링크는 `/sample` 이 아니라 `<origin>/wishlist/sample?utm_source=visitor_share&utm_medium=share` 입니다(slug 가 `sample` 이므로). 탐색 시 `GET /wishlist/sample` 은 HTTP 200 이었으나 해당 페이지 내용은 검증 범위 밖이므로 이동하지 않고 클립보드/공유 인자의 문자열만 단언합니다.

## 시나리오 목록 요약

1. Page Load and Metadata
2. Header and Summary
3. Gift Cards
4. Account Section
5. Copy Account Number
6. Share Link Copy
7. Native Share Paths
8. Clipboard Failure Toasts
9. Message Form Fields and Disabled Submit
10. Message Form Enter Key (regression)
11. Gift Form Fields and Disabled Submit
12. Gift Form Input Constraints
13. Valid Themes
14. Invalid Theme Fallback
15. CTA and Footer Links

## Test Scenarios

### 1. Page Overview

**Seed:** `tests/seed.spec.ts`

#### 1.1. Page Load and Metadata

**File:** `tests/sample/page-load-and-metadata.spec.ts`

**Steps:**
  1. 로그인하지 않은 새 페이지에서 `/sample` 로 이동합니다. (필요하면 `불러오는 중이에요…` 로딩 화면이 사라지고 `main[data-theme]` 가 나타날 때까지 대기)
    - expect: 응답이 성공(HTTP 200)이고 최종 URL 의 pathname 이 `/sample` 로 유지된다 (로그인 페이지로 리다이렉트되지 않는다).
    - expect: 레벨 1 제목 `민지님의 위시리스트` 가 보인다.
    - expect: `main[data-theme]` 요소가 정확히 1개이고 `data-theme` 값이 `pixel_y2k` 이다.
  2. 문서 title 을 확인합니다.
    - expect: `document.title` 이 정확히 `샘플 위시리스트 | 뭐갖고싶어` 이다.
  3. `<head>` 의 메타 태그를 확인합니다.
    - expect: `meta[name=description]` 의 content 가 `뭐갖고싶어로 만들 수 있는 공개 위시리스트 샘플 페이지입니다.` 이다.
    - expect: `meta[property='og:title']` 의 content 가 `샘플 위시리스트 | 뭐갖고싶어` 이다.
    - expect: `meta[name=robots]` 의 content 가 `index, follow` 이다.
    - expect: `link[rel=canonical]` 의 href 를 URL 로 파싱했을 때 pathname 이 `/sample` 이다 (호스트는 단언하지 않는다).

#### 1.2. Header and Summary

**File:** `tests/sample/header-and-summary.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: 페이지가 정상 렌더링된다.
  2. 헤더 영역(첫 번째 `header`)의 요소를 확인합니다.
    - expect: 링크 `뭐갖고싶어` 가 보이고 href 가 `/` 이다.
    - expect: pill 텍스트 `birthday wishlist` 가 보인다.
    - expect: 생일 배지가 정규식 `/^5월 15일 · (D-\d+|D-DAY)$/` 와 일치하며 보인다 (2026-10-26 기준 `5월 15일 · D-201`, 숫자는 날짜에 따라 변동).
    - expect: 정확히 일치하는 텍스트 `SAMPLE` pill 이 보인다.
    - expect: 버튼 `공유하기` 가 보인다.
  3. 제목과 소개문을 확인합니다.
    - expect: 레벨 1 제목이 `민지님의 위시리스트` 이다.
    - expect: 소개문 `올해도 함께 축하해줘서 고마워요. 편하게 골라주세요!` 가 보인다.
  4. 요약 정의 목록(dl)을 확인합니다.
    - expect: 용어 `선물` 의 정의가 `2개` 이다.
    - expect: 용어 `모인 마음` 의 정의가 `₩43,040` 이다 (32,400 + 10,640 의 합계).

#### 1.3. Gift Cards

**File:** `tests/sample/gift-cards.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기한 뒤 `article` 요소를 조회합니다.
    - expect: `article` 이 정확히 2개이다.
    - expect: DOM 순서가 `계좌 안내` details -> `축하 메시지 남기기` details -> 선물 카드 2개 -> `make your own` CTA 순이다.
    - expect: 카드 순서가 `무선 헤드폰`(1번째), `생일 케이크`(2번째) 이다.
  2. 첫 번째 카드(`무선 헤드폰`)의 내용을 확인합니다.
    - expect: `NO. 1` 과 상태 라벨 `마음 모으는 중` 이 보인다.
    - expect: 레벨 2 제목 `무선 헤드폰` 이 보인다.
    - expect: 설명 `출퇴근길에 늘 쓰고 다닐 헤드폰이에요. 색은 크림색이 좋아요!` 가 보인다.
    - expect: `gift progress` 라벨, 모인 금액 `₩32,400`, 목표 금액 `₩45,000 중`, 진행률 `72% 달성` 이 보인다.
    - expect: 진행 막대(`.pub-progress i`)의 inline style width 가 `72%` 이다.
  3. 두 번째 카드(`생일 케이크`)의 내용을 확인합니다.
    - expect: `NO. 2` 와 상태 라벨 `마음 모으는 중` 이 보인다.
    - expect: 레벨 2 제목 `생일 케이크` 가 보인다.
    - expect: 설명 `올해는 딸기 생크림 케이크로 함께 축하해주세요.` 가 보인다.
    - expect: `₩10,640`, `₩28,000 중`, `38% 달성` 이 보이고 진행 막대 width 가 `38%` 이다.
  4. 두 카드에 없어야 하는 요소를 확인합니다. (부정 검증)
    - expect: 링크 `선물 링크 보기` 가 페이지에 존재하지 않는다 (productUrl 이 null).
    - expect: 상태 라벨 `완료` 가 존재하지 않는다 (진행 중인 선물만 있음).
    - expect: 카드 내부에 실제 `<img>` 는 없고 폴백 그래픽 텍스트 `GIFT` 가 각 카드에 있다 (기본 테마에서는 `.gm-pixel` 이 보인다).
    - expect: 각 카드 하단에 summary `이 선물에 마음 보태기` 가 보이고 폼 필드는 아직 보이지 않는다.

### 2. Account

**Seed:** `tests/seed.spec.ts`

#### 2.1. Account Section

**File:** `tests/sample/account-section.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 첫 번째 `details`(계좌 안내)를 확인합니다.
    - expect: 해당 `details` 가 기본으로 열려 있다 (`open` 프로퍼티가 true).
    - expect: summary 에 `gift account`, `계좌 안내`, `마음은 이 계좌로 전할 수 있어요.` 가 보인다.
    - expect: 라벨 `예금주`, 예금주 이름 `김민지`, 계좌 정보 `민지은행 0000-00-0000000` 이 보인다.
    - expect: 버튼 `계좌번호 복사` 가 보인다.
  2. summary 의 `계좌 안내` 텍스트를 클릭합니다.
    - expect: `details` 가 닫힌다 (`open` 이 false).
    - expect: `민지은행 0000-00-0000000` 와 `계좌번호 복사` 버튼이 보이지 않는다.
    - expect: 축하 메시지 details 와 선물 카드 상태에는 영향이 없다 (축하 메시지 details 는 여전히 닫혀 있음).
  3. summary 의 `계좌 안내` 텍스트를 다시 클릭합니다.
    - expect: `details` 가 다시 열리고 `김민지`, `민지은행 0000-00-0000000`, `계좌번호 복사` 가 다시 보인다.

#### 2.2. Copy Account Number

**File:** `tests/sample/copy-account-number.spec.ts`

**Steps:**
  1. [사전 조건] 브라우저 컨텍스트에 `clipboard-read`, `clipboard-write` 권한을 origin `http://localhost:3200` 에 대해 부여합니다 (`test.use({ permissions })` 또는 `context.grantPermissions`). 그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: 계좌 안내 details 가 열려 있고 버튼 `계좌번호 복사` 가 보인다.
  2. 계좌 안내 영역의 버튼 `계좌번호 복사` 를 클릭합니다.
    - expect: 버튼 라벨이 `복사 완료` 로 바뀐다 (계좌 details 범위 안에서 확인).
    - expect: 토스트 `은행과 계좌번호를 복사했어요.` 가 표시된다.
    - expect: `navigator.clipboard.readText()` 결과가 정확히 `민지은행 0000-00-0000000` 이다.
    - expect: 페이지 URL 은 `/sample` 그대로이다.
  3. 약 2~3초 대기합니다.
    - expect: 버튼 라벨이 `계좌번호 복사` 로 되돌아간다.

### 3. Share

**Seed:** `tests/seed.spec.ts`

#### 3.1. Share Link Copy

**File:** `tests/sample/share-link-copy.spec.ts`

**Steps:**
  1. [사전 조건] `clipboard-read`, `clipboard-write` 권한을 부여하고, `page.addInitScript` 로 `Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })` 를 설정해 클립보드 폴백 경로를 강제합니다 (데스크톱 Chromium 은 `navigator.share` 가 function 이라 스텁이 없으면 폴백이 실행되지 않음). 그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: `typeof navigator.share` 가 `undefined` 이고 헤더에 버튼 `공유하기` 가 보인다.
  2. 헤더의 버튼 `공유하기` 를 클릭합니다.
    - expect: 버튼 라벨이 `복사 완료` 로 바뀐다.
    - expect: 토스트 `위시리스트 링크를 복사했어요.` 가 표시된다.
    - expect: 클립보드 문자열을 `new URL(...)` 로 파싱하면 origin 이 `http://localhost:3200`, pathname 이 `/wishlist/sample`, `utm_source` 가 `visitor_share`, `utm_medium` 이 `share` 이다 (현재 구현은 `/sample` 이 아니라 `/wishlist/sample` 링크를 공유함).
    - expect: 페이지 URL 은 `/sample` 그대로이며 새 탭/네비게이션이 발생하지 않는다.
  3. 약 2~3초 대기합니다.
    - expect: 헤더 버튼 라벨이 `공유하기` 로 되돌아간다.

#### 3.2. Native Share Paths

**File:** `tests/sample/native-share-paths.spec.ts`

**Steps:**
  1. [하위 케이스 A: 공유 성공] 새 페이지에서 `addInitScript` 로 `navigator.share` 를 `window.__shareCalls` 에 인자를 기록하고 `Promise.resolve()` 를 반환하는 함수로 교체한 뒤 `/sample` 로 이동하고 헤더의 `공유하기` 를 클릭합니다.
    - expect: `navigator.share` 가 정확히 1번 호출되고 인자가 `{ title: '민지님의 위시리스트', url: 'http://localhost:3200/wishlist/sample?utm_source=visitor_share&utm_medium=share' }` 이다.
    - expect: 토스트 `위시리스트 링크를 복사했어요.` 가 나타나지 않는다.
    - expect: 버튼 라벨은 `공유하기` 그대로이다 (`복사 완료` 로 바뀌지 않음).
  2. [하위 케이스 B: 사용자가 공유 시트를 닫음] 새 페이지에서 `navigator.share` 가 `new DOMException('x', 'AbortError')` 로 reject 되도록 스텁하고 `/sample` 에서 `공유하기` 를 클릭합니다.
    - expect: 토스트가 전혀 나타나지 않는다 (성공/실패 토스트 모두 없음).
    - expect: 버튼 라벨은 `공유하기` 그대로이다 (클립보드 폴백이 실행되지 않음).
  3. [하위 케이스 C: 공유 실패 후 폴백] `clipboard-read`, `clipboard-write` 권한을 부여하고 `navigator.share` 가 `new DOMException('x', 'NotAllowedError')` 로 reject 되도록 스텁한 뒤 `/sample` 에서 `공유하기` 를 클릭합니다.
    - expect: 클립보드 복사 폴백이 실행되어 버튼 라벨이 `복사 완료` 로 바뀐다.
    - expect: 토스트 `위시리스트 링크를 복사했어요.` 가 표시된다.
    - expect: 클립보드 문자열이 `http://localhost:3200/wishlist/sample?utm_source=visitor_share&utm_medium=share` 이다.

#### 3.3. Clipboard Failure Toasts

**File:** `tests/sample/clipboard-failure-toasts.spec.ts`

**Steps:**
  1. [사전 조건] `addInitScript` 로 `navigator.share` 를 `undefined` 로, `navigator.clipboard` 를 `writeText` 가 `Promise.reject(new Error('denied'))` 를 반환하는 객체로 덮어씁니다. 그 후 `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: 헤더의 `공유하기` 버튼과 계좌 영역의 `계좌번호 복사` 버튼이 보인다.
  2. 헤더의 버튼 `공유하기` 를 클릭합니다.
    - expect: 에러 토스트 `링크 복사에 실패했어요. 주소를 직접 복사해주세요.` 가 표시된다 (`data-type="error"`).
    - expect: 버튼 라벨은 `공유하기` 그대로이다 (`복사 완료` 로 바뀌지 않음).
  3. 계좌 영역의 버튼 `계좌번호 복사` 를 클릭합니다.
    - expect: 에러 토스트 `계좌번호 복사에 실패했어요.` 가 표시된다.
    - expect: 버튼 라벨은 `계좌번호 복사` 그대로이다.
    - expect: 토스트가 겹쳐 쌓일 수 있으므로 개수가 아니라 정확한 문구로 단언한다.
    - expect: 페이지가 계속 정상 동작한다 (URL 이 `/sample` 그대로이고 제목 `민지님의 위시리스트` 가 보임).

### 4. Message Form

**Seed:** `tests/seed.spec.ts`

#### 4.1. Message Form Fields and Disabled Submit

**File:** `tests/sample/message-form-fields-and-disabled-submit.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 두 번째 `details`(축하 메시지) 를 확인합니다.
    - expect: summary 에 `gift note`, `축하 메시지 남기기`, `결제 없이 메시지만 전할 수 있어요.` 가 보인다.
    - expect: `details` 가 기본으로 닫혀 있다 (`open` 이 false).
    - expect: 텍스트박스 `이름`, `메시지` 와 버튼 `마음 보내기` 는 아직 보이지 않는다.
  2. summary 의 `축하 메시지 남기기` 를 클릭해 폼을 엽니다.
    - expect: 라벨 `이름` 의 텍스트박스(`#message-sender`)가 보이고 placeholder 가 `이름` 이며 maxlength 가 80 이다.
    - expect: 라벨 `메시지` 의 텍스트박스(`#message-body`, textarea)가 보이고 maxlength 가 500 이며 `required` 이다.
    - expect: 버튼 `마음 보내기` 가 보이고 비활성(disabled)이다.
    - expect: 안내 문구 `샘플 페이지에서는 마음을 보낼 수 없어요.` 가 버튼 아래에 보인다.
    - expect: `보낼 마음` 입력(금액)은 이 폼에 없다.
  3. `이름` 에 `지민`, `메시지` 에 `생일 축하해!` 를 입력합니다.
    - expect: 입력한 값이 각 필드에 그대로 표시된다.
    - expect: 버튼 `마음 보내기` 는 여전히 disabled 이다.
    - expect: `메시지` 에 600자를 입력하면 값 길이가 500자로 제한되고, `이름` 에 100자를 입력하면 80자로 제한된다.
  4. (부정 검증) 요청 감시를 켠 뒤(`page.on('request')`로 POST 기록) disabled 버튼 `마음 보내기` 를 `click({ force: true })` 로 클릭합니다.
    - expect: 페이지 URL 이 `/sample` 그대로이다 (쿼리스트링 없음).
    - expect: POST 요청이 발생하지 않는다 (서버 액션 호출 없음).
    - expect: 성공/실패 토스트가 나타나지 않는다.
    - expect: `details` 는 열린 상태이고 입력값이 유지된다.
  5. summary 를 다시 클릭합니다.
    - expect: `details` 가 닫히고 `이름`/`메시지` 필드가 보이지 않는다.

#### 4.2. Message Form Enter Key (regression)

**File:** `tests/sample/message-form-enter-key.spec.ts`

**Steps:**
  1. [회귀 테스트: Enter 로 GET 암묵 제출되던 버그, skip/fixme/fail 없이 아래 [기대] 항목을 단언] `/sample` 로 이동하고 summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다. `메시지` 에 `생일 축하해!` 를 입력한 뒤, `이름` 에 `지민` 을 입력하고 같은 필드에서 Enter 키를 누릅니다.
    - expect: [기대] Enter 후 약 2초 동안 문서 이동(navigation) 요청이 발생하지 않는다 (Enter 전에 감시를 시작한다).
    - expect: [기대] 페이지 URL 이 `/sample` 그대로이며 쿼리스트링(`senderName`, `body`, `clientRequestId`)이 붙지 않는다.
    - expect: [기대] 폼이 열린 상태로 유지되고 입력값(`지민`, `생일 축하해!`)이 그대로 남는다.
    - expect: [기대] 입력한 메시지 내용이 URL/히스토리에 노출되지 않는다 (README 의 '메시지는 비공개' 요구사항).
    - 참고(수정 전 동작): 브라우저가 form 을 GET 으로 암묵 제출해 `/sample?clientRequestId=<uuid>&senderName=%EC%A7%80%EB%AF%BC&body=%EC%83%9D%EC%9D%BC+%EC%B6%95%ED%95%98%ED%95%B4%21` 로 이동하고 폼이 닫히며 입력값이 사라졌다. 원인: submit 버튼 없음(`type="button"` + disabled), action 없음, 암묵 제출을 막는 텍스트 입력이 `이름` 하나뿐.
  2. (통과 예상 변형) 새 페이지에서 폼을 열고 `메시지` 를 비운 채 `이름` 에 `지민` 을 입력하고 Enter 를 누릅니다.
    - expect: 제출되지 않아 URL 이 `/sample` 그대로이다.
    - expect: `#message-body` 의 `validity.valueMissing` 이 true 이다.

### 5. Gift Form

**Seed:** `tests/seed.spec.ts`

#### 5.1. Gift Form Fields and Disabled Submit

**File:** `tests/sample/gift-form-fields-and-disabled-submit.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기합니다. 선물 카드 `무선 헤드폰` 의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    - expect: 해당 카드 안에서 소제목 `마음 보내기` 가 보인다.
    - expect: 스핀버튼 `보낼 마음`(`#participation-amount-sample-headphones`)이 보이고 placeholder `10000`, min 1, step 1, required 이다.
    - expect: 텍스트박스 `이름`(placeholder `이름`, maxlength 80)과 `메시지`(textarea, maxlength 500, required)가 보인다.
    - expect: 안내 문구 `여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.` 가 보인다.
    - expect: 버튼 `마음 보내기` 가 disabled 이고 그 아래에 `샘플 페이지에서는 마음을 보낼 수 없어요.` 가 보인다.
  2. 다른 카드 `생일 케이크` 의 폼 상태를 확인합니다.
    - expect: `생일 케이크` 카드의 폼은 아직 닫혀 있고 그 안의 필드가 보이지 않는다 (카드별 details 가 독립적이다).
  3. `생일 케이크` 카드의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    - expect: `생일 케이크` 카드에도 동일한 구성의 폼(`보낼 마음`, `이름`, `메시지`, disabled `마음 보내기`, 샘플 안내 문구)이 열리고 필드 id 가 `participation-*-sample-cake` 이다.
    - expect: `무선 헤드폰` 카드의 폼은 계속 열려 있다 (동시에 두 폼이 열릴 수 있음).
  4. `무선 헤드폰` 폼에 `보낼 마음` 10000, `이름` `지민`, `메시지` `축하해` 를 입력합니다.
    - expect: `무선 헤드폰` 폼의 버튼은 여전히 disabled 이다.
    - expect: `생일 케이크` 폼의 필드는 비어 있다 (입력값이 카드 간에 공유되지 않음).
  5. (부정 검증) POST 요청을 감시하면서 `무선 헤드폰` 폼의 disabled 버튼 `마음 보내기` 를 `click({ force: true })` 로 클릭합니다.
    - expect: URL 이 `/sample` 그대로이고 쿼리스트링이 붙지 않는다.
    - expect: POST 요청/토스트/모인 금액 변화가 없다 (`모인 마음` 이 `₩43,040`, `72% 달성` 그대로).
    - expect: 입력값이 유지된다.
  6. `무선 헤드폰` 카드의 summary 를 다시 클릭합니다.
    - expect: 해당 카드의 폼만 닫히고 `생일 케이크` 폼은 열린 상태로 유지된다.

#### 5.2. Gift Form Input Constraints

**File:** `tests/sample/gift-form-input-constraints.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 `생일 케이크` 카드의 summary `이 선물에 마음 보태기` 를 클릭해 폼을 엽니다. 이후 모든 요소는 `생일 케이크` article 범위로 좁혀 찾습니다.
    - expect: 폼 필드 `보낼 마음`, `이름`, `메시지` 가 보인다.
  2. `보낼 마음` 에 `pressSequentially('abc')` 로 문자를 입력합니다 (number 입력에는 `fill('abc')` 를 쓰면 에러).
    - expect: 입력값이 빈 문자열이다 (숫자가 아닌 문자는 입력되지 않음).
  3. `보낼 마음` 에 `-5`, `0`, `1.5`, `12000` 을 차례로 `fill` 하고 각 값에서 `input.validity` 를 확인합니다.
    - expect: `-5` 와 `0`: `validity.valid` 가 false 이고 `rangeUnderflow` 가 true 이다 (최솟값 1 미만).
    - expect: `1.5`: `validity.valid` 가 false 이고 `stepMismatch` 가 true 이다 (정수 단위만 허용).
    - expect: `12000`: `validity.valid` 가 true 이다.
  4. `이름` 에 `'가'` 100자, `메시지` 에 `'나'` 600자를 `fill` 합니다.
    - expect: `이름` 값 길이가 80자로 제한된다.
    - expect: `메시지` 값 길이가 500자로 제한된다.
  5. 새로 고침 후 폼을 다시 열고 `보낼 마음` 과 `메시지` 를 비운 상태로 필수 검증 상태를 확인합니다.
    - expect: `보낼 마음` 과 `메시지` 의 `validity.valueMissing` 이 true 이다 (required).
    - expect: `이름` 은 필수가 아니며 비어 있어도 `validity.valueMissing` 이 false 이다.
  6. (부정 검증) `보낼 마음` 12000, `이름` `지민`, `메시지` `축하해` 를 모두 유효하게 채운 뒤, `이름` 필드에서 Enter 키를 누르고 이어서 `보낼 마음` 필드에서도 Enter 를 누릅니다.
    - expect: 두 경우 모두 페이지 URL 이 `/sample` 그대로이고 쿼리스트링이 붙지 않는다 (카드 폼은 암묵적 제출이 일어나지 않음).
    - expect: 버튼 `마음 보내기` 는 계속 disabled 이며 입력값이 유지된다.

### 6. Theme

**Seed:** `tests/seed.spec.ts`

#### 6.1. Valid Themes

**File:** `tests/sample/valid-themes.spec.ts`

**Steps:**
  1. 쿼리 없이 `/sample` 로 이동합니다.
    - expect: `main[data-theme]` 의 `data-theme` 이 기본값 `pixel_y2k` 이다.
  2. 각 테마 값 `pixel_y2k`, `mono_bw`, `soft_pastel` 에 대해(파라미터화) 새 페이지에서 `/sample?theme=<값>` 로 이동하고 `main[data-theme]` 가 나타날 때까지 대기합니다.
    - expect: `main[data-theme]` 의 `data-theme` 값이 요청한 테마와 정확히 일치한다.
    - expect: 현재 URL 이 `/sample?theme=<값>` 그대로이다 (리다이렉트/정규화 없음).
    - expect: 테마와 무관하게 콘텐츠가 동일하다: 제목 `민지님의 위시리스트`, `SAMPLE` pill, `2개`, `₩43,040`, 카드 2개, 계좌 `민지은행 0000-00-0000000` 이 모두 보인다.
  3. 각 테마에서 선물 폴백 그래픽의 표시 상태를 확인합니다.
    - expect: `pixel_y2k`: `.gm-pixel` 이 display block 이고 `.gm-line`, `.gm-soft` 는 display none 이다.
    - expect: `mono_bw`: `.gm-line` 만 block 이다.
    - expect: `soft_pastel`: `.gm-soft` 만 block 이다.
  4. (선택, 디자인 변경에 민감한 보조 검증) `main` 의 computed `background-color` 를 확인합니다.
    - expect: `pixel_y2k`: `rgb(255, 247, 237)`, `mono_bw`: `rgb(255, 255, 255)`, `soft_pastel`: `rgb(251, 245, 255)` 이다. 세 값이 서로 달라야 한다는 점이 핵심이며, 디자인 토큰 변경 시 이 단언은 갱신이 필요하다.

#### 6.2. Invalid Theme Fallback

**File:** `tests/sample/invalid-theme-fallback.spec.ts`

**Steps:**
  1. 다음 각 쿼리에 대해(파라미터화) 새 페이지에서 `/sample?<쿼리>` 로 이동하고 응답 상태와 `main[data-theme]` 를 확인합니다: `theme=invalid`, `theme=MONO_BW` (대소문자 불일치), `theme=` (빈 값), `theme=mono_bw&theme=soft_pastel` (중복 파라미터), `theme=%3Cscript%3Ealert(1)%3C%2Fscript%3E` (스크립트 형태 문자열).
    - expect: 모든 경우에 응답이 HTTP 200 이고 오류 화면이 아니다.
    - expect: `main[data-theme]` 의 `data-theme` 이 `pixel_y2k` 로 폴백된다 (테마 값은 대소문자를 구분하며 중복 파라미터는 유효값으로 인정되지 않음).
    - expect: 현재 URL 의 쿼리스트링이 입력한 그대로 유지된다 (리다이렉트 없음).
    - expect: 콘텐츠가 정상 렌더링된다: 제목 `민지님의 위시리스트`, `SAMPLE` pill, 카드 2개.
    - expect: 스크립트 형태의 값이 DOM 에 실행/삽입되지 않고 `window` 의 alert 다이얼로그가 발생하지 않는다.
  2. 유효 테마 후 무효 테마로 이동합니다: `/sample?theme=soft_pastel` 로 이동해 `data-theme` 이 `soft_pastel` 인 것을 확인한 뒤 `/sample?theme=nope` 로 이동합니다.
    - expect: 두 번째 페이지의 `data-theme` 은 `pixel_y2k` 이다 (이전 테마가 남지 않음).

### 7. Navigation

**Seed:** `tests/seed.spec.ts`

#### 7.1. CTA and Footer Links

**File:** `tests/sample/cta-and-footer-links.spec.ts`

**Steps:**
  1. `/sample` 로 이동하고 레벨 1 제목이 보일 때까지 대기한 뒤 페이지 하단으로 스크롤합니다.
    - expect: 텍스트 `make your own` 가 보인다.
    - expect: 링크 `내 위시리스트 만들기` 가 보이고 href 가 `/login` 이다.
  2. 푸터를 확인합니다. (링크는 href 만 단언하고 외부 링크는 클릭하지 않음)
    - expect: 푸터에 `뭐갖고싶어` 텍스트가 보인다.
    - expect: 링크 `이용약관` 의 href 가 `/terms` 이다.
    - expect: 링크 `개인정보 처리방침` 의 href 가 `/privacy` 이다.
    - expect: 링크 `문의하기` 의 href 가 `https://forms.gle/WYpBboXs3WphC7ai6` 이다.
    - expect: 저작권 문구가 정규식 `/© \d{4} 뭐갖고싶어/` 와 일치한다.
  3. 링크 `내 위시리스트 만들기` 를 클릭합니다. (도착 URL 확인만 하고 로그인 페이지의 Google/Kakao 버튼 등 어떤 요소도 클릭하지 않음)
    - expect: URL 이 `http://localhost:3200/login` 으로 바뀌고 pathname 이 `/login` 이다.
    - expect: OAuth 이동이나 쓰기 요청이 발생하지 않는다.
  4. 브라우저 뒤로 가기를 실행합니다.
    - expect: `/sample` 로 돌아오고 레벨 1 제목 `민지님의 위시리스트` 가 다시 보인다.
  5. 헤더의 링크 `뭐갖고싶어` 를 클릭합니다.
    - expect: URL 의 pathname 이 `/` 로 바뀐다 (홈으로 이동).
