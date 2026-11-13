# Public Wishlist Participation Flow (/wishlist/[slug]) E2E Test Plan

## Application Overview


## 대상 및 범위

"뭐갖고싶어"(생일 위시리스트 서비스)의 공개 위시리스트 `/wishlist/[slug]` 에서 로그인하지 않은 친구가 하는 "참여 흐름"(페이지 렌더링, 축하 메시지, 마음 보태기, 오류/제한 처리)을 검증하는 E2E 테스트 계획입니다.

- 페이지 소스: `app/wishlist/[slug]/page.tsx` -> `components/public-wishlist-view.tsx`(렌더링), `components/public-wishlist-toast-events.tsx`(토스트·계좌 모달), `app/wishlist/[slug]/actions.ts`(서버 액션), `app/wishlist/[slug]/not-found.tsx`, `app/wishlist/[slug]/loading.tsx`. 문구 기준은 `src/lib/design/copy.ts` 의 `PUBLIC_WISHLIST_COPY` 입니다.
- 동작 방식: 페이지는 서버에서 DB 를 읽고(`unstable_cache` 300초, slug 키), 폼 제출은 서버 액션이 DB 에 바로 쓴 뒤 `?sent=message|funding` 또는 `?error=<code>` 로 리다이렉트합니다. 클라이언트가 토스트(sonner)를 띄우고 `router.replace` 로 쿼리를 지웁니다. `page.route()` 로 가로챌 수 없으므로 데이터는 `seedWishlist` 로만 제어하고, 저장 여부는 fixture `e2eDb`(drizzle)로 DB 를 직접 조회해 확인합니다.
- baseURL: `http://localhost:3200` (`playwright.config.ts`, project: chromium only). 시드 파일은 탐색용 `tests/wishlist/seed.spec.ts` 이며, **각 테스트는 이 위시리스트를 재사용하지 않고 자기 `seedWishlist({...})` 로 새 위시리스트(새 slug)를 만듭니다.** 생일(profile)은 seed 하지 않습니다(생일 배지 없음). 모든 테스트 파일은 `tests/wishlist/` 아래에 두고 `import { test, expect } from "../fixtures/wishlist"` 를 사용합니다(시나리오 3 은 seed 가 필요 없음).
- 범위 밖(이 계획에 넣지 않음): `wish_not_found`, `client_request_conflict`, 500자 초과 메시지, 음수·소수 금액, 생일 배지, `/admin`, 로그인/OAuth, 공유 버튼, 계좌번호 복사.
- 탐색은 실제 dev 서버에서 메시지·후원 제출을 해보며 진행했습니다. 단, 탐색 중에는 DB 를 볼 수 없었으므로 **DB 단언(e2eDb)은 코드(`src/lib/public-participation/*`) 근거**이며, 이를 각 시나리오에 표시했습니다.

## 탐색으로 확인한 실제 렌더링 데이터 (탐색용 seed)

탐색용 seed(`tests/wishlist/seed.spec.ts`): 제목 `E2E 친구의 위시리스트`, 카드 5개(무선 이어폰 open 30,000/100,000 · 필름 카메라 open 50,000/50,000 · 캠핑 의자 paused 0/80,000 · 보드게임 fulfilled 0/40,000 · 숨긴 선물 hidden), 계좌 `E2E은행` / `김친구` / `123-456-789012`(always_visible).

- 문서 title: 위시리스트 제목 그대로(`E2E 친구의 위시리스트`, 접미사 없음), `meta[name=robots]` 에 `noindex, nofollow` 포함.
- 헤더: 링크 `뭐갖고싶어`(href `/`), pill `birthday wishlist`, 버튼 `공유하기`. 생일 배지는 없음(profile 미설정). `h1` = 위시리스트 제목, 소개문 기본값 `받고 싶은 선물을 모아둔 위시리스트예요.`
- 요약(dl): `선물` = `4개`(hidden 제외), `모인 마음` = `₩80,000`(30,000 + 50,000 + 0 + 0). 금액 기호는 전각 원화 기호 U+20A9 입니다.
- 계좌 안내(details, always_visible 이라 기본 열림): `gift account` / `계좌 안내` / `마음은 이 계좌로 전할 수 있어요.`, `예금주` `김친구`, `E2E은행 123-456-789012`, 버튼 `계좌번호 복사`.
- 축하 메시지(details, 기본 닫힘): `gift note` / `축하 메시지 남기기` / `결제 없이 메시지만 전할 수 있어요.` 열면 `이름`(`#message-sender`, placeholder `이름`, maxlength 80), `메시지`(`#message-body`, textarea, maxlength 500, required), 버튼 `마음 보내기`.
- 선물 카드(`article`, 4개, hidden 은 없음):
  - `NO. 1` / `마음 모으는 중` / h2 `무선 이어폰` / `₩30,000` / `₩100,000 중` / `30% 달성` / 진행 막대(`.pub-progress i`) width `30%` / 하단 summary `이 선물에 마음 보태기` 있음
  - `NO. 2` / `완료` / h2 `필름 카메라` / `₩50,000` / `₩50,000 중` / `100% 달성` / width `100%` / 폼 없음 (status 는 open 이지만 금액 달성)
  - `NO. 3` / `잠시 멈춤` / h2 `캠핑 의자` / `₩0` / `₩80,000 중` / `0% 달성` / width `0%` / 폼 없음
  - `NO. 4` / `완료` / h2 `보드게임` / `₩0` / `₩40,000 중` / `0% 달성` / width `0%` / 폼 없음 (fulfilled)
