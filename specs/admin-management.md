# Admin Management (/admin) E2E Test Plan — 1차

## 대상 및 범위

"뭐갖고싶어"의 관리자 화면 `/admin` 중 1차분(로그인 경계, 온보딩 완료, 선물 관리, 메시지함, 다른 사용자 데이터 권한)을 검증하는 E2E 테스트 계획입니다.

- 화면·라우트 소스: `app/admin/layout.tsx`(로그인·온보딩 경계, 사이드바 안 읽은 메시지 수), `app/admin/admin-shell-nav.tsx`, `app/admin/admin-toast-events.tsx`(토스트 문구), `app/onboarding/page.tsx`·`birthday-picker.tsx`, `app/api/onboarding/route.ts`, `app/admin/wishes/page.tsx`·`link-autofill-button.tsx`, `app/api/admin/wishes/route.ts`·`[id]/route.ts`, `app/admin/messages/page.tsx`·`hide-message-form.tsx`, `app/api/admin/messages/[id]/route.ts`. 도메인 로직은 `src/lib/onboarding/*`, `src/lib/wishes/*`, `src/lib/admin-messages/*`, `src/lib/wish-item/status.ts` 입니다.
- 동작 방식: 로그인은 Auth.js database 세션(`auth.ts`)입니다. OAuth 대신 fixture 가 `sessions` 행을 넣고 브라우저에 `authjs.session-token` 쿠키를 넣습니다(`tests/fixtures/admin.ts`). 관리자 변경은 서버 액션이 아니라 `/api/admin/*` route handler 로 form POST 되고, 처리 뒤 `?created=1`·`?updated=1`·`?deleted=1`·`?messageHidden=1`·`?messageRestored=1`·`?error=...` 로 리다이렉트합니다. 클라이언트(`AdminToastEvents`)가 토스트를 띄우고 `router.replace` 로 그 쿼리를 지웁니다. 서버가 DB 를 바로 쓰므로 `page.route()` 로 가로챌 수 없고, 저장 결과는 fixture `e2eDb` 로 DB 를 직접 조회해 확인합니다. 예외는 링크 자동 입력의 `/api/admin/wishes/link-preview` 로, 브라우저 `fetch` 라서 `page.route()` 로 가짜 응답을 줍니다(외부 사이트에 접속하지 않음).
- baseURL: `http://localhost:3200` (`playwright.config.ts`, project: chromium, 데스크톱 1280x720). 탐색용 seed 는 `tests/admin/seed.spec.ts`(온보딩 완료 관리자)와 `tests/admin/seed-onboarding.spec.ts`(온보딩 전 사용자)이며, **각 테스트는 seed 를 재사용하지 않고 자기 `seedAdmin({...})` 로 새 사용자를 만듭니다.** 모든 테스트 파일은 `tests/admin/` 아래에 두고 `import { test, expect } from "../fixtures/admin"` 을 씁니다.
- 범위 밖(이 계획에 넣지 않음): `/admin/settings` 화면 동작(경계 리다이렉트만 포함), 위시리스트 초기화, 로그아웃, 관리자 홈 요약 내용, 공유 버튼, 첫 진입 안내 모달(`signIn` 이 꺼 둠), 14세 미만 계정 삭제, 실제 OAuth, 모바일 nav, 선물 입력값 서버 검증 오류(`title_required` 등 — 브라우저 `required`·`min`·`max`·`type=url` 이 먼저 막음).
- 탐색은 2026-11-14 실제 dev 서버(3200, 로컬 E2E DB)에서 Playwright MCP 로 했습니다. planner 서브에이전트가 확인 창 처리 중 멈춰(아래 "탐색 중 발견한 사항" 참고) 남은 탐색과 문서 작성은 메인 세션이 같은 MCP 브라우저로 이어서 했습니다. 탐색 중에는 DB 를 볼 수 없었으므로 **DB 단언(e2eDb)은 코드 근거**이며 각 단계에 표시했습니다.

## 탐색으로 확인한 실제 렌더링 데이터

탐색용 seed(`tests/admin/seed.spec.ts`): 선물 4개(무선 이어폰 open 30,000/100,000 · 캠핑 의자 paused 0/80,000 · 보드게임 fulfilled 0/40,000 · 숨긴 선물 hidden 0/10,000), 메시지 3개(김친구 `생일 축하해!` · 이친구 `이어폰에 보태요` 무선 이어폰에 30,000원 · 박친구 `숨긴 메시지` 숨김).

- 공통 셸(데스크톱): `complementary`(사이드바) 안에 링크 `뭐갖고싶어 홈`(href `/`), 레벨 1 제목 `위시리스트 관리`, `navigation` 링크 `홈`(href `/admin`)·`선물 관리`·`메시지함`·`설정`·`사용 가이드`(href `<현재 경로>?guide=1`), 계정 이메일(`admin-<12자>@e2e.test`). 현재 화면 링크는 `aria-current="page"`. `main` 헤더에 현재 화면 이름(`선물 관리` 등)과 링크 `공개 페이지 보기`(href `/wishlist/<slug>`). 모바일 nav 는 DOM 에 있지만 숨겨져 있습니다.
- 안 읽은 메시지 배지: 사이드바 링크 이름이 `메시지함 새 메시지 2개` 가 되고, 배지 요소의 aria-label 이 `새 메시지 2개`, 텍스트 `2` 입니다. 숨긴 메시지는 세지 않았습니다(seed 3개 중 2개). 0이면 배지가 렌더링되지 않습니다.
- 선물 관리 `/admin/wishes`:
  - 지표: `총 선물` `4개`, `모인 금액` `₩30,000`(hidden 포함 전체 합, 금액 기호는 U+20A9).
  - `navigation "선물 상태 필터"` 링크: `전체 4`(href `/admin/wishes`), `마음 모으는 중 1`(`?status=open`), `잠시 멈춤 1`(`?status=paused`), `완료 1`(`?status=fulfilled`), `숨김 1`(`?status=hidden`). 링크 이름은 라벨과 개수가 붙은 문자열입니다.
  - `선물 추가` 패널: `details#create-wish`(선물이 있으면 닫힘, summary `선물 추가 펼치기`). 열면 `선물 이름`(textbox, required, maxlength 120), `목표 금액`(spinbutton, min 1, max 2,147,483,647, required, placeholder `45000`), `상품 링크`(textbox, type url) + 버튼 `정보 불러오기`, `이미지 링크`, `메모`(textarea), 버튼 `추가하기`. 필수 라벨에는 `*`(aria-label `필수`)가 붙습니다.
  - 선물 카드: 각각 `details`(role `group`). summary 에 레벨 3 제목(선물 이름), 상태 배지(`마음 모으는 중`/`잠시 멈춤`/`완료`/`숨김`), `₩30,000 / ₩100,000`, `수정`. 열면 `선물 이름`, `상태`(combobox, 옵션 `마음 모으는 중`·`잠시 멈춤`·`완료`·`숨김`, value `open`/`paused`/`fulfilled`/`hidden`), `목표 금액`, `상품 링크` + `정보 불러오기`, `이미지 링크`, `메모`, 버튼 `저장`, 그리고 별도 폼의 버튼 `삭제`.
