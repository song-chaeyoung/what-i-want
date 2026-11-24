# Admin Management (/admin) E2E Test Plan — 2차

## 대상 및 범위

"뭐갖고싶어" 관리자 화면 `/admin` 중 2차분(홈 요약, 공개 링크 공유, 설정, 위시리스트 초기화, 로그아웃, 첫 진입 안내 모달)을 검증하는 E2E 테스트 계획입니다. 1차(`specs/admin-management.md`: 로그인 경계, 온보딩, 선물, 메시지함, 권한)와 같은 형식입니다.

- 소스: `app/admin/page.tsx`, `app/admin/share-public-link-button.tsx`, `components/use-wishlist-share.ts`, `src/lib/share/share-url.ts`, `app/admin/settings/page.tsx`·`account-visibility-field.tsx`·`reset-wishlist-form.tsx`, `app/api/admin/settings/route.ts`, `src/lib/settings/service.ts`, `app/api/admin/wishlist/reset/route.ts`, `src/lib/wishlist-reset/repository.ts`, `app/login/actions.ts`(signOutAction), `app/admin/admin-guide-dialog.tsx`·`admin-guide-storage.ts`·`admin-guide-state.ts`, `app/admin/admin-toast-events.tsx`(토스트 문구), 공개 페이지 `components/public-wishlist-view.tsx`·`public-account-section.tsx`·`public-bank-account-card.tsx`.
- 동작 방식: 설정 저장은 `<form action="/api/admin/settings" method="post">` 가 서버에서 저장한 뒤 `/admin/settings?saved=1` 또는 `?error=<코드>` 로 리다이렉트합니다. 클라이언트 `AdminToastEvents` 가 토스트를 띄우고 `router.replace` 로 쿼리를 지웁니다. 위시리스트 초기화는 `window.confirm` 뒤 `/api/admin/wishlist/reset` 로 POST 되고 `?wishlistReset=1` 로 돌아옵니다. 로그아웃은 서버 액션 `signOutAction`(`signOut({ redirectTo: "/login" })`)입니다. 서버가 DB 를 직접 쓰므로 `page.route()` 로 가로챌 수 없고, 결과는 서버가 렌더한 화면과 fixture `e2eDb` 조회로 확인합니다. 공유하기는 브라우저 API(`navigator.share`, `navigator.clipboard`)만 쓰므로 init script 로 스텁합니다.
- baseURL `http://localhost:3200`(chromium 데스크톱 1280x720). 탐색용 seed 는 `tests/admin/seed-settings.spec.ts`(선물 5개: 무선 이어폰 open 30,000/100,000 · 캠핑 의자 paused · 보드게임 fulfilled · 숨긴 선물 hidden · 필름 카메라 open 5,000/50,000, 메시지 3개: 김친구 `생일 축하해!` · 이친구 `이어폰에 보태요`(무선 이어폰 30,000) · 박친구 `숨긴 메시지`(숨김), 계좌 E2E은행/E2E 관리자/123-456-789012 copy_only, 안내 모달 꺼짐)와 `tests/admin/seed-guide.spec.ts`(선물·메시지·계좌 없는 관리자, 안내 모달 켜짐)입니다. **각 테스트는 seed 를 재사용하지 않고 자기 `seedAdmin({...})` 로 새 사용자를 만듭니다.** 모든 테스트는 `tests/admin/` 아래에 두고 `import { test, expect } from "../fixtures/admin"` 을 씁니다.
- 범위 밖: 14세 미만 계정 삭제, 모바일 nav, 선물 입력값 서버 검증 오류, 실제 OAuth, 계좌 입력값 서버 검증 오류(`bank_name_required`·`invalid_account_number` 등), 생일 당일 관리자 홈 축하 카드(`birthday-confetti.tsx`, 서버가 `new Date()` 로 정해 `page.clock` 으로 고정 불가 — 탐색 결과만 아래에 기록), 설정의 14세 미만 생일 거절·이름/제목 서버 검증.
- 탐색은 2026-11-14 dev 서버(3200, 로컬 E2E DB)에서 Playwright MCP 로 planner 서브에이전트가 했습니다. 탐색 중에는 DB 를 볼 수 없었으므로 **DB 단언(e2eDb)은 코드 근거**이며 각 단계에 `[e2eDb 조회, 코드 근거]` 로 표시했습니다.
- 2026-11-20 에 main(d69dc67, PR #32~#36: badge·input·card variant, Pretendard, 홈 진행 막대, 디자인 문서) 위로 옮기며 다시 대조했습니다. 관리자 화면 변경은 클래스·컴포넌트 교체(`Input`·`Textarea`·`Badge`)뿐이라 이 계획의 문구·역할·id 는 그대로입니다. 공개 페이지 `main` 클래스는 `pub-page` 에서 `theme-page` 로 바뀌었지만 `data-theme` 속성은 그대로이고, 이 계획은 클래스를 쓰지 않습니다.
- main 의 `tests/admin/guide-dialog.spec.ts` 가 `?guide=1` 과 사이드바 `사용 가이드` 로 안내 모달이 **열리는** 경우를 다룹니다. 6.3 은 그 테스트와 겹치지 않게 닫기 동작(Escape·`관리 화면 먼저 둘러보기`)과 쿼리 정리, 다시 열 때 단계 초기화만 다룹니다.
- 로그아웃 리다이렉트: `playwright.config.ts` 의 `webServer.env` 에 `AUTH_URL: baseURL` 을 넣어(2026-11-20 사용자 결정) Auth.js 리다이렉트가 3200 으로 갑니다. 5.1 은 `http://localhost:3200/login` 도착을 그대로 단언합니다.

## 탐색으로 확인한 실제 렌더링 데이터

- 관리자 홈 `/admin`(seed-settings): 지표 `선물` `5개`(보조 `등록된 선물`), `메시지` `2개`(보조 `도착한 마음`), `모인 금액` `₩35,000`(보조 `전체 선물 기준`). `내 공개 주소` 문구 `/wishlist/<slug>`, 버튼 `공유하기`, 링크 `열어 보기`(href `/wishlist/<slug>`). `최근 선물`(링크 `전체 보기` → `/admin/wishes`) 4행: 무선 이어폰/마음 모으는 중/`₩30,000 / ₩100,000`, 캠핑 의자/잠시 멈춤/`₩0 / ₩80,000`, 보드게임/완료/`₩0 / ₩40,000`, 숨긴 선물/숨김/`₩0 / ₩10,000`(필름 카메라는 5번째라 없음). `최근 메시지`(링크 `메시지함` → `/admin/messages`) 2행: 김친구 `선물 없음 · 금액 없음`, 이친구 `무선 이어폰 · ₩30,000`(박친구 숨김은 없음). 선물 행 날짜는 `2026. 11. 15.`, 메시지 행 날짜는 `2026. 11. 14.` 로 읽혔습니다(탐색 당시 `defaultNow()` 값이 로컬 DB 시간대로 9시간 앞섬. 2026-11-21 부터 UTC).
- 빈 관리자 홈(seed-guide 에서 모달을 닫은 뒤): 지표 `0개`/`0개`/`₩0`, `등록된 선물이 없습니다.` + `첫 선물을 추가하면 운영 목록과 공개 페이지에 바로 반영됩니다.` + 링크 `선물 추가`(href `/admin/wishes`), `아직 메시지가 없습니다.` + `공개 페이지에서 마음이 도착하면 이곳에서 빠르게 확인합니다.` + 링크 `공개 페이지 보기`(href `/wishlist/<slug>`; 헤더에도 같은 이름 링크가 있어 총 2개).
- 공유하기: 복사 폴백에서 버튼 라벨 `공유하기` → `복사 완료`(약 2초 뒤 복귀), 토스트 `위시리스트 링크를 복사했어요.`(success), 클립보드 `http://localhost:3200/wishlist/<slug>?utm_source=owner_share&utm_medium=share`. 네이티브 공유 스텁에서는 `navigator.share({ title: "뭐갖고싶어 생일 위시리스트", url })` 한 번 호출, 클립보드 쓰기 0, 토스트 0, 라벨 그대로.
- 설정 `/admin/settings` 레벨 3 제목 순서: `프로필`, `공개 페이지`, `계좌 안내`, `새 생일 준비`, `계정`, `회원 탈퇴`. 입력 id: `displayName`, `birthday`(type date, `max` 는 실행일 기준 14년 전이라 단언하지 않음), `description`, `wishlistSlug`(`minLength` 3, `maxLength` 32), `wishlistTitle`, `wishlistVisibility`(`public`=공개, `private`=비공개), `themeId`(`pixel_y2k`=픽셀 Y2K, `mono_bw`=모노 흑백, `soft_pastel`=소프트 파스텔), `bankName`, `accountHolder`, `accountNumber`(계좌가 있으면 placeholder `변경할 때만 입력`, 없으면 `3333-12-1234567`), `accountVisibility`(옵션 `copy_only`=공개 페이지에 보이기, `hidden`=숨기기). 계좌가 없으면 `accountVisibility` 가 disabled 입니다. 힌트: copy_only `공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.`, hidden `공개 페이지에 계좌가 보이지 않아요.`(선택만 바꿔도 즉시 바뀌는 클라이언트 상태). 저장은 버튼 `저장하기`, 초기화는 버튼 `위시리스트 초기화`, 로그아웃은 버튼 `로그아웃`, 탈퇴는 `계정` 다음 섹션의 버튼 `회원 탈퇴`.
- 공개 페이지 `/wishlist/<slug>`: 레벨 1 제목 = 위시리스트 제목, 소개 문단, 생일 배지 `3월 15일 · D-121`(생일이 있을 때만, D-일수는 날짜에 따라 변하고 당일은 `D-DAY`), `main[data-theme]`, 지표 `선물`·`모인 마음`. 숨김 선물은 보이지 않습니다(`선물 4개`). `계좌 안내` 는 `details`(요약 `gift account`·`계좌 안내`·`마음은 이 계좌로 전할 수 있어요.`, 기본 닫힘)이고 copy_only 이면 안에 `예금주`+예금주 이름과 버튼 `계좌번호 복사` 만 있고 은행명·번호는 화면에 없습니다(`showAccountNumber = visibility !== "copy_only"`). 없는 주소·비공개는 `404` + `위시리스트를 찾을 수 없어요` + `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.`. 선물이 0개이면 `아직 공개된 선물이 없어요`.
- 안내 모달: dialog 이름 `이제 위시리스트를 만들어볼까요?`(제목은 레벨 2, 단계 제목도 레벨 2라 `.last()` 필요). 단계 1 `01 / 03` `갖고 싶은 선물을 담아요`, 2 `02 / 03` `친구에게 보일 페이지를 확인해요`, 3 `03 / 03` `링크를 보내고 마음을 기다려요`. 버튼: 1단계 `관리 화면 먼저 둘러보기`·`다음`(초기 포커스 `다음`), 2단계 `이전`·`다음`, 3단계 `이전`·`첫 선물 담기`(`다음` 없음), 공통 `안내 닫기`(아이콘, aria-label). localStorage `mwagotgo:admin-guide-seen` 은 닫을 때(`안내 닫기`, `관리 화면 먼저 둘러보기`, Escape, `첫 선물 담기`)만 `"1"` 로 기록되고 단계만 넘길 때는 `null` 입니다.

## 테스트 생성기(generator)를 위한 공통 주의사항

1. **fixture**: `import { test, expect } from "../fixtures/admin"`. `seedAdmin({ onboarded?, displayName?, items?, messages?, bankAccount? })` 는 호출마다 새 사용자(`admin-<12자>@e2e.test`)와 세션, 위시리스트(slug `e2e-<12자>`, 제목 `${displayName}님의 위시리스트`, public)를 만들고 `{ userId, email, sessionToken, wishlistId, slug, items, messages }` 를 돌려줍니다. `bankAccount` 는 `{ bankName, accountHolder, accountNumber, visibility }` 이고 E2E 키로 암호화해 `bank_accounts` 에 넣습니다. `signIn(admin)` 은 세션 쿠키를 넣고 안내 모달을 끄는 localStorage init script 를 넣습니다. `signIn(admin, { showAdminGuide: true })` 는 init script 를 넣지 않아 모달이 켜집니다. 종료 시 fixture 가 사용자를 지워 cascade 로 정리합니다.
2. **첫 이동 대기**: `/admin` 레이아웃은 Suspense 스켈레톤을 먼저 보낼 수 있으니 셸 대신 실제 내용(`내 공개 주소`, `#displayName`, `저장하기` 버튼 등)을 기다리고 첫 대기는 timeout 30초를 쓰세요(dev 서버 첫 컴파일이 느림). 공개 페이지도 스트리밍이라 레벨 1 제목을 기다립니다.
3. **토스트**: `page.locator('[data-sonner-toast]').filter({ hasText: '...' })`, `data-type` 은 `success`/`warning`/`error`. 제출 후 약 1초 안에 나타나고 4~6초 뒤 사라지므로 제출 직후 확인하세요. 설정 문구: 저장 `설정을 저장했어요.`, 초기화 `위시리스트를 초기화했어요. 새 생일을 준비해 보세요.`, 일반 오류 `요청을 처리하지 못했어요.`, `reserved_slug` 는 `sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.`, `invalid_slug` 는 `공개 주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.`, `duplicate_slug` 는 `이미 사용 중인 공개 주소입니다.`. 토스트가 뜬 뒤 쿼리는 지워지므로 `toHaveURL(/\/admin\/settings$/)` 로 정리된 URL 을 기다리세요. 같은 문구의 토스트가 남아 있으면 다음 단언과 섞이므로 연속 저장 사이에는 `[data-sonner-toast]` count 0 을 기다리거나(timeout 10초) 문구가 다른 단언을 쓰세요.
4. **설정 폼 입력**: `page.locator('#displayName')` 처럼 id 로 잡거나 `getByLabel('이름')` 을 씁니다(`이름`·`생일`·`소개`·`공개 주소`·`제목`·`공개 여부`·`테마`·`은행`·`예금주`·`계좌번호`·`계좌 공개`; 필수 라벨에는 `*` 가 붙음). 날짜는 `fill('1990-03-15')`, select 는 `selectOption('soft_pastel')`. 저장은 `getByRole('button', { name: '저장하기' })`. 브라우저 `required`·`minLength`·`maxLength`·`pattern`·`max` 가 먼저 제출을 막을 수 있으니 이 시나리오의 값은 모두 통과하는 값입니다.
5. **저장 결과는 서버 렌더 값으로**: 저장 뒤 입력값은 리다이렉트로 서버가 다시 렌더한 값이라 `toHaveValue` 단언에 의미가 있습니다. 반대로 `계좌 공개` 힌트 문구는 select 를 바꾸는 즉시 바뀌는 클라이언트 상태이므로 서버 동작의 근거로 삼지 말고 저장 뒤 다시 렌더된 값과 DB 로 확인하세요.
6. **확인 창(`window.confirm`)**: 테스트 코드에서는 클릭 **전에** `page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.accept(); })`(또는 `dismiss()`)를 겁니다. 이 규칙은 생성된 테스트 코드용이며, MCP 탐색 중에는 `browser_run_code_unsafe` 안에서 확인 창을 띄우지 말고 `browser_click` 으로 클릭한 뒤 `browser_handle_dialog` 로 처리하세요.
7. **공유 스텁**: `tests/sample/share-link-copy.spec.ts`(`navigator.share` 를 `undefined` 로 → 클립보드 폴백, `test.use({ permissions: ['clipboard-read', 'clipboard-write'] })`), `tests/sample/native-share-paths.spec.ts` 방식을 따릅니다. 관리자 홈의 버튼은 `main` 안에 `공유하기` 하나입니다(공개 페이지에는 헤더에도 같은 이름 버튼이 있음).
8. **DB 조회(e2eDb)**: `import { eq } from "drizzle-orm"`, `import { bankAccounts, fundingLogs, messages, profiles, sessions, wishItems, wishlists } from "@/src/lib/db/schema"`. 컬럼은 camelCase(`displayName`, `birthday`(문자열 `YYYY-MM-DD`), `description`, `slug`, `title`, `themeId`, `visibility`, `messagesReadAt`, `bankName`, `accountHolder`, `accountNumberEncrypted`, `sessionToken`). 값이 생기는 확인은 `expect.poll(...)` 로 기다리고, 계좌번호는 `decryptAccountNumber` 와 `E2E_ACCOUNT_ENCRYPTION_SECRET`(`tests/support/e2e-db.ts`)으로 복호화해 비교합니다.
9. **시각**: E2E DB 세션 시간대는 2026-11-21 부터 UTC 입니다(1차 명세 공통 주의사항 10). 탐색 당시에는 Asia/Seoul 이라 `defaultNow()` 값이 9시간 앞서 읽혔습니다. 실행 시각에 따라 날짜가 바뀌므로 홈의 날짜 문자열은 단언하지 마세요. 공개 페이지 생일 배지의 `D-<일수>` 도 실행 날짜에 따라 변하고 생일 당일은 `D-DAY` 이므로 `/^3월 15일 · D-(DAY|\d+)$/` 처럼 정규식으로 쓰세요.
10. **금액 기호**: `formatCurrency` 결과(`₩35,000`)의 기호는 U+20A9 입니다. 복사해서 쓰거나 `/35,000/` 정규식을 쓰세요.
11. **안내 모달 신호**: 모달은 hydration 직후 localStorage 를 읽어 열리므로 로드 직후 `dialog` 0개 단언은 항상 참입니다. 6.1 의 근거(저장 폼 POST 후 토스트·URL 정리가 끝난 시점)와 대조 단계를 따르세요.

## 탐색 중 발견한 사항

- **[관찰 → 설정으로 해결] 탐색 당시 로그아웃이 `http://localhost:3000/login` 으로 이동했습니다.** `.env.local`(과 `.env.example`)의 `AUTH_URL="http://localhost:3000"` 이 `signOut({ redirectTo: "/login" })` 의 상대 경로를 3000 기준으로 풀었기 때문입니다(그때는 3000 에 사용자 dev 서버가 떠 있어 로그인 화면이 보였음). 2026-11-20 사용자 결정으로 `playwright.config.ts` 의 `webServer.env` 에 `AUTH_URL: baseURL` 을 넣었고, 임시 테스트로 로그아웃 뒤 URL 이 `http://localhost:3200/login` 임을 확인했습니다. 운영·개발 환경은 각자의 `AUTH_URL` 을 따릅니다.
- **[수정됨, 2026-11-21] 중복 slug·형식이 잘못된 slug 에 전용 토스트가 없었습니다.** 탐색 당시 `reserved_slug`(`sample`)만 전용 문구가 나오고 `invalid_slug`(`Bad_Slug!`)·`duplicate_slug` 는 `요청을 처리하지 못했어요.` 였습니다. `app/admin/admin-toast-events.tsx` 의 `adminErrorMessages` 에 `reserved_slug`·`invalid_account_number` 만 있었고, 설정 페이지 `errorMessages` 의 문구는 설정 조회 실패(`AdminToastMessage`) 경로에서만 쓰였기 때문입니다. 사용자 결정으로 두 문구와 선물 저장 오류 문구를 `ADMIN_COPY` 로 옮겨 `adminErrorMessages` 에서도 쓰게 했고, 시나리오 3.3 은 전용 문구를 확인합니다.
- **[관찰] 저장 실패 후에도 입력값은 DB 값으로 돌아옵니다.** 거절된 slug 를 입력해도 리다이렉트로 다시 렌더된 `공개 주소` 는 기존 slug 입니다(입력이 사라짐).
- **[관찰] slug 는 서버에서 `trim` 과 소문자 정규화를 합니다.** `  E2E-New-Slug  ` → `e2e-new-slug`, 옛 주소는 즉시 not-found, 헤더 `공개 페이지 보기` href 갱신.
- **[관찰] 비공개 위시리스트는 소유자 본인이 로그인한 상태에서도 공개 주소가 not-found 입니다.** 관리자 홈에는 `내 공개 주소` 아래 `비공개라 친구가 열 수 없어요.` 가 표시됩니다.
- **[관찰] 계좌를 숨긴 뒤에도 계좌번호 칸은 비어 있고 저장해도 번호가 유지됩니다.** `accountNumber` 를 비운 채 저장하면 `visibility` 만 바뀌고 `은행`·`예금주` 는 그대로, placeholder `변경할 때만 입력`. 초기화(`새 생일 준비`)도 계좌를 건드리지 않습니다(hidden 상태도 유지됨).
- **[관찰] 계좌를 처음 등록할 때는 `missingAccount` 경고 토스트가 나오지 않습니다**(그 토스트는 선물 추가 후에만 나옴). 토스트는 `설정을 저장했어요.` 하나입니다.
- **[관찰] 안내 모달은 `/admin/settings` 에서도 첫 방문이면 열립니다.** 레이아웃에 있어 모든 관리자 화면에 해당합니다. Escape·`안내 닫기`·`관리 화면 먼저 둘러보기` 는 모두 `completeGuide("dismiss")` 라 localStorage `"1"` 을 기록하고 `?guide=1` 이 있으면 지웁니다. 사이드바 `사용 가이드` 는 현재 경로에 `?guide=1` 을 붙입니다.
- **[관찰] 선물이 없으면 `첫 선물 담기` 의 `#create-wish` 패널은 원래 열려 있습니다.** 그래서 패널 `open` 은 해시 이동의 단독 증거가 아닙니다(6.2 는 URL 로 확인).
- **[해결] 관리자 홈 `선물` 지표는 숨김 선물을 포함합니다**(5개). 탐색 당시 보조 문구 `등록된 공개 항목` 과 맞지 않아, 2026-11-21 사용자 결정으로 개수는 그대로 두고 보조 문구를 `등록된 선물` 로 바꿨습니다(`/admin/wishes` 의 `총 선물` 과 같은 기준). `메시지` 지표는 숨긴 메시지를 제외합니다.
- **[관찰] 생일 당일 홈 축하 카드(범위 밖).** 생일을 오늘(`2000-11-14`)로 저장하면 홈 지표 위에 `생일 축하해요, 새 이름님! 🎉` 카드가 나오고 공개 페이지 배지는 `11월 14일 · D-DAY` 였습니다. 서버가 `new Date()` 로 결정해 시계 고정이 안 되어 시나리오에 넣지 않았습니다.
- **[도구] 탐색 중 `browser_run_code_unsafe` 안에서 `window.confirm` 을 띄우지 않았고, 모든 대기에 timeout 을 줬습니다.** 초기화는 `browser_click` + `browser_handle_dialog` 로 처리했습니다.
- **[해결 / 환경] 로컬 E2E DB 시간대(Asia/Seoul)** 때문에 홈의 선물 날짜가 하루 앞서 읽혔습니다. 2026-11-21 부터 E2E 접속의 세션 시간대를 UTC 로 고정했습니다(1차 명세 참고).

## 시나리오 목록 요약

1. Dashboard Summary And Recent Lists
2. Dashboard Empty State
3. Share Link Copy
4. Native Share
5. Save Profile And Public Page Settings
6. Change Public Slug
7. Slug Validation Errors
8. Toggle Wishlist Visibility
9. Register Bank Account
10. Hide Bank Account
11. Cancel Reset Wishlist
12. Reset Wishlist
13. Sign Out
14. First Visit Guide
15. Guide First Gift Action
16. Dismiss Guide Removes Query

(아래 "Test Scenarios" 는 묶음 번호 `N.M` 을 씁니다. 1.x 관리자 홈, 2.x 공개 링크 공유, 3.x 설정, 4.x 위시리스트 초기화, 5.x 로그아웃, 6.x 안내 모달입니다.)

## Test Scenarios

### 1. Admin Dashboard

**Seed:** `tests/admin/seed-settings.spec.ts`

#### 1.1. Dashboard Summary And Recent Lists

**File:** `tests/admin/dashboard-summary.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 }, { title: "캠핑 의자", targetAmount: 80_000, status: "paused" }, { title: "보드게임", targetAmount: 40_000, status: "fulfilled" }, { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" }, { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 5_000 } ], messages: [ { senderName: "김친구", body: "생일 축하해!" }, { senderName: "이친구", body: "이어폰에 보태요", wishItemIndex: 0, amount: 30_000 }, { senderName: "박친구", body: "숨긴 메시지", isHidden: true } ] })`, `await signIn(admin)`. `/admin` 으로 이동해 문구 `내 공개 주소` 가 보일 때까지 기다립니다(timeout 30초).
    - expect: `main` 헤더의 링크 `공개 페이지 보기` 의 href 가 `/wishlist/${admin.slug}` 이다.
  2. 지표 카드 3개를 확인합니다.
    - expect: `선물` 값 `5개`, 보조 문구 `등록된 선물`. 숨긴 선물(hidden)도 개수에 포함된다(탐색: 5개, 공개 페이지는 4개).
    - expect: `메시지` 값 `2개`, 보조 문구 `도착한 마음`. 숨긴 메시지(박친구)는 포함되지 않는다(탐색: 3개 중 2개).
    - expect: `모인 금액` 값 `₩35,000`(무선 이어폰 30,000 + 필름 카메라 5,000), 보조 문구 `전체 선물 기준`(금액 기호 U+20A9, `/35,000/` 정규식 가능).
  3. `내 공개 주소` 영역을 확인합니다.
    - expect: 문구 `/wishlist/${admin.slug}` 가 보인다.
    - expect: 링크 `열어 보기` 의 href 가 `/wishlist/${admin.slug}` 이다(상대 경로).
    - expect: 버튼 `공유하기` 가 보인다.
  4. `최근 선물` 패널을 확인합니다.
    - expect: 레벨 3 제목 `최근 선물` 과 링크 `전체 보기`(href `/admin/wishes`)가 있다.
    - expect: 행이 4개뿐이며 순서는 `무선 이어폰`(배지 `마음 모으는 중`, `₩30,000 / ₩100,000`), `캠핑 의자`(`잠시 멈춤`, `₩0 / ₩80,000`), `보드게임`(`완료`, `₩0 / ₩40,000`), `숨긴 선물`(`숨김`, `₩0 / ₩10,000`) 이다(sortOrder 순, 탐색 확인).
    - expect: 5번째 선물 `필름 카메라` 는 이 패널에 없다(최대 4개).
    - expect: 각 행의 날짜 문자열은 단언하지 않는다(실행 시각에 따라 바뀜. 탐색 당시 선물은 `defaultNow()` 라 로컬 DB 시간대 때문에 `2026. 11. 15.` 로 하루 앞서 읽힘).
  5. `최근 메시지` 패널을 확인합니다.
    - expect: 레벨 3 제목 `최근 메시지` 와 링크 `메시지함`(href `/admin/messages`; 사이드바에도 같은 이름 링크가 있어 `main` 안으로 좁힘)이 있다.
    - expect: 행이 2개이며 순서는 `김친구`(메타 `선물 없음 · 금액 없음`), `이친구`(메타 `무선 이어폰 · ₩30,000`) 이다.
    - expect: `박친구` 와 `숨긴 메시지` 는 없다.
  6. 링크 `전체 보기` 를 누릅니다.
    - expect: URL 이 `/admin/wishes` 가 되고(timeout 30초) 지표 `총 선물` 이 `5개` 이다.

#### 1.2. Dashboard Empty State

**File:** `tests/admin/dashboard-empty.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`(선물·메시지·계좌 없음), `await signIn(admin)`. `/admin` 으로 이동해 문구 `등록된 선물이 없습니다.` 가 보일 때까지 기다립니다(timeout 30초). (seed-guide 와 같은 사용자 모양이지만 `signIn(admin)` 기본값이라 안내 모달은 뜨지 않습니다.)
    - expect: 지표 `선물` `0개`, `메시지` `0개`, `모인 금액` `₩0` 이다.
    - expect: `공유하기` 버튼과 `열어 보기` 링크(href `/wishlist/${admin.slug}`)가 있다.
  2. `최근 선물` 빈 상태를 확인합니다.
    - expect: 문구 `등록된 선물이 없습니다.` 와 설명 `첫 선물을 추가하면 운영 목록과 공개 페이지에 바로 반영됩니다.` 가 보인다.
    - expect: 링크 `선물 추가` 의 href 가 `/admin/wishes` 이다(탐색: `#create-wish` 가 붙지 않음).
    - expect: 링크 `전체 보기` 의 href 는 `/admin/wishes` 이다.
  3. `최근 메시지` 빈 상태를 확인합니다.
    - expect: 문구 `아직 메시지가 없습니다.` 와 설명 `공개 페이지에서 마음이 도착하면 이곳에서 빠르게 확인합니다.` 가 보인다.
    - expect: 링크 `공개 페이지 보기` 가 헤더와 빈 상태에 2개(count 2)이고 둘 다 href 가 `/wishlist/${admin.slug}` 이다.
  4. 링크 `선물 추가` 를 누릅니다.
    - expect: URL 이 `/admin/wishes` 가 되고 `details#create-wish` 가 열려 있다(`open` true, 선물이 없어서).

### 2. Share Public Link

**Seed:** `tests/admin/seed-settings.spec.ts`

#### 2.1. Share Link Copy

**File:** `tests/admin/share-public-link-copy.spec.ts`

**Steps:**
  1. [사전 조건] `test.use({ permissions: ['clipboard-read','clipboard-write'] })`. `const admin = await seedAdmin()`, `await signIn(admin)`. `page.addInitScript` 로 `Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })`(`tests/sample/share-link-copy.spec.ts` 방식). `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    - expect: `typeof navigator.share` 가 `undefined` 이다.
    - expect: `main` 안에 버튼 `공유하기` 가 보인다.
  2. `공유하기` 를 누릅니다.
    - expect: 같은 버튼의 라벨이 `복사 완료` 로 바뀐다(탐색 확인).
    - expect: 토스트 `위시리스트 링크를 복사했어요.`(`data-type` `success`)가 보인다.
    - expect: `expect.poll` 로 `navigator.clipboard.readText()` 를 읽어 `new URL(text)` 로 파싱하면 origin 이 `http://localhost:3200`, pathname 이 `/wishlist/${admin.slug}`, `utm_source` 가 `owner_share`, `utm_medium` 이 `share`, `theme` 쿼리는 `null` 이다(탐색: `http://localhost:3200/wishlist/e2e-…?utm_source=owner_share&utm_medium=share`).
    - expect: URL 은 `/admin` 그대로이고 `context.pages()` 가 1개이다.
  3. 약 2초 대기합니다(`toHaveText('공유하기', { timeout: 5000 })`).
    - expect: 버튼 라벨이 `공유하기` 로 되돌아간다(탐색: 2.6초 뒤 복귀).

#### 2.2. Native Share

**File:** `tests/admin/share-public-link-native.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin)`. `page.addInitScript` 로 `window.__shareCalls = []`, `window.__clipWrites = 0`, `navigator.share = async (data) => { window.__shareCalls.push(data) }`(resolve), `navigator.clipboard.writeText` 를 감싸 호출 횟수를 셉니다(`tests/sample/native-share-paths.spec.ts` 참고). `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    - expect: `main` 안에 버튼 `공유하기` 가 보인다.
  2. `공유하기` 를 누르고 `expect.poll` 로 `window.__shareCalls.length` 가 1 이 되길 기다립니다.
    - expect: 호출 인자가 `{ title: '뭐갖고싶어 생일 위시리스트', url }` 이고, `url` 을 파싱하면 origin `http://localhost:3200`, pathname `/wishlist/${admin.slug}`, `utm_source` `owner_share`, `utm_medium` `share` 이다(탐색 확인).
    - expect: `window.__clipWrites` 가 0 이다(클립보드 폴백이 일어나지 않음).
    - expect: `[data-sonner-toast]` 가 0개이고 버튼 라벨이 `공유하기` 그대로이다(`복사 완료` 로 바뀌지 않음, 탐색 확인).
    - expect: URL 은 `/admin` 그대로이다.

### 3. Settings

**Seed:** `tests/admin/seed-settings.spec.ts`

#### 3.1. Save Profile And Public Page Settings

**File:** `tests/admin/save-profile-settings.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ displayName: "E2E 관리자" })`, `await signIn(admin)`. 먼저 `/wishlist/${admin.slug}` 를 열어 레벨 1 제목 `E2E 관리자님의 위시리스트` 와 `main[data-theme]` `pixel_y2k` 를 확인합니다(timeout 30초). 공개 페이지는 `unstable_cache`(`src/lib/public-wishlist/cache.ts`)로 캐시되므로, 저장 전에 한 번 열어 두어야 4단계가 저장 시 캐시 무효화(`revalidatePublicWishlist`)까지 확인합니다. 이어서 `/admin/settings` 로 이동해 `#displayName` 을 기다립니다(timeout 30초).
    - expect: `이름` 값 `E2E 관리자`, `생일` 빈 값, `소개` 빈 값, `공개 주소` `${admin.slug}`, `제목` `E2E 관리자님의 위시리스트`, `공개 여부` `public`(옵션 `공개`·`비공개`), `테마` `pixel_y2k`(옵션 `픽셀 Y2K`·`모노 흑백`·`소프트 파스텔`) 이다.
    - expect: 레벨 3 제목이 `프로필`, `공개 페이지`, `계좌 안내`, `새 생일 준비`, `계정`, `회원 탈퇴` 순서로 있다.
  2. `이름` 을 `새 이름`, `생일` 을 `1990-03-15`(`fill`), `소개` 를 `올해도 잘 부탁해요`, `제목` 을 `새 위시리스트 제목`, `테마` 를 `soft_pastel`(`selectOption`)로 바꾸고 버튼 `저장하기` 를 누릅니다.
    - expect: 토스트 `설정을 저장했어요.`(`data-type` `success`)가 보인다.
    - expect: URL 이 `/admin/settings` 로 정리된다(`?saved=1` 제거, `toHaveURL(/\/admin\/settings$/)`).
    - expect: 리다이렉트로 다시 렌더된 입력값이 `새 이름`, `1990-03-15`, `올해도 잘 부탁해요`, `새 위시리스트 제목`, `soft_pastel` 이고 `공개 주소` 는 `${admin.slug}` 그대로이다(서버 렌더 결과).
  3. [e2eDb 조회, 코드 근거] `expect.poll` 로 `profiles`(`userId = admin.userId`)와 `wishlists`(`ownerId = admin.userId`)를 조회합니다.
    - expect: `profiles.displayName` `새 이름`, `birthday` `1990-03-15`, `description` `올해도 잘 부탁해요` 이다.
    - expect: `wishlists.title` `새 위시리스트 제목`, `themeId` `soft_pastel`, `slug` `admin.slug`, `visibility` `public` 이다.
  4. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초).
    - expect: 레벨 1 제목 `새 위시리스트 제목`, 문단 `올해도 잘 부탁해요` 가 보인다.
    - expect: 생일 배지 `3월 15일 · D-<숫자>` 가 보인다(`getByText(/^3월 15일 · D-(DAY|\d+)$/)`, D-일수는 실행 날짜에 따라 달라지고 3월 15일 당일은 `D-DAY` 라 정규식. 탐색: `3월 15일 · D-121`).
    - expect: `main[data-theme]` 의 `data-theme` 가 `soft_pastel` 이다. 문서 title 도 `새 위시리스트 제목` 이다(탐색 확인).