- 카드 폼(summary `이 선물에 마음 보태기` 를 열면): 소제목 `마음 보내기`, 스핀버튼 `보낼 마음`(`#participation-amount-<itemId>`, placeholder `10000`, min 1, step 1, required, **max 없음**), 텍스트박스 `이름`(`#participation-sender-<itemId>`), `메시지`(`#participation-body-<itemId>`, required), 안내 `여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.`(계좌 있을 때) / `실제 선물 전달 방법은 생일자에게 직접 확인해주세요.`(계좌 없을 때, 코드 근거), 버튼 `마음 보내기`.
- not-found 화면(존재하지 않는 slug 로 관찰): pill `404`, h1 `위시리스트를 찾을 수 없어요`, 문단 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.`, 링크 `처음으로`(href `/`), 문서 title `위시리스트를 찾을 수 없어요`.
- 제출 결과 문구(토스트는 `[data-sonner-toast]`, 성공 `data-type="success"` / 실패 `data-type="error"`):
  - 메시지 성공: `축하 메시지가 전해졌어요.` + 토스트 액션 버튼 `나도 만들기`
  - 후원 성공(계좌 있음): 토스트 `마음이 전해졌어요.`(액션 버튼 없음) + `role=dialog`(accessible name `마음이 전해졌어요`) 모달
  - 후원 성공(계좌 없음, 코드 근거): `마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.` + 액션 `나도 만들기`, 모달 없음
  - 실패: `message_required` -> `메시지를 입력해주세요.`, `invalid_amount` -> `금액은 1원부터 1억 원까지 입력할 수 있어요.`, `wish_not_open` -> `지금은 마음을 보탤 수 없는 선물이에요.`, `rate_limited` -> `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.`
- 계좌 모달 내용(관찰): `thank you` pill, h2 `마음이 전해졌어요`, `아래 계좌로 보내주시면 전달이 완료돼요.`, `예금주` `김친구`, `E2E은행 123-456-789012`, 버튼 `계좌번호 복사`, `잘못 보냈다면 생일자에게 알려주세요.`, 링크 `나도 만들기`(href `/login?utm_source=post_participation&utm_medium=cta`), 버튼 `닫기`(클릭하면 모달이 사라짐).

## 테스트 생성기(generator)를 위한 공통 주의사항

1. **fixture 사용**: `import { test, expect } from "../fixtures/wishlist"`. `seedWishlist({ title, visibility?, items?, bankAccount? })` 는 호출마다 새 slug(`e2e-` + 12자)로 사용자·위시리스트·카드·계좌를 만들고 `{ slug, wishlistId, items: [{ id, title }] }` 를 돌려줍니다. `items` 배열 순서가 카드 순서(NO. 1, 2, ...)이고 `status` 를 생략하면 `open` 입니다. 테스트 종료 시 fixture 가 사용자를 지워 FK cascade 로 정리하므로 직접 지울 필요가 없습니다. 공통 계좌 입력: `bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" }`.
2. **로딩 셸 대기**: 첫 진입 시 `loading.tsx` 의 `<main>`(제목 없음, 스켈레톤)이 먼저 나올 수 있어 `getByRole('main')` 이 2개로 잡힐 수 있습니다. 반드시 `getByRole('heading', { level: 1, name: <제목> })` 이 보일 때까지 기다리세요(timeout 30초 권장: dev 서버가 `/wishlist/[slug]` 를 처음 컴파일할 때 느립니다).
3. **토스트는 몇 초 뒤 사라짐**: 탐색에서 제출 후 약 0.5초 안에 나타났고 최소 3초 동안 유지됐으며 이후 사라졌습니다(sonner 기본 수명). **제출 직후 먼저 토스트를 확인하고** DB 조회 같은 느린 작업은 그 뒤에 하세요. 토스트는 누적됩니다(같은 문구가 겹쳐 쌓이고 4번째부터는 `data-visible="false"`). 개수 대신 정확한 문구로 단언하고, 최신 토스트가 목록 맨 앞에서 보입니다. 로케이터 예: `const toast = page.locator('[data-sonner-toast]').filter({ hasText: '<문구>' })`, `await expect(toast).toHaveAttribute('data-type', 'success' | 'error')`.
4. **문구 부분 일치 주의**: 모달 h2 `마음이 전해졌어요`(마침표 없음)와 토스트 `마음이 전해졌어요.` 는 부분 일치로 겹칩니다(탐색: `getByText('마음이 전해졌어요')` 2개, `exact: true` 로 마침표 포함 시 1개). 계좌 없는 위시리스트의 토스트도 `마음이 전해졌어요.` 로 시작합니다. `getByText(..., { exact: true })` 또는 `[data-sonner-toast]` 필터로 좁히세요. `나도 만들기` 도 메시지 성공 토스트의 버튼, 계좌 모달의 링크로 각각 존재합니다. `완료` 는 `getByText('완료', { exact: true })` 로 찾으세요(모달에 `전달이 완료돼요` 문구가 있음).
5. **계좌 정보 중복**: 페이지 본문 `계좌 안내` 섹션과 후원 성공 모달에 같은 은행·예금주·계좌번호가 있어(탐색: `E2E은행 123-456-789012` 가 2개) 모달 단언은 `page.getByRole('dialog', { name: '마음이 전해졌어요' })` 안으로 범위를 좁히세요.
6. **폼 열기와 범위 좁히기**: 메시지 폼과 카드 폼은 모두 닫힌 `details` 입니다. summary 를 먼저 클릭해 연 뒤 필드를 입력하세요. `이름`·`메시지`·`마음 보내기` 가 메시지 폼과 각 카드 폼에 중복되므로 메시지 폼은 `page.locator('details').filter({ hasText: 'gift note' })`, 카드 폼은 `page.getByRole('article').filter({ hasText: '<카드 제목>' })` 로 범위를 좁히세요. 카드 안에서는 `getByRole('spinbutton', { name: '보낼 마음' })`, `getByRole('textbox', { name: '이름' })`, `getByRole('textbox', { name: '메시지' })`, `getByRole('button', { name: '마음 보내기' })` 가 동작하며, 필드 id 는 `participation-amount|sender|body-<itemId>` 입니다(`itemId` 는 `seedWishlist` 반환값 `items[i].id`). 메시지 폼 필드 id 는 `message-sender`, `message-body` 입니다.
7. **제출 후 페이지가 다시 마운트됨**: 성공·실패 모두 제출 후 폼 `details` 가 닫히고 입력값이 비워졌습니다(탐색: 메시지 폼, 카드 폼, 오류 리다이렉트 포함). 같은 폼을 다시 쓰려면 `open` 이 `false` 로 돌아온 것(`toHaveJSProperty('open', false)`)을 확인한 뒤 summary 를 다시 클릭하세요(열린 상태에서 summary 를 또 누르면 닫힙니다).
8. **DB 조회(e2eDb)**: `import { eq } from "drizzle-orm"` 와 `import { messages, fundingLogs, wishItems } from "@/src/lib/db/schema"` 를 사용합니다(fixture 와 같은 경로 별칭). 예: `await e2eDb.select().from(messages).where(eq(messages.wishlistId, wishlistId))`, `await e2eDb.select().from(fundingLogs).where(eq(fundingLogs.wishItemId, items[0].id))`, `await e2eDb.select().from(wishItems).where(eq(wishItems.id, items[0].id))`. 컬럼은 camelCase(`wishItemId`, `senderName`, `body`, `amount`, `fundedAmount`, `status`)입니다. **성공 제출**은 서버 액션이 DB 에 쓴 뒤 리다이렉트하므로 행이 곧 보이지만 타이밍 여유를 위해 `expect.poll(...)` 로 기다리세요. **실패 제출**은 오류 토스트가 보이면 서버 액션이 이미 끝난 것이므로 그 직후 "0행" 단언이 안전합니다(토스트를 먼저 확인).
9. **제출 제한**: slug + IP + User-Agent 기준 1분 5회(서버 메모리)이고 **입력 검증보다 먼저** 검사됩니다. 새 slug 마다 독립이므로 병렬 실행에 영향이 없지만, 한 테스트 안에서 같은 slug 로 6번 이상 제출하면 6번째부터 `rate_limited` 입니다. 시나리오 10 외 모든 테스트는 제출을 1회만 합니다.
10. **캐시**: 공개 페이지 데이터는 `unstable_cache`(300초)이며 `revalidateTag` 는 **성공 제출에서만** 호출됩니다. 새 slug 의 첫 방문은 항상 캐시 미스입니다. 방문 이후 DB 를 직접 바꿔도 페이지에는 반영되지 않을 수 있습니다(시나리오 9 는 이 부분을 다루지 않음). 성공 제출 뒤에는 즉시 갱신된 금액이 보입니다(탐색: 30,000 -> 40,000).
11. **HTTP 상태 코드**: 존재하지 않는 slug 의 not-found 화면도 문서 응답이 **HTTP 200** 이었습니다(탐색 실측: dev 서버, `loading.tsx` 스트리밍). 404 라고 단언하지 마세요. 상태 코드는 단언하지 않고 화면(h1)만 확인합니다.
12. **통화 기호**: 금액은 `Intl.NumberFormat('ko-KR', KRW)` 결과(`₩30,000`)이고 기호는 전각 원화 기호(U+20A9)입니다. 복사해서 쓰거나 `/30,000/` 정규식을 쓰세요. 같은 카드에 `₩50,000` 과 `₩50,000 중` 이 함께 있으므로 `getByText('₩50,000', { exact: true })` 로 구분하세요.
13. **클라이언트 검증**: 카드 폼 `보낼 마음` 은 `min=1`, `step=1`, `required` 이고 **max 가 없어** `100000001` 이 브라우저 검증을 통과합니다(탐색: `validity.valid === true`). 축하 메시지 `메시지` textarea 는 `required` 지만 **공백만 입력해도 `valueMissing === false`** 라 서버까지 전달됩니다.
14. **나도 만들기는 클릭하지 않음**: 토스트 버튼과 모달 링크는 `/login?utm_source=post_participation&utm_medium=cta` 로 이동합니다. 존재 여부(와 모달 링크의 href)만 확인하고 클릭하지 마세요.