- 메시지함 `/admin/messages`:
  - 지표 하나: 받은 메시지함은 `받은 메시지` `2개`, 숨긴 메시지함은 `숨긴 메시지` `1개`.
  - `navigation "메시지 필터"` 링크 `받은 메시지`(href `/admin/messages`), `숨긴 메시지`(href `/admin/messages?filter=hidden`).
  - 메시지 행은 `article`(최신순). 행 텍스트: 선물 이름 pill(없으면 `선물 없음`), KST 시각(예 `2026. 11. 14. 오후 4:35`), 보낸 사람(없으면 `익명`), 본문, 금액(`₩30,000` 또는 `금액 없음`), 버튼 `숨기기`(받은 메시지) 또는 `숨김 해제`(숨긴 메시지).
- 온보딩 `/onboarding`: 레벨 1 제목 `기본 위시리스트 만들기`, `표시 이름`(textbox, users.name 으로 미리 채워짐: seed 값 `E2E 관리자`), `생일`(버튼, 처음 텍스트 `생일을 선택하세요`), `소개`(textbox), 체크박스 `만 14세 이상입니다. (만 14세 미만은 가입할 수 없어요)`, 버튼 `위시리스트 만들기`.
- 로그인 `/login`: 레벨 1 제목 `로그인`, 버튼 `Google로 계속하기`, `Kakao로 계속하기`.

## 테스트 생성기(generator)를 위한 공통 주의사항

1. **fixture 사용**: `import { test, expect } from "../fixtures/admin"`. `seedAdmin({ onboarded?, displayName?, items?, messages? })` 는 호출마다 새 사용자(`admin-<12자>@e2e.test`, users.name = displayName, 기본 `E2E 관리자`)와 database 세션을 만들고, `onboarded`(기본 true)면 온보딩 완료 profile 과 위시리스트(slug `e2e-<12자>`, 제목 `${displayName}님의 위시리스트`, public)·선물·메시지·후원 기록을 만듭니다. 반환값은 `{ userId, email, sessionToken, wishlistId, slug, items: [{ id, title }], messages: [{ id, body }] }` 이고 `onboarded: false` 면 `wishlistId`·`slug` 가 null 입니다. `items` 배열 순서가 sortOrder, `status` 생략 시 `open`, `fundedAmount` 생략 시 0 입니다. `messages` 의 각 항목은 `{ senderName, body, isHidden?, wishItemIndex?, amount? }` 이고 `amount` 를 주면 `funding_logs` 행도 만듭니다(선물의 `fundedAmount` 는 `items` 에서 직접 맞춥니다). 메시지 `createdAt` 은 배열 순서대로 1분 간격 과거(첫 항목이 가장 최근)이고 `wishlists.messagesReadAt` 은 null 입니다. `signIn(admin)` 은 브라우저 컨텍스트에 세션 쿠키를 넣고 첫 진입 안내 모달을 끕니다. 비로그인 시나리오는 `signIn` 을 부르지 않습니다. 테스트 종료 시 fixture 가 사용자를 지워 FK cascade 로 정리하므로 직접 지울 필요가 없습니다(온보딩으로 새로 생긴 profile·위시리스트도 같은 사용자라 함께 지워짐).
2. **첫 이동 대기**: `/admin` 레이아웃은 Suspense 로 스켈레톤 셸을 먼저 보낼 수 있어(탐색: 이동 직후 `main header` 가 잠시 2개) 셸 요소가 아니라 그 화면의 실제 내용(선물 제목, `navigation "메시지 필터"`, 온보딩 제목 등)을 기다리세요. dev 서버 첫 컴파일이 느리므로 첫 대기는 timeout 30초를 권장합니다.
3. **토스트**: sonner `[data-sonner-toast]`(`data-type` = `success`/`warning`/`error`). 탐색에서 제출 후 약 1초 안에 나타났고 3.5초 시점엔 남아 있었으며 6.5초 시점엔 사라졌습니다. **제출 직후 토스트를 먼저 확인**하고 DB 조회는 그 뒤에 하세요. 로케이터 예: `page.locator('[data-sonner-toast]').filter({ hasText: '선물을 추가했어요.' })`. 문구(`app/admin/admin-toast-events.tsx`): 추가 `선물을 추가했어요.`, 계좌 없음 경고 `계좌번호가 등록되어 있지 않아요. 설정에서 계좌번호를 추가해 주세요.`(warning, 버튼 `계좌 등록`), 수정 `선물을 수정했어요.`, 삭제 `선물을 삭제했어요.`, 숨김 `참여 기록을 숨겼어요.`, 복구 `참여 기록을 복구했어요.`, 오류 `요청을 처리하지 못했어요.`. 토스트를 띄운 뒤 쿼리는 지워지므로 `await expect(page).toHaveURL(/\/admin\/wishes$/)` 처럼 정리된 URL 을 기다리세요.
4. **선물 카드 범위 좁히기**: `const card = page.locator('details').filter({ has: page.getByRole('heading', { level: 3, name: '<선물 이름>' }) })`. summary 를 클릭해 연 뒤 `card.getByRole('textbox', { name: '선물 이름' })`, `card.getByRole('combobox', { name: '상태' })`, `card.getByRole('spinbutton', { name: '목표 금액' })`, `card.getByRole('textbox', { name: '메모' })`, `card.getByRole('button', { name: '저장' })`, `card.getByRole('button', { name: '삭제' })` 가 동작했습니다. 추가 패널은 `page.locator('details#create-wish')` 로 범위를 좁히고 `getByLabel('선물 이름')`, `getByLabel('목표 금액')`, `getByLabel('상품 링크')`, `getByLabel('이미지 링크')`, `getByLabel('메모')`, 버튼 `추가하기`·`정보 불러오기` 를 씁니다. 저장·추가·삭제 뒤에는 페이지가 다시 렌더링돼 카드 `details` 가 닫힙니다(탐색: 수정 후 `open` false).
5. **상태 배지와 탭 문구 겹침**: `마음 모으는 중`·`잠시 멈춤`·`완료`·`숨김` 이 필터 탭 링크, 카드 배지, `상태` select 옵션에 모두 있습니다. 탭은 `page.getByRole('navigation', { name: '선물 상태 필터' }).getByRole('link', { name: /^잠시 멈춤/ })`, 배지는 카드 summary 범위(`card.locator('summary').getByText('잠시 멈춤', { exact: true })`)로 좁히세요. 탭 개수는 링크 안 숫자(`link` 이름 `잠시 멈춤 1`)로 확인합니다.
6. **사이드바**: `page.getByRole('complementary')` 로 범위를 좁힙니다. `홈` 링크는 `뭐갖고싶어 홈` 과 겹치므로 `{ name: '홈', exact: true }` 가 필요했습니다. 안 읽은 배지는 `page.getByRole('complementary').getByLabel('새 메시지 2개')`, 배지가 없음은 `getByLabel(/^새 메시지/)` 의 count 0 으로 확인합니다. `/admin` 홈에서는 `공개 페이지 보기` 링크가 헤더와 본문에 2개 있습니다.
7. **확인 창**: 메시지 `숨기기` 는 `window.confirm` 을 띄웁니다. 테스트에서는 클릭 **전에** `page.once('dialog', dialog => ...)` 로 메시지를 기록하고 `accept()`/`dismiss()` 하세요. 문구(관찰): 금액 있는 참여 `이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.`, 금액 없는 메시지 `이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.`(코드 근거). `숨김 해제` 와 선물 `삭제` 는 확인 창이 없습니다(삭제는 관찰, 해제는 코드 근거).
8. **메시지함 문구 겹침**: `받은 메시지`·`숨긴 메시지` 가 필터 탭과 지표 라벨에 모두 있습니다. 탭은 `page.getByRole('navigation', { name: '메시지 필터' })` 안에서, 지표는 `page.getByText('받은 메시지', { exact: true })` 대신 지표 값(`getByText('2개', { exact: true })`)으로 확인하세요. 행은 `page.getByRole('article').filter({ hasText: '<본문>' })` 로 고릅니다.
9. **DB 조회(e2eDb)**: `import { eq } from "drizzle-orm"` 와 `import { fundingLogs, messages, profiles, wishItems, wishlists } from "@/src/lib/db/schema"`. 컬럼은 camelCase(`wishlistId`, `title`, `targetAmount`, `fundedAmount`, `status`, `description`, `productUrl`, `imageUrl`, `isHidden`, `messagesReadAt`, `displayName`, `birthday`(문자열 `YYYY-MM-DD`), `onboardingCompletedAt`, `ownerId`, `visibility`)입니다. 성공 제출은 리다이렉트 전에 DB 에 쓰지만 여유를 위해 `expect.poll(...)` 로 기다리세요. 거절 요청은 응답을 받은 뒤 바로 단언해도 됩니다.
10. **시각**: 로컬 E2E DB 세션 시간대가 Asia/Seoul(`now()` 가 `+09`)이라 `defaultNow()` 로 들어간 값은 Drizzle 이 UTC 로 읽을 때 9시간 앞섭니다. 안 읽은 메시지 비교용 메시지를 테스트에서 직접 넣을 때는 `createdAt: new Date()` 를 명시하세요(fixture 도 같은 이유로 `createdAt` 을 넣음). 화면의 메시지 시각 문자열은 단언하지 마세요.
11. **API 직접 요청**: `page.request` 는 브라우저 컨텍스트 쿠키를 공유합니다(로그인 상태 요청). 비로그인 요청은 `signIn` 을 부르지 않은 테스트의 `page.request` 를 쓰면 됩니다. 리다이렉트는 `maxRedirects: 0` 으로 받아 `status()` 가 `307` 이고 `new URL(response.headers()['location'])` 의 `pathname`·`search` 를 단언합니다(탐색: `location` 은 `http://localhost:3200/...` 절대 URL). JSON 요청은 `data: {...}` 로 보내면 `content-type: application/json` 이 붙습니다.
12. **링크 자동 입력**: `page.route('**/api/admin/wishes/link-preview**', route => route.fulfill({ json: { preview: { title, imageUrl, price } } }))` 로 가짜 응답을 줍니다. 버튼은 빈 칸만 채웁니다(`fillEmptyFields`).
13. **금액 기호**: `formatCurrency` 결과(`₩45,000`)의 기호는 U+20A9 입니다. 복사해서 쓰거나 `/45,000/` 정규식을 쓰세요.