#### 3.2. Change Public Slug

**File:** `tests/admin/change-public-slug.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin)`. 새 slug 는 테스트마다 유일하게 ``const next = `e2e-new-${admin.slug.slice(4)}` `` 처럼 만듭니다(소문자·숫자·하이픈, 3~32자). `/admin/settings` 로 이동해 `#wishlistSlug` 를 기다립니다(timeout 30초).
    - expect: `공개 주소` 값이 `admin.slug` 이다.
    - (그 전에 `/wishlist/${admin.slug}` 를 열어 레벨 1 제목 `E2E 관리자님의 위시리스트` 를 확인해 옛 주소의 캐시를 채워 둡니다. 5단계의 not-found 가 이전 slug 캐시 무효화(`revalidatePublicWishlist(result.previousWishlistSlug)`)의 근거가 됩니다.)
  2. `공개 주소` 에 `"  " + next.toUpperCase() + "  "`(앞뒤 공백, 대문자)를 입력하고 `저장하기` 를 누릅니다. 브라우저 `minLength`·`maxLength` 만 걸려 있어 제출됩니다(탐색 확인).
    - expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    - expect: `공개 주소` 입력값이 소문자·공백 제거된 `next` 이다(서버가 `trim`+소문자 정규화, 탐색: `  E2E-New-Slug  ` → `e2e-new-slug`).
    - expect: 헤더 링크 `공개 페이지 보기` 의 href 가 `/wishlist/${next}` 로 갱신된다(탐색 확인).
  3. [e2eDb 조회, 코드 근거] `expect.poll` 로 `wishlists`(`ownerId = admin.userId`)를 조회합니다.
    - expect: `slug` 가 `next` 이다.
  4. `/wishlist/${next}` 로 이동합니다.
    - expect: 레벨 1 제목 `E2E 관리자님의 위시리스트` 가 보인다(타임아웃 30초).
  5. `/wishlist/${admin.slug}`(옛 주소)로 이동합니다.
    - expect: 문구 `위시리스트를 찾을 수 없어요` 와 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.` 가 보인다(탐색: 옛 주소가 즉시 not-found 로 바뀜, `revalidatePublicWishlist` 가 이전·새 slug 모두 갱신).

#### 3.3. Slug Validation Errors

**File:** `tests/admin/slug-validation-errors.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `const other = await seedAdmin({ displayName: "E2E 다른 사람" })`(다른 사용자의 slug `other.slug` 를 얻기 위함, `signIn` 은 `admin` 만). `/admin/settings` 로 이동해 `#wishlistSlug` 를 기다립니다(timeout 30초).
    - expect: `공개 주소` 값이 `admin.slug` 이다.
  2. `공개 주소` 에 `sample` 을 입력하고 `저장하기` 를 누릅니다.
    - expect: 토스트 `sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.`(`data-type` `error`)가 보인다(탐색 확인, `reserved_slug` 전용 문구).
    - expect: URL 이 `/admin/settings` 로 정리된다(`?error=reserved_slug` 제거).
    - expect: 다시 렌더된 `공개 주소` 값이 입력한 `sample` 이 아니라 `admin.slug` 이다(서버 렌더 결과, 탐색 확인).
    - expect: [e2eDb 조회, 코드 근거] `wishlists.slug`(`ownerId = admin.userId`)가 `admin.slug` 그대로이다.
  3. 토스트가 사라지길 기다린 뒤(`[data-sonner-toast]` count 0, timeout 10초 — 앞 토스트와 섞이지 않게) `공개 주소` 에 `Bad_Slug!` 를 입력하고 `저장하기` 를 누릅니다. 클릭 전에 `page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/admin/settings')` 를 걸어 서버 응답을 받습니다.
    - expect: 응답 status 가 `307` 이고 `location` 헤더의 search 가 `?error=invalid_slug` 이다(서버가 정한 오류 코드, 코드 근거).
    - expect: 토스트 `공개 주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.`(`data-type` `error`)가 보이고, 일반 문구 `요청을 처리하지 못했어요.` 토스트는 없다.
    - expect: `공개 주소` 값이 `admin.slug` 그대로이고 URL 이 `/admin/settings` 이다.
    - expect: [e2eDb 조회, 코드 근거] `wishlists.slug` 가 `admin.slug` 그대로이다.
  4. 토스트가 사라지길 기다린 뒤 `공개 주소` 에 `other.slug`(다른 사용자의 slug)를 입력하고 3단계처럼 POST 응답을 받으며 `저장하기` 를 누릅니다.
    - expect: 응답 `location` 의 search 가 `?error=duplicate_slug` 이다(코드 근거).
    - expect: 토스트 `이미 사용 중인 공개 주소입니다.`(`data-type` `error`)가 보이고, 일반 문구 토스트는 없다.
    - expect: URL 이 `/admin/settings` 이고 `공개 주소` 값이 `admin.slug` 이다.
    - expect: [e2eDb 조회, 코드 근거] `wishlists`(`ownerId = admin.userId`)의 `slug` 가 `admin.slug`, `wishlists`(`ownerId = other.userId`)의 `slug` 가 `other.slug` 그대로이다.