## 탐색 중 발견한 사항

- **[관찰 / 시나리오 4, 10] 같은 페이지에서의 연속 제출에도 토스트가 모두 떴습니다.** `components/public-wishlist-toast-events.tsx` 의 `lastToastKeyRef` 는 같은 URL 키(`?sent=message`)가 연속되면 토스트를 건너뛸 수 있어 보였지만, 실제로는 (a) 메시지를 연속 2회 제출했을 때 두 번째에도 `축하 메시지가 전해졌어요.` 토스트가 떴고 URL 도 정리됐으며, (b) 한 페이지에서 5회 연속 메시지를 제출했을 때도 5번 모두 토스트가 뜨고 마지막(6번째)에 `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.` 오류 토스트가 떴습니다. 원인은 검증하지 않았지만, 매 제출 뒤 페이지가 다시 마운트되는 것(탐색: 제출 후 `<main>` 이 새로 만들어지고 폼 `details` 가 닫히며 입력값이 비워짐, 약 0.15초 안에 완료)과 `loading.tsx` 가 존재하는 점으로 볼 때 ref 가 초기화되는 것으로 추정됩니다(코드 근거 가설이며 버그로 단정하지 않습니다). 따라서 시나리오 10 은 토스트 대신 e2eDb 행 수와 "폼이 닫힘"으로 각 제출 완료를 기다립니다.
- **[관찰] 메시지 성공/실패 모두 제출 후 폼이 닫히고 입력값이 사라집니다.** 금액 `100000001` 오류 리다이렉트 뒤에도 카드 폼 `details` 는 닫혀 있고 금액 입력값은 빈 문자열이었습니다.
- **[관찰 / 시나리오 5] 공백만 있는 메시지는 브라우저 `required` 를 통과합니다.** `fill('     ')` 후 `validity.valueMissing === false` 였고, 제출하면 서버가 `메시지를 입력해주세요.` 오류 토스트(`data-type="error"`)를 돌려줬습니다.
- **[관찰 / 시나리오 8] 금액 `100000001` 은 브라우저 검증을 통과하고(`max` 속성 없음, `rangeOverflow === false`) 서버에서 `invalid_amount` 로 거절됩니다.** 토스트 문구는 `금액은 1원부터 1억 원까지 입력할 수 있어요.` 입니다(하한·상한 공통 문구. 탐색 당시 문구 `금액은 1원 이상으로 입력해주세요.` 가 상한 초과에 맞지 않아 `src/lib/design/copy.ts` 에서 바꿈). 오류 시 계좌 모달은 뜨지 않고 카드(`₩40,000`, 탐색 시점 기준)와 `모인 마음` 합계는 변하지 않았습니다.
- **[관찰 / 시나리오 6] 계좌가 있는 위시리스트의 후원 성공 토스트에는 액션 버튼이 없고**(`buttons: []`) `나도 만들기` 는 모달 안 링크로만 나옵니다. 모달 안과 본문 `계좌 안내` 섹션에 같은 계좌가 있어 `E2E은행 123-456-789012` 텍스트가 페이지에 2번 나옵니다. 후원 후 카드는 `₩30,000 -> ₩40,000`, `40% 달성`(width `40%`)으로 즉시 갱신됐고, 요약 `모인 마음` 도 합이 갱신됐습니다(탐색용 seed 에서 `₩80,000 -> ₩90,000`).
- **[관찰 / 시나리오 2, 3] not-found 문서 응답은 HTTP 200 이었습니다**(존재하지 않는 slug `e2e-does-not-exist-000`, 형식에 맞지 않는 slug `Bad_Slug!!`, 형식은 맞지만 없는 slug `e2e-aaaaaaaaaaaa` 모두 200, 같은 화면). 상태 코드는 단언하지 않습니다. (`Bad_Slug!!` 변형은 범위 밖이라 시나리오에 넣지 않았습니다.)
- **[미관찰 / 시나리오 2 의 private 부분]** 탐색용 seed 는 public 이라 private 위시리스트를 직접 열어보지 못했습니다. 코드 근거: `src/lib/public-wishlist/repository.ts` 의 `findPublicWishlistBySlug` 가 `visibility = 'public'` 만 조회하므로 private 도 `not_found` -> `notFound()` 로 같은 화면이 됩니다.
- **[미관찰 / 시나리오 7]** 탐색용 seed 에 계좌가 있어 "계좌 없음" 흐름은 실제로 제출해보지 못했습니다. 코드 근거: `getPublicToastConfig`(`public-wishlist-toast-events.tsx`)에서 `hasAccount === false` 이면 문구 `participationSuccessNoAccount`, `openAccountModal: false`, `showCreateCta: true` 입니다.
- **[미관찰 / 시나리오 9]** 탐색 중에는 DB 를 바꿀 수 없어 "소원을 `paused` 로 바꾼 뒤 제출" 을 재현하지 못했습니다. 오류 리다이렉트 뒤 카드에 `이 선물에 마음 보태기` 가 계속 보이는지는 **관찰되지 않았고**, 코드상 가설만 있습니다(`actions.ts` 는 성공할 때만 `revalidatePublicWishlist` 를 호출하고 DB 를 앱 밖에서 직접 바꿨으므로 캐시된 `open` 상태가 남을 수 있음). 그래서 시나리오 9 는 이 부분을 다루지 않고, 오류 시 DB 가 0행/그대로인 것은 `repository.ts` 트랜잭션 롤백(`wish_not_open`)이라는 코드 근거로 씁니다.
- **[참고]** 제출 제한(1분 5회) 때문에 탐색 중에는 같은 slug 에서 제출 사이에 약 1분씩 기다려야 했습니다. 시나리오 10 은 5회 + 6번째 제출이 약 3초 안에 끝났고, 6번째에서 `rate_limited` 오류 토스트가 확인됐습니다.