## 탐색 중 발견한 사항

- **[관찰] 선물 `삭제` 는 확인 창 없이 바로 지워집니다.** 탐색에서 `보드게임` 카드의 `삭제` 를 눌렀을 때 dialog 이벤트가 없었고 곧바로 `선물을 삭제했어요.` 토스트와 함께 카드가 사라졌습니다. 메시지 `숨기기` 는 확인 창이 있고 복구할 수 있는 반면, 선물 삭제는 되돌릴 수 없고(`wish_items` 행 삭제, 참여 기록의 `funding_logs` 는 cascade 삭제·`messages.wishItemId` 는 null) 확인도 없습니다. 의도인지 사용자 확인이 필요합니다. 시나리오 3.5 는 현재 동작(확인 창 없음)을 기록합니다.
- **[코드 근거] 선물 저장 실패 시 오류 사유가 토스트에 나오지 않습니다.** `/api/admin/wishes*` 는 `?error=title_required` 등으로 보내지만 `AdminToastEvents` 의 `adminErrorMessages` 에는 `reserved_slug`, `invalid_account_number` 만 있어 모든 선물 오류가 `요청을 처리하지 못했어요.` 로 표시됩니다. `app/admin/wishes/page.tsx` 의 `errorMessages` 는 목록 조회 실패에만 쓰입니다. 브라우저 검증이 대부분 막으므로 1차 시나리오에는 넣지 않았습니다.
- **[관찰] 형식이 잘못된 id 는 `wish_not_found` 가 아니라 `unexpected` 로 처리됩니다.** `POST /api/admin/wishes/not-a-uuid`(`_method=patch`)는 307 `/admin/wishes?error=unexpected` 였고 서버 콘솔에 오류가 남았습니다(Postgres uuid 형변환 오류가 catch 로 감). 데이터는 바뀌지 않으므로 권한 문제는 아닙니다. 권한 시나리오는 실제 다른 사용자의 UUID 를 씁니다.
- **[코드 근거] 금액을 다 모은 `open` 선물은 배지가 `완료` 지만 필터는 `마음 모으는 중` 탭에 들어갑니다.** 배지는 `getWishStatusLabel(status, progress)`(진행률 100% 면 `완료`), 필터와 탭 개수는 DB `status` 기준입니다(`app/admin/wishes/page.tsx`). 공개 페이지도 같은 배지 규칙입니다. 시나리오 3.6 이 현재 동작을 기록합니다.
- **[관찰] 온보딩 서버 오류 뒤에는 입력값이 남지 않습니다.** 나이 확인 없이 `/api/onboarding` 에 직접 보낸 `displayName: 확인 안 함` 은 `/onboarding?error=age_confirmation_required` 로 돌아온 뒤 `E2E 관리자`(users.name)로 다시 채워졌고, 오류는 토스트가 아니라 폼 위 문단으로 표시되며 `?error=` 쿼리도 남습니다. 브라우저 `required` 가 먼저 막는 경로라 일반 사용자에게는 드뭅니다.
- **[관찰] 비로그인 `/admin/*` 문서 응답은 HTTP 200 으로 `/login` 에 도착합니다.** 레이아웃이 Suspense 안에서 `redirect('/login')` 해 스트리밍 중 클라이언트 이동이 일어납니다. 상태 코드는 단언하지 않고 최종 URL 과 로그인 화면만 확인합니다.
- **[관찰 / 환경] 로컬 E2E DB 시간대가 운영과 다릅니다.** `mwagotgo_e2e` 의 `now()` 는 `+09`(Asia/Seoul)이고, 운영·개발 Neon 은 UTC 입니다(2026-10-26 확인 기록). 공개 참여(`src/lib/public-participation/*`)로 만들어진 메시지는 `defaultNow()` 라 이 DB 에서는 9시간 미래로 읽혀, 메시지함을 열어도 안 읽은 메시지로 남습니다. 1차 시나리오는 fixture 가 `createdAt` 을 넣어 피했지만, 공개 참여와 관리자 읽음 처리를 한 테스트에서 엮을 때는 DB 시간대를 UTC 로 맞추는 방법을 먼저 정해야 합니다.
- **[도구] Playwright MCP 의 `browser_run_code_unsafe` 안에서는 `window.confirm` 이 MCP 모달 상태로 넘어가 `page.once('dialog')` 가 동작하지 않고 코드 실행이 끊깁니다.** 또 run_code 의 `waitFor()` 는 기본 timeout 이 없어, 확인 창 처리와 다음 호출 사이에 사라진 토스트를 기다리면 무기한 멈췄습니다(이번 탐색에서 30분 정지, planner 서브에이전트 정지도 같은 원인으로 추정). 탐색 중 확인 창은 `browser_handle_dialog` 로 처리하고 run_code 의 모든 대기에 timeout 을 주세요. 생성된 테스트 코드(`page.once('dialog')`)에는 해당하지 않습니다.