#### 3.4. Toggle Wishlist Visibility

**File:** `tests/admin/wishlist-visibility.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000 } ] })`, `await signIn(admin)`. 먼저 `/wishlist/${admin.slug}` 를 열어 레벨 1 제목 `E2E 관리자님의 위시리스트` 를 확인합니다(timeout 30초, 공개 페이지 캐시를 채워 3단계 not-found 와 6단계 재공개가 캐시 무효화까지 확인하게 함). 이어서 `/admin/settings` 로 이동해 `#wishlistVisibility` 를 기다립니다(timeout 30초).
    - expect: `공개 여부` 값이 `public` 이고 힌트 `비공개로 하면 링크가 있어도 공개 페이지가 보이지 않아요.` 가 있다.
  2. `공개 여부` 를 `private`(옵션 `비공개`)로 바꾸고 `저장하기` 를 누릅니다.
    - expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    - expect: 다시 렌더된 `공개 여부` 값이 `private` 이다.
    - expect: [e2eDb 조회, 코드 근거] `expect.poll` 로 `wishlists.visibility` 가 `private` 이다.
  3. `/wishlist/${admin.slug}` 로 이동합니다(로그인한 소유자 본인 세션에서도 동일).
    - expect: 문구 `위시리스트를 찾을 수 없어요` 가 보인다(탐색: 소유자도 not-found).
  4. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    - expect: `내 공개 주소` 아래에 `비공개라 친구가 열 수 없어요.` 가 보인다(`ADMIN_COPY.privateShareNotice`, 탐색 확인, 서버 렌더).
    - expect: `공유하기` 버튼과 `열어 보기` 링크는 그대로 있다.
  5. `/admin/settings` 에서 `공개 여부` 를 `public` 으로 바꿔 `저장하기` 를 누릅니다.
    - expect: 토스트 `설정을 저장했어요.` 가 보이고 [e2eDb 조회, 코드 근거] `expect.poll` 로 `visibility` 가 `public` 이다.
  6. `/wishlist/${admin.slug}` 로 이동하고, 이어서 `/admin` 으로 이동합니다.
    - expect: 공개 페이지에서 레벨 1 제목 `E2E 관리자님의 위시리스트` 가 보이고 `선물` `1개` 이다.
    - expect: `/admin` 에서 `비공개라 친구가 열 수 없어요.` 가 없다(count 0, 서버 렌더가 비공개일 때만 출력, 탐색 확인).