## 시나리오 목록 요약

1. Render by Status (렌더링: 제목, 선물 수, 모인 마음, 상태별 카드)
2. Private Wishlist Not Found
3. Missing Slug Not Found
4. Send Congratulation Message
5. Whitespace Message Rejected
6. Funding With Account (계좌 모달, 금액 갱신)
7. Funding Without Account (코드 근거)
8. Funding Invalid Amount (100000001)
9. Funding Paused Item
10. Submission Rate Limit (6번째 제출)

(아래 "Test Scenarios" 의 소제목 번호는 시나리오 번호와 같고, `N.1` 이 시나리오 N 입니다.)


## Test Scenarios

### 1. Rendering

**Seed:** `tests/wishlist/seed.spec.ts`

#### 1.1. Render by Status

**File:** `tests/wishlist/render-by-status.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 렌더링 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 }, { title: "필름 카메라", targetAmount: 50_000, fundedAmount: 50_000 }, { title: "캠핑 의자", targetAmount: 80_000, fundedAmount: 0, status: "paused" }, { title: "보드게임", targetAmount: 40_000, fundedAmount: 0, status: "fulfilled" }, { title: "숨긴 선물", targetAmount: 100_000, fundedAmount: 20_000, status: "hidden" } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출합니다. (탐색용 seed 와 달리 hidden 카드에 `fundedAmount: 20_000` 을 주어 합계에서 제외되는지 확인할 수 있게 한 변형이며, 이 변형은 `getPublicWishlist` 가 hidden 을 걸러낸 뒤 합산하는 코드 근거입니다. 탐색에서는 hidden 의 fundedAmount 가 0 이었습니다.)
    - expect: `slug`(`e2e-` 로 시작)와 `items` 5개가 반환된다.
    - expect: items 배열 순서가 카드 순서(NO. 1 ~ NO. 4, hidden 은 마지막이라 번호에 영향 없음)가 된다.
  2. 로그인하지 않은 새 페이지에서 `/wishlist/${slug}` 로 이동하고, 레벨 1 제목 `E2E 렌더링 위시리스트` 가 보일 때까지 대기합니다(timeout 30초 권장).
    - expect: 레벨 1 제목이 `E2E 렌더링 위시리스트` 이고 URL pathname 이 `/wishlist/${slug}` 로 유지된다.
    - expect: 문서 title 이 `E2E 렌더링 위시리스트` 이다.
    - expect: 소개문 `받고 싶은 선물을 모아둔 위시리스트예요.` 가 보인다.
    - expect: not-found 화면(`위시리스트를 찾을 수 없어요`)이 아니다.
  3. 요약 정의 목록(dl)을 확인합니다. (`page.locator('dt:text-is("선물") + dd')`, `page.locator('dt:text-is("모인 마음") + dd')`)
    - expect: 용어 `선물` 의 정의가 `4개` 이다 (hidden 카드는 개수에서 제외).
    - expect: 용어 `모인 마음` 의 정의가 `₩80,000` 이다 (30,000 + 50,000 + 0 + 0, hidden 카드의 20,000 은 포함되지 않음. 기호는 U+20A9).
    - expect: 정의 값이 `₩100,000` 이 아니다 (hidden 의 fundedAmount 가 합산되지 않음).
  4. 카드 목록(`getByRole('article')`)과 제목(`getByRole('heading', { level: 2 })`)을 확인합니다.
    - expect: `article` 이 정확히 4개이다.
    - expect: 레벨 2 제목이 순서대로 `무선 이어폰`, `필름 카메라`, `캠핑 의자`, `보드게임` 이다.
    - expect: 텍스트 `숨긴 선물` 이 페이지에 존재하지 않고(count 0), 상태 라벨 `숨김` 도 존재하지 않는다.
  5. 첫 번째 카드(`getByRole('article').filter({ hasText: '무선 이어폰' })`, open 이면서 미달성)를 확인합니다.
    - expect: `NO. 1` 과 상태 라벨 `마음 모으는 중` 이 보인다.
    - expect: `₩30,000`, `₩100,000 중`, `30% 달성` 이 보이고 진행 막대(`.pub-progress i`)의 inline style width 가 `30%` 이다.
    - expect: 카드 하단에 summary `이 선물에 마음 보태기` 가 보인다 (카드 안에 `form` 은 1개, 아직 닫혀 있어 `보낼 마음` 스핀버튼은 보이지 않는다).
  6. 두 번째 카드(`필름 카메라`, status 는 open 이지만 금액 달성)를 확인합니다.
    - expect: `NO. 2` 와 상태 라벨 `완료` 가 보이고 `마음 모으는 중` 은 보이지 않는다.
    - expect: `₩50,000`, `₩50,000 중`, `100% 달성` 이 보이고 진행 막대 width 가 `100%` 이다.
    - expect: 카드 안에 `이 선물에 마음 보태기` 가 없고 `form` 도 없다 (상태 라벨만 표시).
  7. 세 번째 카드(`캠핑 의자`, paused)를 확인합니다.
    - expect: `NO. 3` 과 상태 라벨 `잠시 멈춤` 이 보인다.
    - expect: `₩0`, `₩80,000 중`, `0% 달성` 이 보이고 진행 막대 width 가 `0%` 이다.
    - expect: 카드 안에 `이 선물에 마음 보태기` 와 `form` 이 없다.
  8. 네 번째 카드(`보드게임`, fulfilled)를 확인합니다.
    - expect: `NO. 4` 와 상태 라벨 `완료` 가 보인다 (진행률이 0% 여도 fulfilled 라 `완료` 로 표시).
    - expect: `₩0`, `₩40,000 중`, `0% 달성` 이 보인다.
    - expect: 카드 안에 `이 선물에 마음 보태기` 와 `form` 이 없다.
  9. 페이지 전체에서 상태 라벨과 폼 진입점의 개수를 확인합니다. (`getByText('...', { exact: true })`)
    - expect: `완료` 라벨이 정확히 2개(필름 카메라, 보드게임), `잠시 멈춤` 이 1개, `마음 모으는 중` 이 1개이다.
    - expect: `이 선물에 마음 보태기` 가 페이지 전체에 정확히 1개이고 `무선 이어폰` 카드 안에 있다.

### 2. Private Wishlist

**Seed:** `tests/wishlist/seed.spec.ts`

#### 2.1. Private Wishlist Not Found

**File:** `tests/wishlist/private-wishlist-not-found.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 비공개 위시리스트", visibility: "private", items: [ { title: "비공개 무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출합니다. (탐색용 seed 는 public 이라 private 를 직접 열어보지 못했고, 이 시나리오는 `findPublicWishlistBySlug` 의 `visibility = 'public'` 조건이라는 코드 근거와 존재하지 않는 slug 에서 관찰한 같은 not-found 화면에 근거합니다.)
    - expect: `slug` 가 반환된다.
  2. 새 페이지에서 `/wishlist/${slug}` 로 이동하고, 레벨 1 제목 `위시리스트를 찾을 수 없어요` 가 보일 때까지 대기합니다. (로딩 셸이 먼저 보일 수 있으므로 제목을 기다린 뒤 검증)
    - expect: 레벨 1 제목이 `위시리스트를 찾을 수 없어요` 이다.
    - expect: pill `404`(`getByText('404', { exact: true })`)가 보인다.
    - expect: 문단 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.` 가 보인다.
    - expect: 링크 `처음으로` 가 보이고 href 가 `/` 이다 (클릭하지 않음).
    - expect: 문서 title 이 `위시리스트를 찾을 수 없어요` 이다.
    - expect: URL 은 `/wishlist/${slug}` 그대로이다 (리다이렉트 없음).
    - expect: HTTP 상태 코드는 단언하지 않는다 (탐색에서 not-found 도 200 으로 관찰됨).
  3. 비공개 위시리스트의 데이터가 노출되지 않는지 확인합니다. (부정 검증)
    - expect: 페이지에 `E2E 비공개 위시리스트`, `비공개 무선 이어폰`, `E2E은행`, `123-456-789012` 텍스트가 없다 (count 0).
    - expect: `공유하기` 버튼, `축하 메시지 남기기`, `이 선물에 마음 보태기`, `article` 이 존재하지 않는다.

### 3. Missing Slug

**Seed:** `tests/wishlist/seed.spec.ts`

#### 3.1. Missing Slug Not Found

**File:** `tests/wishlist/missing-slug-not-found.spec.ts`

**Steps:**
  1. [사전 조건] 이 테스트는 `seedWishlist` 를 호출하지 않습니다. 새 페이지에서 존재하지 않는 slug 로 `/wishlist/e2e-does-not-exist-000` 에 이동하고, 레벨 1 제목 `위시리스트를 찾을 수 없어요` 가 보일 때까지 대기합니다. (탐색에서 이 slug 로 관찰함)
    - expect: 레벨 1 제목이 `위시리스트를 찾을 수 없어요` 이다.
    - expect: pill `404`(`getByText('404', { exact: true })`)가 보인다.
    - expect: 문단 `주소가 잘못되었거나 아직 공개되지 않은 위시리스트예요.` 가 보인다.
    - expect: 링크 `처음으로` 가 보이고 href 가 `/` 이다.
    - expect: 문서 title 이 `위시리스트를 찾을 수 없어요` 이고 URL 은 `/wishlist/e2e-does-not-exist-000` 그대로이다.
  2. 위시리스트 화면 요소가 없는지 확인합니다. (부정 검증)
    - expect: `공유하기` 버튼, `계좌 안내`, `축하 메시지 남기기`, `이 선물에 마음 보태기`, `선물`/`모인 마음` 요약, `article` 이 존재하지 않는다.
    - expect: `getByRole('main')` 이 1개이다 (제목을 기다린 뒤에는 로딩 셸이 아니라 not-found 화면의 `main` 만 남음).

### 4. Send Message

**Seed:** `tests/wishlist/seed.spec.ts`

#### 4.1. Send Congratulation Message

**File:** `tests/wishlist/send-message.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 메시지 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목 `E2E 메시지 위시리스트` 가 보일 때까지 대기합니다.
    - expect: 메시지 폼 `details`(`page.locator('details').filter({ hasText: 'gift note' })`)가 닫혀 있다 (`open` 이 false).
    - expect: summary 에 `gift note`, `축하 메시지 남기기`, `결제 없이 메시지만 전할 수 있어요.` 가 보인다.
  2. summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다. 메시지 폼 범위에서 `이름` 에 `테스트친구`, `메시지` 에 `생일 축하해! 항상 건강하세요` 를 입력합니다. (보낼 마음 입력은 이 폼에 없음)
    - expect: `details` 가 열린다 (`open` 이 true).
    - expect: `이름`(`#message-sender`)과 `메시지`(`#message-body`)에 입력값이 그대로 표시되고 버튼 `마음 보내기` 가 활성이다.
  3. 메시지 폼 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다. (토스트는 몇 초 뒤 사라지므로 DB 조회보다 먼저 확인)
    - expect: 토스트 `축하 메시지가 전해졌어요.` 가 표시되고 `data-type` 이 `success` 이다.
    - expect: 그 토스트 안에 버튼 `나도 만들기` 가 보인다 (클릭하지 않음).
    - expect: 계좌 모달(`role=dialog`)은 나타나지 않는다 (`getByRole('dialog')` count 0).
  4. URL 을 확인합니다. (`?sent=message` 는 클라이언트가 `router.replace` 로 지움)
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다 (`expect(page).toHaveURL(...)` 로 기다린 뒤 `new URL(page.url()).search` 가 빈 문자열).
    - expect: 페이지 본문 어디에도 방금 입력한 메시지 `생일 축하해! 항상 건강하세요` 가 표시되지 않는다 (축하 메시지는 공개 페이지에 노출되지 않음).
  5. [e2eDb 조회, 코드 근거] `messages` 를 `wishlistId = seed 의 wishlistId` 로 조회합니다. (`expect.poll` 로 행이 보일 때까지 대기)
    - expect: `messages` 행이 정확히 1개이다.
    - expect: 그 행의 `wishItemId` 가 `null` 이다 (메시지 전용 제출).
    - expect: 그 행의 `body` 가 `생일 축하해! 항상 건강하세요` 이고 `senderName` 이 `테스트친구` 이다.
    - expect: `funding_logs`(`wishItemId = items[0].id`)가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.