## 시나리오 목록 요약

1. Unauthenticated Admin Pages Redirect To Login
2. Unauthenticated Admin API Rejected
3. Incomplete Onboarding Redirects To Onboarding
4. Complete Onboarding
5. Onboarding Age Confirmation Required
6. Create Wish
7. Create Wish With Link Autofill
8. Edit Wish
9. Change Wish Status
10. Delete Wish
11. Filter Wishes By Status
12. Hide And Restore Funded Message
13. Cancel Hide Message
14. Message Filters
15. Unread Message Badge
16. Cross Account Wish Rejected
17. Cross Account Message Rejected

(아래 "Test Scenarios" 는 묶음 번호 `N.M` 을 씁니다. 1.x 로그인 경계, 2.x 온보딩, 3.x 선물, 4.x 메시지, 5.x 권한입니다.)


## Test Scenarios

### 1. Admin Login Boundary

**Seed:** `tests/admin/seed.spec.ts`

#### 1.1. Unauthenticated Admin Pages Redirect To Login

**File:** `tests/admin/unauthenticated-admin-pages.spec.ts`

**Steps:**
  1. [사전 조건] 이 테스트는 `seedAdmin`·`signIn` 을 호출하지 않습니다(쿠키 없는 새 컨텍스트). `/admin` 으로 이동합니다.
    - expect: URL 이 `/login` 이 된다 (`expect(page).toHaveURL(/\/login$/, { timeout: 30_000 })`).
    - expect: 레벨 1 제목 `로그인` 과 버튼 `Google로 계속하기` 가 보인다.
    - expect: 사이드바(`complementary`)와 `위시리스트 관리` 제목이 없다.
  2. `/admin/wishes`, `/admin/messages`, `/admin/settings` 로 차례로 이동합니다.
    - expect: 각각 URL 이 `/login` 이 되고 버튼 `Google로 계속하기` 가 보인다.

#### 1.2. Unauthenticated Admin API Rejected

**File:** `tests/admin/unauthenticated-admin-api.spec.ts`

**Steps:**
  1. [사전 조건] 데이터 주인 B 를 만듭니다: `seedAdmin({ displayName: "E2E 주인", items: [ { title: "캠핑 의자", targetAmount: 80_000 } ], messages: [ { senderName: "김친구", body: "생일 축하해!" } ] })`. `signIn` 은 호출하지 않습니다.
    - expect: `items` 1개와 `messages` 1개가 반환된다.
  2. 로그인 없이 `page.request.post('/api/admin/wishes', { form: { title: "익명 선물", targetAmount: "1000" }, maxRedirects: 0 })` 를 보냅니다.
    - expect: 상태 `307`, `location` pathname 이 `/login` 이다.
  3. JSON 으로 `page.request.post('/api/admin/wishes', { data: { title: "익명 선물", targetAmount: 1000 } })` 를 보냅니다.
    - expect: 상태 `401`, 본문이 `{ error: "unauthorized" }` 이다.
  4. B 의 선물 id 로 `page.request.post(\`/api/admin/wishes/${items[0].id}\`, { form: { _method: "patch", title: "바뀐 이름", targetAmount: "1", status: "hidden" }, maxRedirects: 0 })` 와 `{ form: { _method: "delete" } }` 를 보냅니다.
    - expect: 둘 다 상태 `307`, `location` pathname 이 `/login` 이다.
  5. B 의 메시지 id 로 `page.request.post(\`/api/admin/messages/${messages[0].id}\`, { form: { intent: "hide" }, maxRedirects: 0 })` 를 보냅니다.
    - expect: 상태 `307`, `location` pathname 이 `/login` 이다.
  6. [e2eDb 조회, 코드 근거] B 의 데이터를 조회합니다.
    - expect: `wish_items`(`wishlistId = B.wishlistId`)가 1행이고 `title` `캠핑 의자`, `targetAmount` `80000`, `status` `open` 그대로이다(`익명 선물` 행 없음).
    - expect: `messages`(`id = messages[0].id`)의 `isHidden` 이 `false` 이다.

#### 1.3. Incomplete Onboarding Redirects To Onboarding