#### 3.5. Register Bank Account

**File:** `tests/admin/register-bank-account.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`(계좌 없음), `await signIn(admin)`. `/admin/settings` 로 이동해 `#accountVisibility` 를 기다립니다(timeout 30초).
    - expect: `은행`·`예금주` 가 빈 값, `계좌번호` 의 placeholder 가 `3333-12-1234567` 이다.
    - expect: `계좌 공개` select 가 disabled 이고 값은 `copy_only`, 힌트는 `공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.` 이다(탐색 확인).
  2. `은행` `E2E은행`, `예금주` `홍길동`, `계좌번호` `123-456-789012` 를 입력하고 `저장하기` 를 누릅니다.
    - expect: 토스트 `설정을 저장했어요.`(`data-type` `success`)가 보이고 URL 이 `/admin/settings` 로 정리된다. 계좌 없음 경고 토스트는 나오지 않는다(탐색: 토스트 1개).
    - expect: 다시 렌더된 `은행` 이 `E2E은행`, `예금주` 가 `홍길동` 이다.
    - expect: `계좌번호` 입력이 빈 값이고 placeholder 가 `변경할 때만 입력` 이다(서버 렌더 결과, 탐색 확인).
    - expect: `계좌 공개` select 가 활성화(`toBeEnabled`)되고 값은 `copy_only` 이다.
  3. [e2eDb 조회, 코드 근거] `expect.poll` 로 `bankAccounts`(`userId = admin.userId`)를 조회합니다(`decryptAccountNumber` 는 `@/src/lib/settings/account-crypto`, 비밀키는 `E2E_ACCOUNT_ENCRYPTION_SECRET`).
    - expect: 1행이고 `bankName` `E2E은행`, `accountHolder` `홍길동`, `visibility` `copy_only` 이다.
    - expect: `accountNumberEncrypted` 는 `123-456-789012` 문자열이 아니다. `decryptAccountNumber(accountNumberEncrypted, E2E_ACCOUNT_ENCRYPTION_SECRET)` 결과가 `123-456-789012` 이다(반환 형태는 생성기가 `account-crypto.ts` 에서 확인).
  4. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다리고, `계좌 안내` 가 든 `details` 를 찾습니다.
    - expect: `details`(요약 `gift account`·`계좌 안내`·`마음은 이 계좌로 전할 수 있어요.`)가 1개이고 `open` 이 false 이다(탐색 확인).
    - expect: `summary` 를 눌러 열면 `예금주` `홍길동` 과 버튼 `계좌번호 복사` 가 보이고, 은행 이름과 계좌번호 문자열(`E2E은행`, `123-456-789012`)은 화면에 없다(`copy_only` 는 번호를 표시하지 않고 복사만 허용, `components/public-bank-account-card.tsx` 의 `showAccountNumber`).