### 5. Whitespace Message

**Seed:** `tests/wishlist/seed.spec.ts`

#### 5.1. Whitespace Message Rejected

**File:** `tests/wishlist/message-whitespace-rejected.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 공백 메시지 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. summary `축하 메시지 남기기` 를 클릭해 폼을 엽니다.
    - expect: 메시지 폼 `details` 가 열리고 `메시지` 텍스트박스가 보인다.
  2. 메시지 폼 범위에서 `메시지` 에 공백 5칸(`'     '`)을 `fill` 하고 `이름` 은 비워 둡니다. `#message-body` 의 `validity` 를 확인합니다.
    - expect: `#message-body` 의 `validity.valueMissing` 이 false 이고 `validity.valid` 가 true 이다 (브라우저 `required` 는 공백만 있는 값을 통과시킴. 그래서 서버까지 제출된다).
  3. 메시지 폼 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    - expect: 토스트 `메시지를 입력해주세요.` 가 표시되고 `data-type` 이 `error` 이다.
    - expect: 성공 토스트 `축하 메시지가 전해졌어요.` 는 나타나지 않는다.
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
  4. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후(서버 액션이 끝난 뒤) `messages`(`wishlistId = seed 의 wishlistId`)와 `funding_logs`(`wishItemId = items[0].id`)를 조회합니다.
    - expect: `messages` 가 0행이다.
    - expect: `funding_logs` 가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.