**File:** `tests/admin/incomplete-onboarding-redirect.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ onboarded: false })`, `await signIn(admin)`.
    - expect: `admin.wishlistId` 가 null 이다.
  2. `/admin` 으로 이동합니다.
    - expect: URL 이 `/onboarding` 이 되고(timeout 30초) 레벨 1 제목 `기본 위시리스트 만들기` 가 보인다.
    - expect: 사이드바(`complementary`)가 없다.
  3. `/admin/wishes`, `/admin/messages` 로 차례로 이동합니다.
    - expect: 각각 URL 이 `/onboarding` 이 되고 레벨 1 제목 `기본 위시리스트 만들기` 가 보인다.
  4. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    - expect: `profiles`(`userId = admin.userId`)와 `wishlists`(`ownerId = admin.userId`)가 0행이다(경계가 데이터를 만들지 않음).

### 2. Onboarding

**Seed:** `tests/admin/seed-onboarding.spec.ts`

#### 2.1. Complete Onboarding

**File:** `tests/admin/complete-onboarding.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ onboarded: false, displayName: "소셜 이름" })`, `await signIn(admin)`. `/onboarding` 으로 이동해 레벨 1 제목 `기본 위시리스트 만들기` 가 보일 때까지 기다립니다(timeout 30초).
    - expect: `표시 이름` 에 `소셜 이름` 이 미리 채워져 있다.
    - expect: 버튼 `생일` 의 텍스트가 `생일을 선택하세요` 이다.
    - expect: 체크박스 `만 14세 이상입니다.` 가 체크되어 있지 않다.
  2. `표시 이름` 을 `E2E 생일자` 로 바꾸고, 버튼 `생일` 을 눌러 달력을 엽니다. `getByRole('combobox', { name: 'Choose the Year' })` 에서 `2000`, `getByRole('combobox', { name: 'Choose the Month' })` 에서 3월(옵션 index 2)을 고른 뒤 `getByRole('button', { name: /March 15th, 2000/ })` 을 누릅니다. (탐색: 달력 grid 이름 `March 2000`, 날짜 버튼 이름 예 `Wednesday, March 15th, 2000`)
    - expect: 달력 팝오버(`dialog`)가 닫힌다.
    - expect: 버튼 `생일`(`#birthday`)의 텍스트가 `2000-03-15` 이고 hidden input `input[name=birthday]` 값이 `2000-03-15` 이다.
    - expect: 버튼 `선택 해제` 가 보인다.
  3. `소개` 에 `올해도 잘 부탁해요` 를 입력하고 체크박스 `만 14세 이상입니다.` 를 체크한 뒤 버튼 `위시리스트 만들기` 를 누릅니다.
    - expect: URL 이 `/admin` 이 된다(timeout 30초).
    - expect: 사이드바 링크 `홈`(exact)이 `aria-current="page"` 이고 계정 이메일 `admin.email` 이 보인다.
    - expect: 첫 진입 안내 모달(`dialog`)이 없다(`signIn` 이 꺼 둠).
    - expect: 링크 `공개 페이지 보기` 의 href 가 `/wishlist/w-` 로 시작한다(탐색: `/wishlist/w-9d1498814ff4486b`, `createRandomWishlistSlug` 형식).
  4. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    - expect: `profiles` 가 1행이고 `displayName` `E2E 생일자`, `birthday` `2000-03-15`, `description` `올해도 잘 부탁해요`, `onboardingCompletedAt` 이 null 이 아니다.
    - expect: `wishlists` 가 1행이고 `title` `E2E 생일자님의 위시리스트`, `visibility` `public`, `slug` 가 위 링크의 slug 와 같다.
  5. `/onboarding` 으로 다시 이동합니다.
    - expect: URL 이 `/admin` 이 된다(온보딩을 마친 사용자는 온보딩 화면에 머물지 않음).

#### 2.2. Onboarding Age Confirmation Required

**File:** `tests/admin/onboarding-age-confirmation-required.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ onboarded: false })`, `await signIn(admin)`. `/onboarding` 으로 이동해 제목을 기다립니다(timeout 30초).
  2. 체크박스를 체크하지 않은 채 버튼 `위시리스트 만들기` 를 누릅니다.
    - expect: URL 이 `/onboarding` 그대로이다(브라우저 검증이 제출을 막음).
    - expect: 체크박스의 `validity.valueMissing` 이 `true` 이다(`evaluate`).
  3. 브라우저 검증을 건너뛰는 경우를 확인합니다: `page.request.post('/api/onboarding', { form: { displayName: "확인 안 함", birthday: "2000-03-15" }, maxRedirects: 0 })`(ageConfirmed 없음).
    - expect: 상태 `307`, `location` 의 pathname 이 `/onboarding`, search 가 `?error=age_confirmation_required` 이다.
  4. 그 `location` 으로 이동합니다.
    - expect: 문구 `만 14세 이상인지 확인해주세요.` 가 보인다.
  5. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    - expect: 둘 다 0행이다.
  6. `/admin` 으로 이동합니다.
    - expect: URL 이 `/onboarding` 이 된다(아직 온보딩 미완료).

### 3. Wish Management

**Seed:** `tests/admin/seed.spec.ts`

#### 3.1. Create Wish

**File:** `tests/admin/create-wish.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`(선물 없음, 계좌 없음), `await signIn(admin)`. `/admin/wishes` 로 이동해 문구 `등록된 선물이 없습니다.` 가 보일 때까지 기다립니다(timeout 30초).
    - expect: 지표 `총 선물` 이 `0개`, `모인 금액` 이 `₩0` 이다.
    - expect: 선물이 없으므로 `details#create-wish` 가 열려 있다(`open` true, 코드 근거: `open={result.items.length === 0 && !selectedStatus}`).
    - expect: 링크 `선물 추가하기`(href `#create-wish`)가 보인다.
  2. 추가 패널에서 `선물 이름` `E2E 텀블러`, `목표 금액` `45000`, `메모` `보온 되는 걸로` 를 입력하고 버튼 `추가하기` 를 누릅니다.
    - expect: 토스트 `선물을 추가했어요.`(`data-type` `success`)가 보인다.
    - expect: 토스트 `계좌번호가 등록되어 있지 않아요. 설정에서 계좌번호를 추가해 주세요.`(`data-type` `warning`)와 그 안의 버튼 `계좌 등록` 이 보인다(클릭하지 않음).
    - expect: URL 이 `/admin/wishes` 로 정리된다(쿼리 없음).
  3. 목록을 확인합니다.
    - expect: 레벨 3 제목 `E2E 텀블러` 카드가 있고 summary 에 배지 `마음 모으는 중` 과 `₩0 / ₩45,000` 이 보인다.
    - expect: 지표 `총 선물` 이 `1개`, 탭 `전체 1`·`마음 모으는 중 1` 이다.
    - expect: `등록된 선물이 없습니다.` 가 사라진다.
  4. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    - expect: 1행이고 `title` `E2E 텀블러`, `targetAmount` `45000`, `fundedAmount` `0`, `status` `open`, `description` `보온 되는 걸로`, `productUrl`·`imageUrl` 이 null 이다.