#### 3.6. Hide Bank Account

**File:** `tests/admin/hide-bank-account.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ bankAccount: { bankName: "E2E은행", accountHolder: "E2E 관리자", accountNumber: "123-456-789012", visibility: "copy_only" } })`, `await signIn(admin)`. 먼저 `e2eDb` 로 `bankAccounts`(`userId = admin.userId`)의 `accountNumberEncrypted` 를 읽어 `before` 에 보관합니다. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초). 이어서 `/admin/settings` 로 이동해 `#accountVisibility` 를 기다립니다.
    - expect: 공개 페이지에 `계좌 안내` details 가 1개 있다(숨기기 전 기준값, 같은 단언을 마지막 단계에서 0 으로 비교).
    - expect: 설정에서 `은행` `E2E은행`, `예금주` `E2E 관리자`, `계좌번호` 빈 값·placeholder `변경할 때만 입력`, `계좌 공개` 값 `copy_only`·활성 상태, 힌트 `공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.` 이다.
  2. `계좌 공개` 를 `hidden`(옵션 `숨기기`)으로 바꿉니다(아직 저장 안 함).
    - expect: 힌트가 `공개 페이지에 계좌가 보이지 않아요.` 로 바뀐다(클라이언트 상태이므로 이것만으로 서버 동작을 판단하지 않음, 탐색 확인).
  3. `계좌번호` 칸은 비워 둔 채 `저장하기` 를 누릅니다.
    - expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    - expect: 다시 렌더된 `계좌 공개` 값이 `hidden`, 힌트가 `공개 페이지에 계좌가 보이지 않아요.`, `은행` 이 `E2E은행`, placeholder 가 `변경할 때만 입력` 이다(서버 렌더 결과).
  4. [e2eDb 조회, 코드 근거] `expect.poll` 로 `bankAccounts`(`userId = admin.userId`)를 조회합니다.
    - expect: `visibility` 가 `hidden` 이다.
    - expect: `bankName` `E2E은행`, `accountHolder` `E2E 관리자` 그대로이고 `accountNumberEncrypted` 가 `before` 와 같다(복호화하면 `123-456-789012`).
  5. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초).
    - expect: `계좌 안내` 텍스트가 없다(count 0, 탐색: `details` 는 `gift note` 와 선물별 `이 선물에 마음 보태기` 만 남음). 첫 단계에서 같은 페이지에 `계좌 안내` 가 있었음을 확인한 것과 짝이다.