### 6. Funding With Account

**Seed:** `tests/wishlist/seed.spec.ts`

#### 6.1. Funding With Account

**File:** `tests/wishlist/funding-with-account.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 후원 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목 `E2E 후원 위시리스트` 가 보일 때까지 대기합니다.
    - expect: 카드 `무선 이어폰`(`getByRole('article').filter({ hasText: '무선 이어폰' })`)에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보인다.
    - expect: 요약 `모인 마음` 이 `₩30,000`, `선물` 이 `1개` 이다.
    - expect: `계좌 안내` 섹션이 열려 있고 `김친구`, `E2E은행 123-456-789012` 가 보인다.
    - expect: `getByRole('dialog')` 가 0개이다.
  2. 카드 `무선 이어폰` 안의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    - expect: 카드 안에 소제목 `마음 보내기` 가 보인다.
    - expect: 스핀버튼 `보낼 마음`(`#participation-amount-<itemId>`, placeholder `10000`, min 1)과 텍스트박스 `이름`, `메시지` 가 보인다.
    - expect: 안내 문구 `여기서 결제가 되는 건 아니에요. 보내기를 누르면 송금할 계좌를 알려드려요.` 가 보인다.
    - expect: 카드 범위의 버튼 `마음 보내기` 가 활성이다.
  3. 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `후원친구`, `메시지` 에 `이어폰 사는 데 보태세요` 를 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트와 모달을 확인합니다.
    - expect: 토스트 `마음이 전해졌어요.`(`getByText('마음이 전해졌어요.', { exact: true })` 또는 `[data-sonner-toast]` 필터)가 표시되고 `data-type` 이 `success` 이다.
    - expect: 그 토스트에는 액션 버튼이 없다 (`나도 만들기` 버튼은 토스트가 아니라 모달 안 링크로만 나온다).
    - expect: `getByRole('dialog', { name: '마음이 전해졌어요' })` 가 보인다.
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다.
  4. 모달 범위(`dialog`)로 좁혀 내용을 확인합니다. (본문 `계좌 안내` 섹션에도 같은 계좌가 있으므로 반드시 `dialog` 안에서 찾기)
    - expect: dialog 안에 h2 `마음이 전해졌어요` 와 `아래 계좌로 보내주시면 전달이 완료돼요.` 가 보인다.
    - expect: dialog 안에 `예금주`, `김친구`, `E2E은행 123-456-789012` 가 보인다.
    - expect: dialog 안에 버튼 `계좌번호 복사`, 문구 `잘못 보냈다면 생일자에게 알려주세요.`, 링크 `나도 만들기`(href `/login?utm_source=post_participation&utm_medium=cta`, 클릭하지 않음), 버튼 `닫기` 가 보인다.
  5. 카드와 요약의 금액·진행률을 확인합니다. (페이지 캐시는 성공 제출에서 즉시 무효화됨)
    - expect: 카드 `무선 이어폰` 의 모인 금액이 `₩40,000` 으로 바뀌고(30,000 -> 40,000), `₩100,000 중`, `40% 달성` 이며 진행 막대 width 가 `40%` 이다.
    - expect: 상태 라벨은 `마음 모으는 중` 그대로이고 `이 선물에 마음 보태기` summary 도 계속 보인다 (아직 미달성).
    - expect: 요약 `모인 마음` 이 `₩40,000` 이다.
  6. dialog 의 버튼 `닫기` 를 클릭합니다.
    - expect: `getByRole('dialog')` 가 0개가 된다 (모달이 닫힘).
    - expect: URL 은 `/wishlist/${slug}` 그대로이고 카드 금액 `₩40,000` 도 그대로이다.
  7. [e2eDb 조회, 코드 근거] `funding_logs`(`wishItemId = items[0].id`), `messages`(`wishlistId = seed 의 wishlistId`), `wish_items`(`id = items[0].id`)를 조회합니다. (`expect.poll` 로 대기)
    - expect: `funding_logs` 가 정확히 1행이고 `amount` 가 `10000` 이다.
    - expect: `messages` 가 정확히 1행이고 `wishItemId` 가 `items[0].id` 이며 `senderName` 이 `후원친구`, `body` 가 `이어폰 사는 데 보태세요` 이다.
    - expect: `wish_items.funded_amount` 가 `40000` 이다.