#### 3.2. Create Wish With Link Autofill

**File:** `tests/admin/create-wish-link-autofill.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin)`. `await page.route('**/api/admin/wishes/link-preview**', route => route.fulfill({ json: { preview: { title: "가짜 상품", imageUrl: "https://example.com/fake.png", price: 39000 } } }))` 를 건 뒤 `/admin/wishes` 로 이동해 `등록된 선물이 없습니다.` 를 기다립니다(timeout 30초).
  2. `상품 링크` 가 빈 채로 버튼 `정보 불러오기` 를 누릅니다.
    - expect: 토스트 `상품 링크를 먼저 입력해 주세요.`(`data-type` `error`)가 보인다.
    - expect: link-preview 요청이 나가지 않는다(route 핸들러 호출 횟수 0).
  3. `선물 이름` 에 `내가 정한 이름` 을 먼저 입력하고, `상품 링크` 에 `https://shop.example.com/item/1` 을 입력한 뒤 `정보 불러오기` 를 누릅니다.
    - expect: 요청 URL 의 `url` 쿼리가 `https://shop.example.com/item/1` 이다(탐색: `?url=https%3A%2F%2Fshop.example.com%2Fitem%2F1`).
    - expect: 토스트 `상품 정보를 채웠어요. 저장 전에 확인해 주세요.`(`data-type` `success`)가 보인다.
    - expect: `선물 이름` 은 `내가 정한 이름` 그대로이고(빈 칸만 채움), `목표 금액` 이 `39000`, `이미지 링크` 가 `https://example.com/fake.png` 로 채워진다.
  4. 버튼 `추가하기` 를 누릅니다.
    - expect: 토스트 `선물을 추가했어요.` 가 보이고 레벨 3 제목 `내가 정한 이름` 카드에 `₩0 / ₩39,000` 이 보인다.
  5. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    - expect: 1행이고 `title` `내가 정한 이름`, `targetAmount` `39000`, `productUrl` `https://shop.example.com/item/1`, `imageUrl` `https://example.com/fake.png` 이다.

#### 3.3. Edit Wish

**File:** `tests/admin/edit-wish.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "캠핑 의자", targetAmount: 80_000, status: "paused" }, { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ] })`, `await signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `캠핑 의자` 를 기다립니다(timeout 30초).
  2. `캠핑 의자` 카드의 summary 를 눌러 엽니다.
    - expect: 카드 `details` 가 열리고 `선물 이름` `캠핑 의자`, `상태` 값 `paused`, `목표 금액` `80000`, `메모` 빈 값이 보인다.
  3. `선물 이름` 을 `캠핑 의자 2인용`, `목표 금액` 을 `90000`, `메모` 를 `등받이 있는 걸로` 로 바꾸고(상태는 그대로) 버튼 `저장` 을 누릅니다.
    - expect: 토스트 `선물을 수정했어요.`(`data-type` `success`)가 보인다.
    - expect: URL 이 `/admin/wishes` 로 정리된다.
    - expect: 레벨 3 제목 `캠핑 의자 2인용` 카드 summary 에 배지 `잠시 멈춤` 과 `₩0 / ₩90,000` 이 보이고, 제목 `캠핑 의자`(exact) 카드는 없다.
    - expect: 다른 카드 `무선 이어폰` 은 `₩30,000 / ₩100,000` 그대로이다.
  4. [e2eDb 조회, 코드 근거] `wish_items`(`id = items[0].id`)를 조회합니다(`expect.poll`).
    - expect: `title` `캠핑 의자 2인용`, `targetAmount` `90000`, `description` `등받이 있는 걸로`, `status` `paused`, `fundedAmount` `0` 이다.
    - expect: `items[1]`(무선 이어폰)은 `title`·`targetAmount`·`fundedAmount` 가 그대로이다.

#### 3.4. Change Wish Status

**File:** `tests/admin/change-wish-status.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ] })`, `await signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `무선 이어폰` 을 기다립니다(timeout 30초).
    - expect: 카드 배지 `마음 모으는 중`, 탭 `마음 모으는 중 1`·`잠시 멈춤 0` 이다.
  2. 카드를 열고 `상태` 에서 `잠시 멈춤` 을 고른 뒤 `저장` 을 누릅니다.
    - expect: 토스트 `선물을 수정했어요.` 가 보이고 URL 이 `/admin/wishes` 로 정리된다.
    - expect: 카드 배지가 `잠시 멈춤` 이고 summary 금액은 `₩30,000 / ₩100,000` 그대로이다.
    - expect: 탭이 `마음 모으는 중 0`·`잠시 멈춤 1` 이다.
  3. [e2eDb 조회, 코드 근거] `wish_items`(`id = items[0].id`)를 조회합니다(`expect.poll`).
    - expect: `status` `paused`, `title` `무선 이어폰`, `targetAmount` `100000`, `fundedAmount` `30000`(상태 변경이 모인 금액을 바꾸지 않음)이다.

#### 3.5. Delete Wish

