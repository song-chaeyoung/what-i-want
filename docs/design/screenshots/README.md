# 디자인 스크린샷

토큰을 옮기기 전과 후의 화면을 비교할 때 쓰는 기준 이미지예요. `pnpm screenshots`가 Playwright로 다시 찍습니다. 앱 동작 코드는 바꾸지 않아요.

## 파일명

`{화면}-{테마}-{폭}-{상태}.png`

- 테마가 없는 화면(랜딩, 관리자, 로그인 등)은 테마 자리에 `default`
- 상태가 하나뿐이면 `default`
- 폭은 `375`(모바일)와 `1280`(데스크톱)
- 예: `wishlist-pixel_y2k-375-empty.png`

## 고정 시각

기준 시각은 **2026-06-15 12:00:00 KST** (`2026-06-15T03:00:00.000Z`)예요. 촬영일이 달라도 같은 날을 보도록 맞춥니다.

| 구분 | 생일 | 배지 |
| --- | --- | --- |
| 생일 전 | `1996-06-20` | 6월 20일 · D-5 |
| 생일 당일 | `1996-06-15` | 6월 15일 · D-DAY |
| 생일 이후 | `1996-06-10` | 6월 10일 · D-360 |

생일 연도는 1996년이라 만 14세 제한에 걸리지 않아요. D-day는 월·일만 보고, 2월 29일이 아닌 날짜라 윤년 보정도 없어요.

시계는 두 곳에서 멈춰요.

- 브라우저: Playwright `page.clock.setFixedTime`. `Date.now()`와 `new Date()`가 2026-06-15 12:00:00 KST에 고정돼요. 온보딩 달력의 "오늘"처럼 클라이언트 `Date`만 여기 영향을 받아요.
- 서버: 캡처용 dev 서버만 `NODE_OPTIONS=--require ./scripts/screenshot-freeze-clock.cjs`로 `Date`를 같은 시각에 고정해요. 공개 위시리스트 생일 배지, 샘플 페이지 배지, 관리자 생일 축하 배너, 푸터 연도, 설정의 만 14세 `max`는 서버 `new Date()`라 브라우저 시계만으로는 바뀌지 않아요.

한계:

- Postgres `now()`는 멈추지 않아요. 시드는 `created_at` / `updated_at`을 `2026-06-01T03:00:00.000Z` 같은 절대 시각으로 넣어요.
- 프리로드 없이 `pnpm dev`를 띄우면 서버 배지는 실제 시각을 따라가요. `pnpm screenshots`는 항상 프리로드를 넣어요.
- 생일 콘페티는 `Math.random()`이라 픽셀이 달라져요. 캡처는 reduced motion과 `localStorage`로 콘페티를 끄고, 축하 문구만 남겨요.
- `fullPage` 합성 때 sticky 헤더가 반복되지 않도록 캡처 CSS에서 sticky를 static으로 덮어요. Next.js 개발 인디케이터(`nextjs-portal`)도 가려요.
- 애니메이션과 캐럿은 꺼 둡니다.
- 한글 본문은 Geist에 글리프가 없어 OS 산세리프로 대체돼요. 저장소에 들어 있는 이미지는 NanumGothic이 있는 Linux에서 찍었어요. 폰트가 다른 환경에서 다시 찍으면 자형이 달라질 수 있어요.

## 다시 찍는 방법

로컬 Postgres만 사용해요. 시드는 `@screenshots.local` 계정과 그 계정의 위시리스트, 시드가 소유한 `shot-*` 슬러그를 지우고 다시 넣어요. 데이터베이스 호스트가 localhost가 아니면 중단합니다.

```bash
# 1. Postgres. 역할과 DB 이름은 .env.example 과 같아요.
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE mwagotgo OWNER postgres;"

# 2. 의존성, Chromium
pnpm install
pnpm exec playwright install chromium

# 3. 마이그레이션. 이미 설정된 환경 변수가 .env.local 보다 우선해요.
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/mwagotgo" \
DATABASE_DIRECT_URL="postgres://postgres:postgres@127.0.0.1:5432/mwagotgo" \
pnpm db:migrate

# 4. 시드. pnpm screenshots 의 globalSetup 도 같은 시드를 다시 실행해요.
pnpm db:seed:screenshots

# 5. 캡처. 포트 3210. 기존 E2E(포트 3200)와 설정 파일이 달라요.
pnpm screenshots
```

Node.js 22 이상이 필요해요. 시드 스크립트는 TypeScript를 그대로 실행합니다.

### 환경 변수