### 7. Funding Without Account

**Seed:** `tests/wishlist/seed.spec.ts`

#### 7.1. Funding Without Account

**File:** `tests/wishlist/funding-without-account.spec.ts`

**Steps:**
  1. [사전 조건, 코드 근거] 탐색용 seed 에 계좌가 있어 이 시나리오는 실제로 제출해보지 못했고 `getPublicToastConfig` 의 `hasAccount === false` 분기에 근거합니다. `seedWishlist({ title: "E2E 계좌 없는 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ] })` 를 호출합니다 (`bankAccount` 생략). 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: `계좌 안내` 섹션(`gift account`)이 없다.
    - expect: 카드 `무선 이어폰` 에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보인다.
  2. 카드 `무선 이어폰` 의 summary `이 선물에 마음 보태기` 를 클릭합니다.
    - expect: 폼이 열리고 안내 문구가 `실제 선물 전달 방법은 생일자에게 직접 확인해주세요.` 이다 (계좌가 있을 때의 `여기서 결제가 되는 건 아니에요...` 문구가 아님. 코드 근거).
  3. 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `후원친구`, `메시지` 에 `계좌 없이 보태요` 를 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트와 모달 유무를 확인합니다.
    - expect: 토스트 `마음이 전해졌어요. 선물 전달 방법은 생일자에게 확인해주세요.`(전체 문구로 단언, 부분 일치 주의)가 표시되고 `data-type` 이 `success` 이다.
    - expect: 그 토스트 안에 액션 버튼 `나도 만들기` 가 보인다 (계좌가 없으면 모달 대신 토스트에 CTA 가 붙음. 클릭하지 않음).
    - expect: `getByRole('dialog')` 가 0개이다 (계좌 모달이 뜨지 않음).
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `sent`, `error` 쿼리가 없다.
  4. 카드의 금액·진행률을 확인합니다.
    - expect: 카드 `무선 이어폰` 이 `₩40,000`, `₩100,000 중`, `40% 달성` 으로 갱신된다.
    - expect: `계좌 안내` 섹션은 여전히 없다.
  5. [e2eDb 조회, 코드 근거] `funding_logs`(`wishItemId = items[0].id`)와 `wish_items`(`id = items[0].id`)를 조회합니다.
    - expect: `funding_logs` 가 정확히 1행이고 `amount` 가 `10000` 이다.
    - expect: `wish_items.funded_amount` 가 `40000` 이다.

### 8. Funding Invalid Amount

**Seed:** `tests/wishlist/seed.spec.ts`

#### 8.1. Funding Invalid Amount