### 4. Wishlist Reset

**Seed:** `tests/admin/seed-settings.spec.ts`

#### 4.1. Cancel Reset Wishlist

**File:** `tests/admin/cancel-reset-wishlist.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], messages: [ { senderName: "이친구", body: "이어폰에 보태요", wishItemIndex: 0, amount: 30_000 } ] })`, `await signIn(admin)`. `/admin/settings` 로 이동해 버튼 `위시리스트 초기화` 를 기다립니다(timeout 30초).
    - expect: `새 생일 준비` 섹션에 설명 `지난 생일의 선물, 메시지, 모인 금액 기록을 모두 지우고 새로 시작해요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.` 가 있다.
  2. 클릭 전에 `page.once('dialog', async (dialog) => { type = dialog.type(); message = dialog.message(); await dialog.dismiss(); })` 를 걸고 버튼 `위시리스트 초기화` 를 누릅니다.
    - expect: 확인 창 종류가 `confirm`, 메시지가 `위시리스트를 초기화할까요? 등록한 선물, 받은 메시지, 모인 금액 기록이 모두 삭제되고 되돌릴 수 없어요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.` 이다(탐색 확인).
    - expect: 취소하면 제출이 막힌다. 근거는 고정 대기 뒤의 토스트 0개가 아니라(취소 직후에는 항상 참) 아래 DB 행 수와 `/admin` 에서 서버가 렌더한 지표로 삼습니다.
  3. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`), `messages`(`wishlistId = admin.wishlistId`), `funding_logs`(`wishItemId = admin.items[0].id`)를 조회합니다.
    - expect: `wish_items` 1행(`fundedAmount` `30000`), `messages` 1행, `funding_logs` 1행(`amount` `30000`)이 그대로이다.
  4. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    - expect: `선물` `1개`, `메시지` `1개`, `모인 금액` `₩30,000` 이다(서버 렌더, 취소 뒤 지표 그대로).

#### 4.2. Reset Wishlist

**File:** `tests/admin/reset-wishlist.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin({ displayName: "E2E 관리자", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 }, { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" } ], messages: [ { senderName: "김친구", body: "생일 축하해!" }, { senderName: "이친구", body: "이어폰에 보태요", wishItemIndex: 0, amount: 30_000 }, { senderName: "박친구", body: "숨긴 메시지", isHidden: true } ], bankAccount: { bankName: "E2E은행", accountHolder: "E2E 관리자", accountNumber: "123-456-789012", visibility: "copy_only" } })`, `await signIn(admin)`. `e2eDb` 로 초기화 전 값을 보관합니다: `profiles`(displayName), `wishlists`(slug, title, themeId, visibility), `bankAccounts`(bankName, accountHolder, visibility, accountNumberEncrypted).
    - expect: `wish_items` 2행, `messages` 3행이 있다.
    - `/wishlist/${admin.slug}` 를 열어 레벨 1 제목과 `선물` `1개`(숨긴 선물 제외)를 확인합니다(timeout 30초). 공개 페이지 캐시를 채워 6단계가 초기화 시 캐시 무효화까지 확인하게 합니다.
  2. `/admin/messages` 를 한 번 방문한 뒤 [e2eDb 조회, 코드 근거] `expect.poll` 로 `wishlists.messagesReadAt` 이 null 이 아니게 되길 기다립니다(읽음 처리가 초기화로 null 이 되는지 보기 위한 사전 조건).
    - expect: `messagesReadAt` 이 null 이 아니다.
  3. `/admin/settings` 로 이동해 버튼 `위시리스트 초기화` 를 기다립니다(timeout 30초). 클릭 전에 `page.once('dialog', async (dialog) => { await dialog.accept(); })` 를 걸고 버튼을 누릅니다. (MCP 탐색 중에는 `browser_run_code_unsafe` 안에서 확인 창을 띄우지 말고 `browser_click` 후 `browser_handle_dialog` accept 를 씁니다.)
    - expect: 토스트 `위시리스트를 초기화했어요. 새 생일을 준비해 보세요.`(`data-type` `success`)가 보인다.
    - expect: URL 이 `/admin/settings` 로 정리된다(`?wishlistReset=1` 제거, 탐색 확인).
    - expect: 다시 렌더된 `이름`, `공개 주소`, `제목`, `테마`, `은행`, `예금주`, `계좌 공개` 가 초기화 전과 같다(`E2E 관리자`, `${admin.slug}`, `E2E 관리자님의 위시리스트`, `pixel_y2k`, `E2E은행`, `E2E 관리자`, `copy_only`).
  4. [e2eDb 조회, 코드 근거] `expect.poll` 로 초기화 결과를 조회합니다.
    - expect: `wish_items`(`wishlistId = admin.wishlistId`) 0행, `messages`(`wishlistId = admin.wishlistId`, 숨긴 메시지 포함) 0행, `funding_logs`(`wishItemId` 가 원래 선물 id 둘 중 하나) 0행이다.
    - expect: `wishlists`(`id = admin.wishlistId`)의 `messagesReadAt` 이 null 이고 `slug`·`title`·`themeId`·`visibility` 가 초기화 전 값과 같다.
    - expect: `profiles`(`userId = admin.userId`)의 `displayName` 이 초기화 전 값과 같다.
    - expect: `bank_accounts`(`userId = admin.userId`) 1행이 그대로이다(`bankName`, `visibility`, `accountNumberEncrypted` 변화 없음).
  5. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다(timeout 30초).
    - expect: 지표 `선물` `0개`, `메시지` `0개`, `모인 금액` `₩0` 이다.
    - expect: 빈 상태 `등록된 선물이 없습니다.`, `아직 메시지가 없습니다.` 가 보인다.
    - expect: `내 공개 주소` 가 여전히 `/wishlist/${admin.slug}` 이다.
  6. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초).
    - expect: 레벨 1 제목 `E2E 관리자님의 위시리스트`, `선물` `0개`, `모인 마음` `₩0` 이다.
    - expect: `article` 이 0개이고 문구 `아직 공개된 선물이 없어요` 가 보인다(탐색 확인).
    - expect: `계좌 안내` details 가 그대로 있다(시드 계좌가 copy_only 이고 초기화가 계좌를 건드리지 않음).

### 5. Sign Out

**Seed:** `tests/admin/seed-settings.spec.ts`

#### 5.1. Sign Out

**File:** `tests/admin/sign-out.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin)`. `/admin/settings` 로 이동해 버튼 `로그아웃` 을 기다립니다(timeout 30초).
    - expect: `계정` 섹션에 설명 `현재 기기에서 로그아웃합니다.` 와 버튼 `로그아웃` 이 있다.
    - expect: `context.cookies()` 에 이름 `authjs.session-token`, 값 `admin.sessionToken` 인 쿠키가 있다(탐색: 쿠키 이름 확인).
  2. 버튼 `로그아웃` 을 누릅니다.
    - expect: URL 이 `http://localhost:3200/login` 이 된다(`toHaveURL('http://localhost:3200/login', { timeout: 15_000 })`; `webServer.env` 의 `AUTH_URL` 덕분에 3000 이 아니라 3200, 2026-11-20 임시 테스트로 확인).
    - expect: 레벨 1 제목 `로그인` 과 버튼 `Google로 계속하기` 가 보인다.
    - expect: [e2eDb 조회, 코드 근거] `expect.poll` 로 `sessions`(`sessionToken = admin.sessionToken`)가 0행이 된다(database 세션이라 로그아웃이 행을 지움).
    - expect: `context.cookies()` 에 `authjs.session-token` 이 없다(탐색: 로그아웃 뒤 `authjs.callback-url` 만 남음).
  3. `/admin` 으로 이동합니다.
    - expect: URL 이 `/login` 이 되고(timeout 30초) 버튼 `Google로 계속하기` 가 보이며 사이드바(`complementary`)는 없다.

### 6. Admin Guide

**Seed:** `tests/admin/seed-guide.spec.ts`

#### 6.1. First Visit Guide

**File:** `tests/admin/admin-guide-first-visit.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin, { showAdminGuide: true })`(안내 모달을 끄지 않음). `/admin` 으로 이동해 dialog `이제 위시리스트를 만들어볼까요?` 를 기다립니다(timeout 30초, 모달은 hydration 직후 localStorage 를 읽어 열림).
    - expect: `page.evaluate` 로 `localStorage.getItem('mwagotgo:admin-guide-seen')` 이 `null` 이다(탐색 확인).
    - expect: dialog 안에 진행 표시 `01 / 03`, 단계 제목(레벨 2, 모달 제목과 구분해 `.last()`) `갖고 싶은 선물을 담아요`, 버튼 `관리 화면 먼저 둘러보기`, `다음`, `안내 닫기` 가 있고 `이전` 은 없다. 초기 포커스는 버튼 `다음` 이다(탐색 확인).
  2. `다음` → `이전` → `다음` → `다음` 순서로 누릅니다.
    - expect: 첫 `다음` 후 `02 / 03`, 단계 제목 `친구에게 보일 페이지를 확인해요`, 버튼 `이전` 이 나타난다.
    - expect: `이전` 후 `01 / 03` 으로 돌아온다.
    - expect: `다음` 두 번 뒤 `03 / 03`, 단계 제목 `링크를 보내고 마음을 기다려요`, 버튼이 `관리 화면 먼저 둘러보기`·`이전`·`첫 선물 담기`·`안내 닫기` 이고 `다음` 은 없다(count 0).
    - expect: 단계를 넘기는 동안 localStorage `mwagotgo:admin-guide-seen` 은 여전히 `null` 이다(탐색 확인: 닫을 때 기록됨).
  3. 버튼 `안내 닫기`(aria-label)를 누릅니다.
    - expect: dialog 가 닫힌다(닫히는 애니메이션을 위해 `expect(...).toHaveCount(0)` 로 재시도).
    - expect: localStorage `mwagotgo:admin-guide-seen` 이 `"1"` 이다.
    - expect: URL 은 `/admin` 그대로이다(`guide` 쿼리 없음).
  4. **다시 들어오면 안 보이는지 확인.** (근거: 로드 직후 `dialog` 0개는 항상 참이므로, hydration 이후에만 일어나는 일을 신호로 씁니다.) `/admin/settings` 로 전체 이동해 버튼 `저장하기` 를 기다린(timeout 30초) 뒤 누릅니다(폼 POST → `/admin/settings?saved=1` 리다이렉트로 문서 전체가 다시 로드됨). 토스트 `설정을 저장했어요.` 가 나타나고 `toHaveURL(/\/admin\/settings$/)` 로 `?saved=1` 이 지워질 때까지 기다린 뒤 `getByRole('dialog')` count 를 단언합니다. 토스트와 쿼리 정리는 hydration 뒤 `AdminToastEvents` 의 effect 에서 일어나고, 안내 모달의 localStorage 확인도 같은 hydration 직후에 끝나므로 이 시점의 0개는 '아직 안 열렸다'가 아니라 '열리지 않기로 결정했다'는 근거가 됩니다. 탐색에서는 이 신호가 아래 대조 단계로 구별력이 있음을 확인했습니다.
    - expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    - expect: `getByRole('dialog')` 가 0개이고 localStorage 값은 `"1"` 그대로이다(탐색 확인: dialog 0, ls `1`).
    - expect: [대조: 신호가 구별력 있음을 증명] 토스트가 사라진 뒤(`[data-sonner-toast]` count 0, timeout 10초) `page.evaluate(() => localStorage.removeItem('mwagotgo:admin-guide-seen'))` 를 하고 다시 `저장하기` 를 누르면, 같은 신호(토스트·URL 정리) 시점에 재시도 없이 읽은(`dialog.count()`) dialog `이제 위시리스트를 만들어볼까요?` 개수가 1 이다(탐색 확인: control 에서 dialog 1). 위의 0개 단언과 같은 조건에서 비교하기 위해 `toHaveCount(1)` 의 재시도를 쓰지 않는다. 이 대조를 테스트에 넣으면 0개 단언이 항상 참이 아님이 보장된다.

#### 6.2. Guide First Gift Action

**File:** `tests/admin/admin-guide-first-gift.spec.ts`

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`(선물 없음), `await signIn(admin, { showAdminGuide: true })`. `/admin` 으로 이동해 dialog 를 기다리고(timeout 30초) `다음` 을 두 번 눌러 `03 / 03` 으로 갑니다.
    - expect: 진행 표시 `03 / 03`, 버튼 `첫 선물 담기` 가 보인다.
    - expect: localStorage `mwagotgo:admin-guide-seen` 이 `null` 이다.
  2. 버튼 `첫 선물 담기` 를 누릅니다.
    - expect: URL 이 `/admin/wishes#create-wish` 가 된다(`toHaveURL(/\/admin\/wishes#create-wish$/)`, `router.push`, 탐색 확인).
    - expect: localStorage `mwagotgo:admin-guide-seen` 이 `"1"` 이다(닫기가 이동 전에 기록됨).
    - expect: `details#create-wish` 가 열려 있다(`open` true, summary `선물 추가`·`접기`)이고 `선물 이름` 입력과 문구 `등록된 선물이 없습니다.` 가 보인다. 선물이 0개라 패널은 원래 열려 있으므로 이 단언은 이동한 화면의 상태 기록이고 해시 이동의 근거는 URL 이다.
    - expect: 위 요소가 보인 뒤 dialog 가 없다(`toHaveCount(0)`; 단독 근거가 아니라 localStorage `"1"` 과 함께 보는 보조 단언).

#### 6.3. Dismiss Guide Removes Query

**File:** `tests/admin/admin-guide-dismiss.spec.ts`

(안내 모달이 `?guide=1`·사이드바 `사용 가이드` 로 **열리는지**는 main 의 `tests/admin/guide-dialog.spec.ts` 가 다룹니다. 이 시나리오는 닫기 동작과 쿼리 정리, 다시 열 때 단계 초기화만 확인합니다.)

**Steps:**
  1. [사전 조건] `const admin = await seedAdmin()`, `await signIn(admin)`(안내를 이미 본 상태: localStorage `"1"`). `/admin?guide=1` 로 이동해 dialog `이제 위시리스트를 만들어볼까요?` 를 기다립니다(timeout 30초).
  2. `다음` 을 눌러 `02 / 03` 을 확인한 뒤 `Escape` 를 누릅니다.
    - expect: dialog 가 닫히고(`toHaveCount(0)`) URL 이 `/admin` 으로 정리된다(`guide` 쿼리 제거, `handleEscapeKeyDown` 이 `completeGuide('dismiss')` 호출).
    - expect: localStorage `mwagotgo:admin-guide-seen` 은 `"1"` 이다.
  3. 사이드바(`complementary`)의 링크 `사용 가이드` 를 누릅니다.
    - expect: dialog 가 다시 열리고 진행 표시가 `02 / 03` 이 아니라 `01 / 03` 이다(다시 열면 단계가 처음으로 돌아감, 탐색 확인).
  4. `/admin/settings?guide=1` 로 이동해 dialog 를 기다린 뒤 `관리 화면 먼저 둘러보기` 를 누릅니다.
    - expect: dialog 가 닫히고 URL 이 `/admin/settings` 로 정리된다(현재 경로 유지, `removeGuideQuery` 가 `pathname` 을 씀). `안내 닫기` 도 같은 `completeGuide('dismiss')` 를 호출한다(코드 근거).