`pnpm screenshots`가 dev 서버에 넣는 값이에요. 로컬 캡처 전용 더미이고 운영에 쓰지 않아요. `.env.example`의 키를 따르며, 비어 있으면 화면이 갈리는 값만 더미로 채워요.

| 변수 | 값 |
| --- | --- |
| `DATABASE_URL` / `DATABASE_DIRECT_URL` | `postgres://postgres:postgres@127.0.0.1:5432/mwagotgo` (환경 변수가 로컬 주소면 그 값을 사용) |
| `AUTH_SECRET` | `screenshot-auth-secret-do-not-use-in-prod` |
| `AUTH_URL` | `http://localhost:3210` |
| `ACCOUNT_ENCRYPTION_SECRET` | `screenshot-account-encryption-secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | `screenshot-google-id` / `screenshot-google-secret` |
| `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` | `screenshot-kakao-id` / `screenshot-kakao-secret` |
| `LEGAL_OPERATOR_NAME` | `뭐갖고싶어` |
| `LEGAL_OPERATOR_CONTACT` | `privacy@example.test` (비우면 개발 모드에서 `[문의 이메일 주소]`가 보여서 더미를 넣음) |
| `SUPPORT_URL` | 빈 문자열 (후원하기 링크를 숨김) |
| `TZ` | `UTC` |

세션은 OAuth를 타지 않아요. 시드가 `sessions.session_token`을 넣고, Playwright가 `http://localhost`용 쿠키 `authjs.session-token`에 그 토큰을 넣어요. database strategy라 쿠키 값은 토큰 그대로이고, HTTPS가 아니라 `__Secure-` 접두사는 붙지 않아요. `auth.ts`는 수정하지 않아요.

관리자 첫 진입 가이드는 `localStorage` 키 `mwagotgo:admin-guide-seen`로 닫아 두고, `guide` 상태만 `/admin?guide=1`로 열어요.

`pnpm test:e2e`는 `playwright.config.ts`만 보고 `tests/screenshots`를 무시해요. 캡처는 `playwright.screenshots.config.ts`와 `pnpm screenshots`만 사용합니다.

## 시드 계정

계좌를 넣는 사용자는 번호 `3333-12-1234567`, 은행 카카오뱅크, 공개 범위 `always_visible`이에요. 빈 위시리스트에는 계좌가 없어요. 선물 이미지는 모두 없어요.

메시지 20개 이상은 관리자 계정에만 있어요. 공개 페이지는 받은 메시지 목록을 렌더하지 않아서, 0개와 22개의 차이는 관리자 메시지함 스크린샷으로 봐요. `messages-none` 공개 페이지는 선물이 있고 메시지가 0인 데이터예요.