**File:** `tests/admin/delete-wish.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "보드게임", targetAmount: 40_000 }, { title: "무선 이어폰", targetAmount: 100_000 } ] })`, `await signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `보드게임` 을 기다립니다(timeout 30초).
    - expect: 지표 `총 선물` 이 `2개` 이다.
  2. `page.on('dialog', ...)` 로 확인 창이 뜨는지 기록하도록 걸어 두고, `보드게임` 카드를 열어 버튼 `삭제` 를 누릅니다.
    - expect: 토스트 `선물을 삭제했어요.`(`data-type` `success`)가 보인다.
    - expect: 확인 창(dialog)이 뜨지 않았다(현재 동작 기록, "탐색 중 발견한 사항" 참고).
    - expect: URL 이 `/admin/wishes` 로 정리되고, 레벨 3 제목 `보드게임` 이 없고 `무선 이어폰` 은 남는다.
    - expect: 지표 `총 선물` 이 `1개` 이다.
  3. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    - expect: 1행이고 그 `id` 가 `items[1].id`(무선 이어폰)이다. `items[0].id` 행은 없다.

#### 3.6. Filter Wishes By Status

**File:** `tests/admin/filter-wishes-by-status.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 }, { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 50_000 }, { title: "캠핑 의자", targetAmount: 80_000, status: "paused" }, { title: "보드게임", targetAmount: 40_000, status: "fulfilled" } ] })`, `await signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `무선 이어폰` 을 기다립니다(timeout 30초).
    - expect: 필터 탭 링크가 순서대로 `전체 4`, `마음 모으는 중 2`, `잠시 멈춤 1`, `완료 1`, `숨김 0` 이다.
    - expect: 카드 4개가 보이고 `필름 카메라` 카드 배지는 `완료` 이다(status open 이지만 금액 달성, 코드 근거).
  2. 탭 `마음 모으는 중` 을 누릅니다.
    - expect: URL 이 `/admin/wishes?status=open` 이다.
    - expect: 레벨 3 제목이 `무선 이어폰`, `필름 카메라` 2개뿐이다(필름 카메라는 배지가 `완료` 여도 DB status 가 open 이라 이 탭에 있음).
    - expect: 지표 `총 선물` 은 `4개` 그대로이다(전체 기준).
    - expect: `details#create-wish` 가 닫혀 있다.
  3. 탭 `완료` 를 누릅니다.
    - expect: URL 이 `/admin/wishes?status=fulfilled` 이고 레벨 3 제목이 `보드게임` 하나뿐이다(`필름 카메라` 없음).
  4. 탭 `숨김` 을 누릅니다.
    - expect: URL 이 `/admin/wishes?status=hidden` 이고 카드가 없으며 문구 `숨김 상태의 선물이 없습니다.` 와 링크 `전체 선물 보기`(href `/admin/wishes`)가 보인다.
  5. 링크 `전체 선물 보기` 를 누릅니다.
    - expect: URL 이 `/admin/wishes` 이고 카드 4개가 보인다.

### 4. Message Management

**Seed:** `tests/admin/seed.spec.ts`

#### 4.1. Hide And Restore Funded Message

**File:** `tests/admin/hide-and-restore-message.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 40_000 } ], messages: [ { senderName: "이친구", body: "이어폰에 보태요", wishItemIndex: 0, amount: 10_000 }, { senderName: "김친구", body: "생일 축하해!" } ] })`, `await signIn(admin)`. `/admin/messages` 로 이동해 `navigation "메시지 필터"` 를 기다립니다(timeout 30초).
    - expect: 지표 값 `2개`, 행(`article`) 2개가 최신순으로 `이어폰에 보태요`, `생일 축하해!` 이다.
    - expect: `이어폰에 보태요` 행에 `무선 이어폰`, `이친구`, `₩10,000`, 버튼 `숨기기` 가 있고 `생일 축하해!` 행에는 `선물 없음`, `금액 없음` 이 있다.
  2. `page.once('dialog', ...)` 로 메시지를 기록하고 `accept()` 하도록 건 뒤 `이어폰에 보태요` 행의 `숨기기` 를 누릅니다.
    - expect: 확인 창 메시지가 `이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요.` 이다.
    - expect: 토스트 `참여 기록을 숨겼어요.`(`data-type` `success`)가 보이고 URL 이 `/admin/messages` 로 정리된다.
    - expect: 행이 `생일 축하해!` 하나만 남고 지표 값이 `1개` 이다.
  3. [e2eDb 조회, 코드 근거] 숨김 결과를 조회합니다(`expect.poll`).
    - expect: `messages`(`id = messages[0].id`)의 `isHidden` 이 `true` 이다.
    - expect: `wish_items`(`id = items[0].id`)의 `fundedAmount` 가 `30000` 이다(40,000 − 10,000).
    - expect: `funding_logs`(`messageId = messages[0].id`)가 1행이고 `amount` 가 `10000` 그대로이다(로그는 지우지 않음).
  4. 메시지 필터의 `숨긴 메시지` 탭을 누릅니다.
    - expect: URL 이 `/admin/messages?filter=hidden` 이고 행이 `이어폰에 보태요` 하나이며 `₩10,000` 과 버튼 `숨김 해제` 가 있다(버튼 `숨기기` 없음). 지표 값 `1개`.
  5. `숨김 해제` 를 누릅니다(확인 창 없음).
    - expect: 토스트 `참여 기록을 복구했어요.`(`data-type` `success`)가 보인다.
    - expect: URL 이 `/admin/messages` 로 정리되어(받은 메시지함으로 돌아옴) 행 2개 `이어폰에 보태요`, `생일 축하해!` 가 보인다.
  6. [e2eDb 조회, 코드 근거] 복구 결과를 조회합니다(`expect.poll`).
    - expect: `messages[0]` 의 `isHidden` 이 `false`, `wish_items.fundedAmount` 가 `40000` 이다.

#### 4.2. Cancel Hide Message

**File:** `tests/admin/cancel-hide-message.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ messages: [ { senderName: "김친구", body: "생일 축하해!" } ] })`, `await signIn(admin)`. `/admin/messages` 로 이동해 행 `생일 축하해!` 를 기다립니다(timeout 30초).
  2. `page.once('dialog', ...)` 로 메시지를 기록하고 `dismiss()` 하도록 건 뒤 행의 `숨기기` 를 누릅니다.
    - expect: 확인 창 메시지가 `이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.` 이다(금액 없는 메시지 문구, 코드 근거).
    - expect: 토스트가 나타나지 않고(`[data-sonner-toast]` count 0), URL 이 `/admin/messages` 그대로이며, 행 `생일 축하해!` 가 남는다.
  3. [e2eDb 조회, 코드 근거] `messages`(`id = messages[0].id`)를 조회합니다.
    - expect: `isHidden` 이 `false` 이다.
  4. `숨긴 메시지` 탭을 누릅니다.
    - expect: 행이 없고 문구 `숨긴 메시지가 없습니다.` 가 보이며 지표 값이 `0개` 이다.

#### 4.3. Message Filters

**File:** `tests/admin/message-filters.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], messages: [ { senderName: "김친구", body: "생일 축하해!" }, { senderName: null, body: "익명으로 보태요", wishItemIndex: 0, amount: 30_000 }, { senderName: "박친구", body: "숨긴 메시지", isHidden: true } ] })`, `await signIn(admin)`. `/admin/messages` 로 이동해 `navigation "메시지 필터"` 를 기다립니다(timeout 30초).
    - expect: 탭 `받은 메시지` 가 활성(링크 href `/admin/messages`)이고, 지표 값 `2개`, 행이 `생일 축하해!`, `익명으로 보태요` 이다.
    - expect: `익명으로 보태요` 행의 보낸 사람이 `익명`, 금액이 `₩30,000` 이다.
    - expect: `숨긴 메시지` 본문 행이 없다.
  2. 탭 `숨긴 메시지` 를 누릅니다.
    - expect: URL 이 `/admin/messages?filter=hidden` 이고 지표 값 `1개`, 행이 본문 `숨긴 메시지`(박친구) 하나이며 버튼 `숨김 해제` 가 있다.
    - expect: `생일 축하해!`, `익명으로 보태요` 행이 없다.
  3. 탭 `받은 메시지` 를 누릅니다.
    - expect: URL 이 `/admin/messages` 이고 행 2개가 다시 보인다.