**File:** `tests/wishlist/funding-invalid-amount.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 금액 오류 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. 카드 `무선 이어폰` 의 summary `이 선물에 마음 보태기` 를 클릭해 폼을 엽니다.
    - expect: 카드에 `₩30,000`, `₩100,000 중`, `30% 달성` 이 보이고 `보낼 마음` 스핀버튼이 보인다.
  2. 카드 범위에서 `보낼 마음` 에 `100000001`, `이름` 에 `큰손친구`, `메시지` 에 `너무 큰 금액` 을 입력하고 `보낼 마음` 의 `validity` 를 확인합니다.
    - expect: `보낼 마음` 의 `validity.valid` 가 true 이고 `rangeOverflow` 가 false 이며 `max` 속성이 비어 있다 (브라우저 검증을 통과해 서버까지 제출된다).
  3. 카드 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    - expect: 토스트 `금액은 1원부터 1억 원까지 입력할 수 있어요.` 가 표시되고 `data-type` 이 `error` 이다.
    - expect: 성공 토스트(`마음이 전해졌어요.`)는 나타나지 않는다.
    - expect: 계좌 모달(`role=dialog`)이 나타나지 않는다 (`getByRole('dialog')` count 0).
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
  4. 화면의 금액을 확인합니다.
    - expect: 카드 `무선 이어폰` 이 `₩30,000`, `₩100,000 중`, `30% 달성` 그대로이다 (진행 막대 width `30%`).
    - expect: 요약 `모인 마음` 이 `₩30,000` 그대로이다.
  5. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `wish_items`(`id = items[0].id`), `funding_logs`(`wishItemId = items[0].id`), `messages`(`wishlistId = seed 의 wishlistId`)를 조회합니다.
    - expect: `wish_items.funded_amount` 가 `30000` 그대로이다.
    - expect: `funding_logs` 가 0행이다.
    - expect: `messages` 가 0행이다 (금액 검증이 DB 쓰기보다 먼저라 메시지도 저장되지 않음).

### 9. Funding Paused Item

**Seed:** `tests/wishlist/seed.spec.ts`

#### 9.1. Funding Paused Item

**File:** `tests/wishlist/funding-paused-item.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 일시정지 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다.
    - expect: 카드 `무선 이어폰` 에 상태 라벨 `마음 모으는 중`, `₩30,000`, `30% 달성` 과 summary `이 선물에 마음 보태기` 가 보인다.
  2. 카드의 summary `이 선물에 마음 보태기` 를 클릭하고 카드 범위에서 `보낼 마음` 에 `10000`, `이름` 에 `늦은친구`, `메시지` 에 `멈춘 선물에 보태요` 를 입력합니다. **아직 제출하지 않습니다.**
    - expect: 입력값이 그대로 표시되고 버튼 `마음 보내기` 가 활성이다.
  3. [e2eDb 변경] 페이지를 연 채로 `e2eDb.update(wishItems).set({ status: "paused" }).where(eq(wishItems.id, items[0].id))` 로 그 소원을 `paused` 로 바꿉니다. (페이지는 이미 `open` 상태로 렌더링돼 있고 새로고침하지 않음)
    - expect: `wish_items.status` 가 `paused` 이다 (DB 조회로 확인).
    - expect: 화면의 폼은 변하지 않고 그대로 열려 있다.
  4. 카드 범위의 버튼 `마음 보내기` 를 클릭하고, **제출 직후** 토스트를 확인합니다.
    - expect: 토스트 `지금은 마음을 보탤 수 없는 선물이에요.` 가 표시되고 `data-type` 이 `error` 이다.
    - expect: 성공 토스트와 계좌 모달(`role=dialog`)이 나타나지 않는다.
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다 (`expect(page).toHaveURL(...)` 로 대기).
  5. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `wish_items`, `funding_logs`, `messages` 를 조회합니다. (`createPublicParticipation` 트랜잭션이 `status = 'open'` 조건 갱신에 실패하면 메시지·후원 기록 삽입을 롤백하고 `wish_not_open` 을 돌려줌. 탐색에서는 DB 를 볼 수 없어 코드 근거로만 작성)
    - expect: `wish_items.funded_amount` 가 `30000` 그대로이다.
    - expect: `funding_logs`(`wishItemId = items[0].id`)가 0행이다.
    - expect: `messages`(`wishlistId = seed 의 wishlistId`)가 0행이다 (롤백).

### 10. Submission Rate Limit

**Seed:** `tests/wishlist/seed.spec.ts`

#### 10.1. Submission Rate Limit

**File:** `tests/wishlist/submission-rate-limit.spec.ts`

**Steps:**
  1. [사전 조건] `seedWishlist({ title: "E2E 제출 제한 위시리스트", items: [ { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 } ], bankAccount: { bankName: "E2E은행", accountHolder: "김친구", accountNumber: "123-456-789012", visibility: "always_visible" } })` 를 호출하고, 새 페이지에서 `/wishlist/${slug}` 로 이동해 레벨 1 제목이 보일 때까지 대기합니다. 이 테스트는 같은 slug 로 6번 제출하며, 모든 제출은 한 페이지(같은 IP·User-Agent)에서 1분 안에 끝나야 합니다(탐색에서는 6번이 약 3초).
    - expect: 메시지 폼 `details`(`filter({ hasText: 'gift note' })`)가 닫혀 있고 `messages` 가 0행이다 (`expect.poll` 로 확인).
  2. i = 1 ~ 5 를 반복합니다. (a) summary `축하 메시지 남기기` 를 클릭해 폼을 열고 `open` 이 true 인지 확인, (b) 메시지 폼 범위에서 `이름` 에 `제한친구${i}`, `메시지` 에 `제한 테스트 메시지 ${i}` 입력, (c) 버튼 `마음 보내기` 클릭, (d) `expect.poll` 로 `messages`(`wishlistId`) 행 수가 정확히 `i` 가 될 때까지 대기, (e) 메시지 폼 `details` 의 `open` 이 false 로 돌아올 때까지 대기(제출 후 페이지가 다시 마운트돼 폼이 닫힘. 이 대기 없이 summary 를 다시 클릭하면 열린 폼이 닫혀 버림). 같은 URL 키(`?sent=message`)가 연속되어 토스트가 생략될 수 있다는 우려가 있어 토스트가 아니라 DB 행 수로 각 제출 완료를 판단합니다.
    - expect: 각 반복마다 `messages` 행 수가 `i` 이다 (1, 2, 3, 4, 5). 모든 행의 `wishItemId` 는 null 이다.
    - expect: 다섯 번째까지 같은 페이지에서 `client_request_conflict` 같은 오류 없이 모두 저장된다 (제출 후 재렌더링으로 폼마다 새 `clientRequestId` 가 생성됨).
    - expect: 다섯 번째 제출 뒤 `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.` 문구가 페이지에 없다 (`data-type="error"` 토스트 count 0).
  3. 6번째로 폼을 열고(`open` 이 false 로 돌아온 것을 확인한 뒤 summary 클릭) `이름` 에 `제한친구6`, `메시지` 에 `제한 테스트 메시지 6` (유효한 입력)을 입력하고 버튼 `마음 보내기` 를 클릭합니다. **제출 직후** 토스트를 확인합니다. (제한 검사가 입력 검증보다 먼저이므로 입력이 유효해도 이 제출이 거절됨)
    - expect: 토스트 `지금 이용자가 많아요. 잠시 후 다시 시도해주세요.` 가 표시되고 `data-type` 이 `error` 이다.
    - expect: 이 시점에 앞선 성공 토스트 `축하 메시지가 전해졌어요.` 가 누적돼 보일 수 있으므로 성공 토스트의 개수나 부재는 단언하지 않는다.
    - expect: URL 이 `/wishlist/${slug}` 로 정리되어 `error` 쿼리가 없다.
  4. [e2eDb 조회, 코드 근거] 오류 토스트가 보인 직후 `messages`(`wishlistId`), `funding_logs`(`wishItemId = items[0].id`), `wish_items`(`id = items[0].id`)를 조회합니다.
    - expect: `messages` 가 정확히 5행이다 (6번째 `제한 테스트 메시지 6` 은 저장되지 않음. body 목록이 `제한 테스트 메시지 1` ~ `5` 와 일치).
    - expect: `funding_logs` 가 0행이고 `wish_items.funded_amount` 가 `30000` 그대로이다.