| 이메일 | 세션 토큰 | 슬러그 | 테마 | 생일 | 선물 | 메시지 | 역할 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `admin@screenshots.local` | `screenshot-admin-session` | `shot-admin` | pixel_y2k | 1996-06-15 | 6 | 23 | 관리자 화면. 생일 당일, 상태·진행률이 섞인 선물, 메시지 22개와 숨긴 메시지 1개 |
| `onboarding@screenshots.local` | `screenshot-onboarding-session` | `—` | — | — | 0 | 0 | 온보딩 미완료 테스트 유저 |
| `shot-y2k-empty@screenshots.local` | `screenshot-empty-session` | `shot-y2k-empty` | pixel_y2k | — | 0 | 0 | 공개 위시리스트 pixel_y2k / empty |
| `shot-y2k-mixed@screenshots.local` | `—` | `shot-y2k-mixed` | pixel_y2k | — | 6 | 0 | 공개 위시리스트 pixel_y2k / mixed |
| `shot-y2k-before@screenshots.local` | `—` | `shot-y2k-before` | pixel_y2k | 1996-06-20 | 1 | 0 | 공개 위시리스트 pixel_y2k / birthday-before |
| `shot-y2k-today@screenshots.local` | `—` | `shot-y2k-today` | pixel_y2k | 1996-06-15 | 1 | 0 | 공개 위시리스트 pixel_y2k / birthday-today |
| `shot-y2k-after@screenshots.local` | `—` | `shot-y2k-after` | pixel_y2k | 1996-06-10 | 1 | 0 | 공개 위시리스트 pixel_y2k / birthday-after |
| `shot-y2k-quiet@screenshots.local` | `screenshot-quiet-session` | `shot-y2k-quiet` | pixel_y2k | — | 1 | 0 | 공개 위시리스트 pixel_y2k / messages-none |
| `shot-mono-empty@screenshots.local` | `—` | `shot-mono-empty` | mono_bw | — | 0 | 0 | 공개 위시리스트 mono_bw / empty |
| `shot-mono-mixed@screenshots.local` | `—` | `shot-mono-mixed` | mono_bw | — | 6 | 0 | 공개 위시리스트 mono_bw / mixed |
| `shot-mono-before@screenshots.local` | `—` | `shot-mono-before` | mono_bw | 1996-06-20 | 1 | 0 | 공개 위시리스트 mono_bw / birthday-before |
| `shot-mono-today@screenshots.local` | `—` | `shot-mono-today` | mono_bw | 1996-06-15 | 1 | 0 | 공개 위시리스트 mono_bw / birthday-today |
| `shot-mono-after@screenshots.local` | `—` | `shot-mono-after` | mono_bw | 1996-06-10 | 1 | 0 | 공개 위시리스트 mono_bw / birthday-after |
| `shot-mono-quiet@screenshots.local` | `—` | `shot-mono-quiet` | mono_bw | — | 1 | 0 | 공개 위시리스트 mono_bw / messages-none |
| `shot-pastel-empty@screenshots.local` | `—` | `shot-pastel-empty` | soft_pastel | — | 0 | 0 | 공개 위시리스트 soft_pastel / empty |
| `shot-pastel-mixed@screenshots.local` | `—` | `shot-pastel-mixed` | soft_pastel | — | 6 | 0 | 공개 위시리스트 soft_pastel / mixed |
| `shot-pastel-before@screenshots.local` | `—` | `shot-pastel-before` | soft_pastel | 1996-06-20 | 1 | 0 | 공개 위시리스트 soft_pastel / birthday-before |
| `shot-pastel-today@screenshots.local` | `—` | `shot-pastel-today` | soft_pastel | 1996-06-15 | 1 | 0 | 공개 위시리스트 soft_pastel / birthday-today |
| `shot-pastel-after@screenshots.local` | `—` | `shot-pastel-after` | soft_pastel | 1996-06-10 | 1 | 0 | 공개 위시리스트 soft_pastel / birthday-after |
| `shot-pastel-quiet@screenshots.local` | `—` | `shot-pastel-quiet` | soft_pastel | — | 1 | 0 | 공개 위시리스트 soft_pastel / messages-none |

## 화면 목록