#### 4.4. Unread Message Badge

**File:** `tests/admin/unread-message-badge.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ messages: [ { senderName: "김친구", body: "생일 축하해!" }, { senderName: "이친구", body: "축하해요" }, { senderName: "박친구", body: "숨긴 메시지", isHidden: true } ] })`, `await signIn(admin)`. `/admin/wishes` 로 이동해 사이드바를 기다립니다(timeout 30초).
    - expect: 사이드바 배지 `새 메시지 2개`(텍스트 `2`)가 보인다(숨긴 메시지는 세지 않음).
  2. `/admin/messages?filter=hidden` 으로 이동해 행 `숨긴 메시지` 를 기다립니다.
    - expect: 배지 `새 메시지 2개` 가 그대로 보인다(숨긴 메시지함은 읽음 처리하지 않음).
  3. [e2eDb 조회, 코드 근거] `wishlists`(`id = admin.wishlistId`)의 `messagesReadAt` 을 조회합니다.
    - expect: `null` 이다.
  4. 사이드바의 `메시지함` 링크를 눌러 받은 메시지함으로 갑니다.
    - expect: URL 이 `/admin/messages` 이고 행 `생일 축하해!` 가 보인다.
    - expect: 배지가 사라진다(`getByLabel(/^새 메시지/)` count 0).
  5. [e2eDb 조회, 코드 근거] `messagesReadAt` 을 `expect.poll` 로 조회합니다(`after()` 로 응답 뒤 기록됨).
    - expect: null 이 아니게 된다.
  6. `/admin/wishes` 로 이동합니다.
    - expect: 배지가 없다(서버 집계도 0, 탐색에서 `/admin` 으로 이동해 확인).
  7. [e2eDb 변경] 새 메시지를 넣습니다: `e2eDb.insert(messages).values({ wishlistId: admin.wishlistId, senderName: "최친구", body: "늦었지만 축하해", createdAt: new Date() })`. 그 뒤 페이지를 새로고침합니다.
    - expect: 배지 `새 메시지 1개` 가 보인다.

### 5. Cross Account Access

**Seed:** `tests/admin/seed.spec.ts`

#### 5.1. Cross Account Wish Rejected

**File:** `tests/admin/cross-account-wish-rejected.spec.ts`

**Steps:**
  1. [사전 조건] 주인 B: `const owner = await seedAdmin({ displayName: "E2E 주인", items: [ { title: "캠핑 의자", targetAmount: 80_000, fundedAmount: 20_000 } ] })`. 요청자 A: `const other = await seedAdmin({ displayName: "E2E 다른 사람" })`, `await signIn(other)`(A 만 로그인). `/admin/wishes` 로 이동해 문구 `등록된 선물이 없습니다.` 를 기다립니다(timeout 30초).
    - expect: A 의 화면에 레벨 3 제목 `캠핑 의자` 가 없다(남의 선물이 보이지 않음).
  2. B 의 선물 id 로 form 수정: `page.request.post(\`/api/admin/wishes/${owner.items[0].id}\`, { form: { _method: "patch", title: "바뀐 이름", targetAmount: "1", status: "hidden" }, maxRedirects: 0 })`.
    - expect: 상태 `307`, `location` pathname `/admin/wishes`, search `?error=wish_not_found` 이다.
  3. form 삭제: `{ form: { _method: "delete" }, maxRedirects: 0 }`.
    - expect: 상태 `307`, `location` 이 `/admin/wishes?error=wish_not_found` 이다.
  4. JSON 수정·삭제: `page.request.patch(\`/api/admin/wishes/${owner.items[0].id}\`, { data: { title: "바뀐 이름", targetAmount: 1, status: "hidden" } })`, `page.request.delete(...)`.
    - expect: 둘 다 상태 `404`, 본문 `{ error: "wish_not_found" }` 이다.
  5. [e2eDb 조회, 코드 근거] B 의 선물과 A 의 위시리스트를 조회합니다.
    - expect: `wish_items`(`id = owner.items[0].id`)가 남아 있고 `title` `캠핑 의자`, `targetAmount` `80000`, `fundedAmount` `20000`, `status` `open` 그대로이다.
    - expect: `wish_items`(`wishlistId = other.wishlistId`)가 0행이다.

#### 5.2. Cross Account Message Rejected

**File:** `tests/admin/cross-account-message-rejected.spec.ts`

**Steps:**
  1. [사전 조건] 주인 B: `const owner = await seedAdmin({ displayName: "E2E 주인", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 40_000 } ], messages: [ { senderName: "이친구", body: "이어폰에 보태요", wishItemIndex: 0, amount: 10_000 }, { senderName: "박친구", body: "숨긴 메시지", isHidden: true } ] })`. 요청자 A: `const other = await seedAdmin({ displayName: "E2E 다른 사람" })`, `await signIn(other)`. `/admin/messages` 로 이동해 문구 `아직 메시지가 없습니다.` 를 기다립니다(timeout 30초).
    - expect: A 의 메시지함에 `이어폰에 보태요` 가 없다.
  2. B 의 받은 메시지 숨기기: `page.request.post(\`/api/admin/messages/${owner.messages[0].id}\`, { form: { intent: "hide" }, maxRedirects: 0 })`.
    - expect: 상태 `307`, `location` 이 `/admin/messages?error=1` 이다.
  3. B 의 숨긴 메시지 해제: `page.request.post(\`/api/admin/messages/${owner.messages[1].id}\`, { form: { intent: "unhide" }, maxRedirects: 0 })`.
    - expect: 상태 `307`, `location` 이 `/admin/messages?error=1` 이다.
  4. [e2eDb 조회, 코드 근거] B 의 데이터를 조회합니다.
    - expect: `owner.messages[0]` 의 `isHidden` 이 `false`, `owner.messages[1]` 의 `isHidden` 이 `true` 그대로이다.
    - expect: `wish_items`(`id = owner.items[0].id`)의 `fundedAmount` 가 `40000` 그대로이다.
    - expect: `wishlists`(`id = owner.wishlistId`)의 `messagesReadAt` 이 null 그대로이다(A 의 메시지함 방문이 B 의 읽음 기준을 바꾸지 않음).