| 화면 | 테마 | 상태 | 라우트 | 설명 | 파일 |
| --- | --- | --- | --- | --- | --- |
| admin | default | empty | `/admin` | 선물이 없는 위시리스트의 대시보드. | `admin-default-1280-empty.png`<br>`admin-default-375-empty.png` |
| admin-messages | default | empty | `/admin/messages` | 선물은 있고 메시지는 0개인 메시지함. | `admin-messages-default-1280-empty.png`<br>`admin-messages-default-375-empty.png` |
| admin-wishes | default | empty | `/admin/wishes` | 선물이 없을 때 추가 폼이 펼쳐진 선물 관리. | `admin-wishes-default-1280-empty.png`<br>`admin-wishes-default-375-empty.png` |
| landing | default | default | `/` | 비로그인 랜딩. | `landing-default-1280-default.png`<br>`landing-default-375-default.png` |
| landing | default | onboarding | `/` | 온보딩 미완료 세션의 랜딩 CTA. | `landing-default-1280-onboarding.png`<br>`landing-default-375-onboarding.png` |
| login | default | default | `/login` | 소셜 로그인 화면. OAuth는 호출하지 않는다. | `login-default-1280-default.png`<br>`login-default-375-default.png` |
| login | default | notice | `/login?notice=under_minimum_age` | 만 14세 미만으로 로그인 정보가 삭제된 뒤의 안내. | `login-default-1280-notice.png`<br>`login-default-375-notice.png` |
| not-found | default | default | `/screenshot-missing-route` | 루트 not-found. | `not-found-default-1280-default.png`<br>`not-found-default-375-default.png` |
| onboarding | default | default | `/onboarding` | 세션은 있고 온보딩은 끝나지 않은 화면. 달력의 오늘은 브라우저 시계를 따른다. | `onboarding-default-1280-default.png`<br>`onboarding-default-375-default.png` |
| privacy | default | default | `/privacy` | 개인정보 처리방침. | `privacy-default-1280-default.png`<br>`privacy-default-375-default.png` |
| sample | mono_bw | default | `/sample?theme=mono_bw` | DB 없이 렌더되는 샘플. 생일 배지(5월 15일)는 서버 시각이 고정돼 있어야 D-334다. | `sample-mono_bw-1280-default.png`<br>`sample-mono_bw-375-default.png` |
| sample | pixel_y2k | default | `/sample?theme=pixel_y2k` | DB 없이 렌더되는 샘플. 생일 배지(5월 15일)는 서버 시각이 고정돼 있어야 D-334다. | `sample-pixel_y2k-1280-default.png`<br>`sample-pixel_y2k-375-default.png` |
| sample | soft_pastel | default | `/sample?theme=soft_pastel` | DB 없이 렌더되는 샘플. 생일 배지(5월 15일)는 서버 시각이 고정돼 있어야 D-334다. | `sample-soft_pastel-1280-default.png`<br>`sample-soft_pastel-375-default.png` |
| terms | default | default | `/terms` | 이용약관. 운영자 이름은 LEGAL_OPERATOR_NAME. | `terms-default-1280-default.png`<br>`terms-default-375-default.png` |
| wishlist | mono_bw | birthday-after | `/wishlist/shot-mono-after` | 고정 시각 기준 생일이 지난 뒤(다음 생일 D-360). 선물 1개. | `wishlist-mono_bw-1280-birthday-after.png`<br>`wishlist-mono_bw-375-birthday-after.png` |
| wishlist | mono_bw | birthday-before | `/wishlist/shot-mono-before` | 고정 시각 기준 생일 D-5. 선물 1개. | `wishlist-mono_bw-1280-birthday-before.png`<br>`wishlist-mono_bw-375-birthday-before.png` |
| wishlist | mono_bw | birthday-today | `/wishlist/shot-mono-today` | 고정 시각 기준 생일 당일(D-DAY). 선물 1개. | `wishlist-mono_bw-1280-birthday-today.png`<br>`wishlist-mono_bw-375-birthday-today.png` |
| wishlist | mono_bw | empty | `/wishlist/shot-mono-empty` | 선물이 없는 공개 위시리스트. 계좌 안내 없음. | `wishlist-mono_bw-1280-empty.png`<br>`wishlist-mono_bw-375-empty.png` |
| wishlist | mono_bw | messages-none | `/wishlist/shot-mono-quiet` | 선물은 있고 메시지는 0개. 공개 페이지는 받은 메시지 목록을 그리지 않는다. | `wishlist-mono_bw-1280-messages-none.png`<br>`wishlist-mono_bw-375-messages-none.png` |
| wishlist | mono_bw | mixed | `/wishlist/shot-mono-mixed` | open·fulfilled·paused·hidden(숨김은 공개 페이지에서 제외), 진행률 0·50·100, 긴 이름, 이미지 없음, 상품 링크 1개. | `wishlist-mono_bw-1280-mixed.png`<br>`wishlist-mono_bw-375-mixed.png` |
| wishlist-not-found | default | default | `/wishlist/shot-missing` | 없는 공개 슬러그. 시드하지 않는다. | `wishlist-not-found-default-1280-default.png`<br>`wishlist-not-found-default-375-default.png` |
| wishlist | pixel_y2k | birthday-after | `/wishlist/shot-y2k-after` | 고정 시각 기준 생일이 지난 뒤(다음 생일 D-360). 선물 1개. | `wishlist-pixel_y2k-1280-birthday-after.png`<br>`wishlist-pixel_y2k-375-birthday-after.png` |
| wishlist | pixel_y2k | birthday-before | `/wishlist/shot-y2k-before` | 고정 시각 기준 생일 D-5. 선물 1개. | `wishlist-pixel_y2k-1280-birthday-before.png`<br>`wishlist-pixel_y2k-375-birthday-before.png` |
| wishlist | pixel_y2k | birthday-today | `/wishlist/shot-y2k-today` | 고정 시각 기준 생일 당일(D-DAY). 선물 1개. | `wishlist-pixel_y2k-1280-birthday-today.png`<br>`wishlist-pixel_y2k-375-birthday-today.png` |
| wishlist | pixel_y2k | empty | `/wishlist/shot-y2k-empty` | 선물이 없는 공개 위시리스트. 계좌 안내 없음. | `wishlist-pixel_y2k-1280-empty.png`<br>`wishlist-pixel_y2k-375-empty.png` |
| wishlist | pixel_y2k | messages-none | `/wishlist/shot-y2k-quiet` | 선물은 있고 메시지는 0개. 공개 페이지는 받은 메시지 목록을 그리지 않는다. | `wishlist-pixel_y2k-1280-messages-none.png`<br>`wishlist-pixel_y2k-375-messages-none.png` |
| wishlist | pixel_y2k | mixed | `/wishlist/shot-y2k-mixed` | open·fulfilled·paused·hidden(숨김은 공개 페이지에서 제외), 진행률 0·50·100, 긴 이름, 이미지 없음, 상품 링크 1개. | `wishlist-pixel_y2k-1280-mixed.png`<br>`wishlist-pixel_y2k-375-mixed.png` |
| wishlist | soft_pastel | birthday-after | `/wishlist/shot-pastel-after` | 고정 시각 기준 생일이 지난 뒤(다음 생일 D-360). 선물 1개. | `wishlist-soft_pastel-1280-birthday-after.png`<br>`wishlist-soft_pastel-375-birthday-after.png` |
| wishlist | soft_pastel | birthday-before | `/wishlist/shot-pastel-before` | 고정 시각 기준 생일 D-5. 선물 1개. | `wishlist-soft_pastel-1280-birthday-before.png`<br>`wishlist-soft_pastel-375-birthday-before.png` |
| wishlist | soft_pastel | birthday-today | `/wishlist/shot-pastel-today` | 고정 시각 기준 생일 당일(D-DAY). 선물 1개. | `wishlist-soft_pastel-1280-birthday-today.png`<br>`wishlist-soft_pastel-375-birthday-today.png` |
| wishlist | soft_pastel | empty | `/wishlist/shot-pastel-empty` | 선물이 없는 공개 위시리스트. 계좌 안내 없음. | `wishlist-soft_pastel-1280-empty.png`<br>`wishlist-soft_pastel-375-empty.png` |
| wishlist | soft_pastel | messages-none | `/wishlist/shot-pastel-quiet` | 선물은 있고 메시지는 0개. 공개 페이지는 받은 메시지 목록을 그리지 않는다. | `wishlist-soft_pastel-1280-messages-none.png`<br>`wishlist-soft_pastel-375-messages-none.png` |
| wishlist | soft_pastel | mixed | `/wishlist/shot-pastel-mixed` | open·fulfilled·paused·hidden(숨김은 공개 페이지에서 제외), 진행률 0·50·100, 긴 이름, 이미지 없음, 상품 링크 1개. | `wishlist-soft_pastel-1280-mixed.png`<br>`wishlist-soft_pastel-375-mixed.png` |
| admin | default | default | `/admin` | 관리자 대시보드. 고정 시각이 생일이라 축하 배너가 보이고, 안 읽은 메시지는 22개다. | `admin-default-1280-default.png`<br>`admin-default-375-default.png` |
| admin | default | guide | `/admin?guide=1` | 첫 진입 사용 가이드 다이얼로그. | `admin-default-1280-guide.png`<br>`admin-default-375-guide.png` |
| admin-messages | default | hidden | `/admin/messages?filter=hidden` | 숨긴 메시지 1개. 받은 메시지 화면보다 먼저 찍어 읽음 처리 전의 뱃지를 유지한다. | `admin-messages-default-1280-hidden.png`<br>`admin-messages-default-375-hidden.png` |
| admin-settings | default | default | `/admin/settings` | 설정. 생일 입력값은 고정 시각의 당일 생일. | `admin-settings-default-1280-default.png`<br>`admin-settings-default-375-default.png` |
| admin-wishes | default | mixed | `/admin/wishes` | 선물 관리. open·fulfilled·paused·hidden과 진행률 0·50·100, 긴 이름, 이미지 없음. | `admin-wishes-default-1280-mixed.png`<br>`admin-wishes-default-375-mixed.png` |
| landing | default | signed-in | `/` | 온보딩을 마친 관리자 세션의 랜딩 CTA. | `landing-default-1280-signed-in.png`<br>`landing-default-375-signed-in.png` |
| admin-messages | default | many | `/admin/messages` | 받은 메시지 22개. 긴 메시지, 익명, 금액 없음, 선물 없는 메시지를 포함한다. 이 화면은 읽음 처리되므로 관리자 세션 캡처의 마지막이다. | `admin-messages-default-1280-many.png`<br>`admin-messages-default-375-many.png` |

## 찍지 않은 화면

운영 코드를 바꾸지 않고는 아래 에러 바운더리를 안정적으로 열 수 없어요. 라우트로 노출되지 않습니다.

- `app/error.tsx`
- `app/admin/error.tsx`
- `app/wishlist/[slug]/error.tsx`

로딩 화면(`app/loading.tsx`, `app/admin/loading.tsx`, `app/wishlist/[slug]/loading.tsx`)은 요청마다 잠깐 지나가는 상태라 기준 이미지에서 뺐어요.
