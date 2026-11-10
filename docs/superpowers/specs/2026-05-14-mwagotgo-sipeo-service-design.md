# 뭐갖고싶어 서비스 설계 v0.1

작성일: 2026-05-14
최종 코드 대조일: 2026-10-30
추가 코드 대조일: 2026-11-04 (홈 카피·CTA·상태 표시만)

이 문서는 최초 서비스 설계의 의도와 현재 구현을 구분해 기록합니다. `현재 구현`은 2026-10-30의 전체 코드 대조와 위 범위의 추가 정적 대조를 기준으로 하며, 실환경 동작이나 테스트 통과를 새로 확인했다는 뜻은 아닙니다. `초기 설계`와 `미구현` 항목은 현행 기능 또는 확정된 후속 작업으로 간주하지 않습니다. 현재 데이터 필드와 동작의 근거는 각 절의 상대 링크를 따릅니다.

## 1. 설계 목적

`뭐갖고싶어`는 생일자가 받고 싶은 선물을 위시리스트로 만들고, 친구들이 공개 링크로 들어와 선물과 계좌 안내를 확인한 뒤 비공개 메시지를 남길 수 있는 생일 위시리스트 서비스입니다.

이 문서는 기존 개인용 생일 위시리스트 프로젝트를 기반으로, 결제 기능 없이도 실제 서비스로 운영 가능한 구조를 정의합니다. 목표는 빠른 임시 MVP가 아니라, 향후 결제, 알림, 모바일 앱, 외부 API로 확장할 수 있는 제품 골격을 잡는 것입니다.

## 2. 근거

- 최초 설계는 Next.js 기반 개인 생일 위시리스트 앱의 정적 데이터, 공개 페이지, 메시지 폼, 계좌 안내, OG 이미지 원형을 근거로 했습니다.
- 당시 참고 배포본에는 선물 카드, 진행률, 상품 링크, 계좌 복사, 비공개 메시지 작성, `내 페이지도 만들기` CTA가 있었습니다. 아래 외부 링크는 당시 참고 자료이며 이번 갱신에서 배포 상태를 재검증하지 않았습니다.
- Next.js는 Route Handler, Server Action, 서버 컴포넌트를 통해 웹 프론트와 BFF 역할을 함께 수행할 수 있습니다.
- Auth.js는 Google, Kakao OAuth provider와 Drizzle Adapter를 공식 지원합니다.
- DB 호스팅은 Neon Postgres를 기본 선택으로 두되, 서비스 코드를 특정 BaaS SDK에 강하게 묶는 것은 장기 확장성 측면에서 피해야 합니다.
- 현재 저장소는 인증·온보딩·관리자·공개 참여·DB 저장 구조를 갖고 있습니다. 근거: [의존성](../../../package.json), [인증](../../../auth.ts), [서비스 schema](../../../src/lib/db/schema/service.ts), [공개 화면](../../../components/public-wishlist-view.tsx).

참고:

- GitHub: https://github.com/song-chaeyoung/birthday-wishlist
- 배포본: https://birthday-wishlist-xi.vercel.app/
- Next.js Backend for Frontend: https://nextjs.org/docs/app/guides/backend-for-frontend
- Auth.js Kakao Provider: https://authjs.dev/getting-started/providers/kakao
- Auth.js Drizzle Adapter: https://authjs.dev/getting-started/adapters/drizzle

## 3. 제품 범위

### 3.1 현재 구현에 포함된 범위

- 랜딩 페이지
- Google/Kakao 로그인
- 신규 사용자 온보딩
- 생일자 어드민 대시보드
- 선물 등록, 수정, 삭제, 상태 관리
- 계좌 정보 등록·수정과 계좌 공개 선택(`공개 페이지에 보이기`는 `copy_only`, `숨기기`는 `hidden`)
- 공개 위시리스트 페이지
- 친구의 비공개 메시지 작성
- 생일자의 메시지함
- 친구가 입력한 참여 금액과 메시지 저장, 로그와 진행률 반영
- 참여 기록 숨김·복구에 따른 모인 금액 조정
- 개인별 OG 이미지
- 기본 서비스 OG 이미지

근거: [관리자 선물](../../../app/admin/wishes/page.tsx), [설정](../../../app/admin/settings/page.tsx), [설정 저장](../../../src/lib/settings/service.ts), [공개 참여 저장](../../../src/lib/public-participation/repository.ts), [참여 숨김·복구](../../../src/lib/admin-messages/repository.ts), [개인별 OG](../../../app/wishlist/[slug]/opengraph-image.tsx), [기본 OG](../../../app/opengraph-image.tsx).

초기 설계의 관리자 수동 금액 입력과 OG 선택 테마 반영은 현재 구현된 기능과 구분합니다. 계좌 공개는 설정의 `계좌 공개`에서 보이기(`copy_only`)와 숨기기(`hidden`)를 고릅니다. 아래 해당 절에 차이를 기록하며, 이번 문서 갱신에서 구현 여부나 우선순위를 새로 정하지 않습니다.

### 3.2 제외 범위

- 실제 결제
- 자동 정산
- 친구 회원가입
- 배송지 관리
- 알림톡, 문자, 이메일 알림
- AI 선물 추천
- 복잡한 테마 마켓

이 제외 범위는 기능 포기가 아니라 1차 서비스 골격에서 제외한다는 의미입니다. 도메인 구조는 이후 확장을 막지 않도록 설계합니다.

## 4. 핵심 사용자

### 4.1 생일자

생일자는 Google 또는 Kakao로 로그인하고 온보딩을 완료한 뒤, 자신의 공개 위시리스트를 만들고 관리합니다.

주요 행동:

- 로그인
- 온보딩
- 서버가 생성한 공개 URL 확인, 설정에서 slug 수정
- 선물 등록과 관리
- 계좌 정보 등록
- 공개 링크 공유
- 메시지 확인
- 참여 기록 숨김·복구로 모인 금액 조정

근거: [온보딩](../../../src/lib/onboarding/service.ts), [설정](../../../app/admin/settings/page.tsx), [메시지함](../../../app/admin/messages/page.tsx).

### 4.2 친구 방문자

친구 방문자는 로그인하지 않습니다. 공유 링크로 들어와 선물을 확인하고, 상품 링크 또는 계좌 정보를 확인한 뒤 비공개 메시지를 남깁니다.

주요 행동:

- 공개 위시리스트 확인
- 선물 카드 확인
- 상품 링크 열기
- 계좌 정보 확인 또는 복사
- 비공개 메시지만 작성하거나 선물별 금액과 메시지 작성
- `나도 만들기` CTA 클릭

## 5. 아키텍처 방향

### 5.1 선택한 구조

현재 구조는 `단일 Next.js repo 기반 모듈러 모놀리스`입니다.

물리적 배포와 Git 저장소는 하나로 시작합니다. 코드 구조는 참고 프로젝트 `song-chaeyoung/birthday-wishlist`의 `app/api/**`와 `src/lib/**` 패턴을 따릅니다. 웹 UI는 `app/**`, HTTP 진입점은 `app/api/**`, 도메인 규칙과 DB 접근은 `src/lib/**`에 둡니다. 이렇게 하면 초반 배포와 운영 복잡도를 낮추면서도, 나중에 API 서버나 모바일 앱이 필요해질 때 각각 별도 Git repo로 분리할 수 있습니다.

### 5.2 현재 단일 repo 구조

```text
app/
  page.tsx
  layout.tsx
  login/
  onboarding/
  admin/
  wishlist/[slug]/
  sample/
  api/
    auth/[...nextauth]/route.ts
    onboarding/route.ts

components/
  ui/
  public-wishlist-view.tsx

src/
  lib/
    wishlist/
    wish-item/
    onboarding/
    public-participation/
    public-wishlist/
    auth/
    db/
      schema/
      migrations/

public/
docs/
```

현재 프로젝트는 루트에 `app/`, `public/`, `package.json`이 있는 단일 Next 앱입니다. 위 트리는 주요 경계의 요약이며 전체 파일 목록은 아닙니다. `apps/`, `packages/` 분리를 먼저 만들지 않는 것은 기존 설계 방향입니다. 근거: [package.json](../../../package.json), [공개 참여 Action](../../../app/wishlist/[slug]/actions.ts), [공개 참여 API](../../../app/api/public/wishlists/[slug]/participation/route.ts).

향후 분리 원칙:

- 웹 서비스는 현재 repo에 남깁니다.
- 별도 API 서버가 필요해지면 monorepo 하위 앱이 아니라 새 Git repo로 만듭니다.
- 모바일 앱이 필요해지면 새 Git repo로 만듭니다.
- 공통 로직 공유가 필요해지는 시점에는 npm package, private package, 또는 명시적인 복사 전략을 별도 결정합니다.

### 5.3 요청 흐름

```text
UI
→ Server Action 또는 Route Handler
→ Application Service
→ Repository Interface
→ Postgres Repository 구현체
→ Postgres
```

UI는 DB 클라이언트를 직접 알지 않습니다. Application Service는 Supabase, Neon, Vercel Postgres 같은 호스팅 사업자를 알지 않습니다. Repository 구현체만 실제 DB 접근 방식을 압니다.

위 흐름은 책임 분리 의도입니다. 현재 공개 참여 폼은 Server Action을 호출하고, 별도 참여 Route Handler도 같은 서비스를 사용합니다. 관리자 선물·설정과 온보딩은 네이티브 POST 폼을 Route Handler로 제출합니다. 로그인 OAuth 시작도 별도 Server Action을 사용하므로 모든 mutation이 `app/api/**` 폼 제출인 것은 아닙니다. 근거: [공개 화면](../../../components/public-wishlist-view.tsx), [공개 Action](../../../app/wishlist/[slug]/actions.ts), [관리자 선물](../../../app/admin/wishes/page.tsx), [설정](../../../app/admin/settings/page.tsx), [온보딩](../../../app/onboarding/page.tsx), [로그인 Action](../../../app/login/actions.ts).

## 6. 인증과 온보딩

### 6.1 인증 방식

현재 인증은 Auth.js 기반 OAuth와 Drizzle Adapter, DB 세션을 사용합니다. 근거: [auth.ts](../../../auth.ts).

지원 provider:

- Google
- Kakao

비밀번호 로그인은 1차 범위에서 제외합니다. 직접 비밀번호 로그인을 만들면 비밀번호 저장, 재설정, 계정 복구, 이메일 인증, 공격 대응까지 직접 운영해야 하기 때문입니다.

### 6.2 사용자 식별 원칙

로그인 식별자, 내부 식별자, 공개 식별자를 분리합니다.

```text
로그인 식별자: OAuth provider account
내부 PK: users.id UUID
공개 식별자: wishlists.slug
화면 이름: profiles.display_name
공개 페이지 제목: wishlists.title
```

닉네임이나 slug는 PK로 쓰지 않습니다. slug는 변경 가능성이 있고, 닉네임은 중복 정책과 변경 정책이 생길 수 있기 때문입니다.

### 6.3 신규 사용자 흐름

```text
1. 사용자가 Google 또는 Kakao 로그인
2. Auth.js가 user/account/session 생성
3. 서버에서 profile과 기본 wishlist 존재 여부 확인
4. 온보딩 미완료 상태면 /onboarding으로 이동
5. 사용자가 표시 이름, 생일(선택), 소개, 만 14세 이상 확인 입력
6. 서버가 slug, 기본 제목, pixel_y2k 테마의 공개 wishlist 생성
7. /admin으로 이동하고 첫 진입 안내 표시
```

현재 온보딩에는 slug·계좌·테마 선택 입력이 없습니다. 생일은 출생연도를 포함한 `YYYY-MM-DD`이며 빈 값은 허용합니다. 입력한 생일은 실제 날짜·KST 기준 미래 날짜·최소 가입 연령을 서버에서 검사합니다. 만 14세 미만으로 판정되면 온보딩 미완료 계정을 삭제하고 로그인 화면에 안내합니다. 기존 완료 회원의 생일 수정은 저장 거절로 처리합니다. 이는 현재 코드 설명이며 법적 적합성 검증을 뜻하지 않습니다. 근거: [온보딩 폼](../../../app/onboarding/page.tsx), [온보딩 서비스](../../../src/lib/onboarding/service.ts), [나이 검사](../../../src/lib/onboarding/age.ts), [계정 삭제 보호](../../../src/lib/onboarding/repository.ts), [설정 검증](../../../src/lib/settings/service.ts).

### 6.4 기존 사용자 흐름

```text
1. 사용자가 로그인
2. 세션 확인
3. 온보딩 완료 상태 확인
4. /admin으로 이동
```

### 6.5 친구 방문자 흐름

```text
1. /wishlist/[slug] 접속
2. 공개 위시리스트 조회
3. 선물과 계좌 안내 확인
4. 이름(선택)과 메시지 입력, 선물에 참여할 때 금액 입력
5. 메시지 저장 또는 메시지·참여 로그·모인 금액을 함께 반영
6. 금액 참여 성공 시 등록 계좌 안내, 실제 송금은 서비스 밖에서 진행
```

친구 방문자는 로그인하지 않습니다. 이 원칙은 공유 서비스의 가벼움을 유지하기 위한 핵심 정책입니다.

참여 금액은 실제 입금 확인액이 아닙니다. 현재 시스템은 송금 확인 전에 입력된 참여 금액을 진행률에 반영합니다. 근거: [참여 서비스](../../../src/lib/public-participation/service.ts), [참여 저장](../../../src/lib/public-participation/repository.ts), [공개 피드백](../../../components/public-wishlist-toast-events.tsx).

## 7. 도메인 모델

### 7.1 User

OAuth 인증을 통해 생성되는 내부 사용자입니다.

현재 주요 DB 필드(전체 schema가 아닌 요약):

```text
id
name
email
email_verified
image
```

Provider 계정 정보는 Auth.js `accounts` 계열 테이블에서 관리합니다. 근거: [인증 schema](../../../src/lib/db/schema/auth.ts).

### 7.2 Profile

서비스 내부 사용자 프로필입니다.

현재 주요 DB 필드:

```text
id
user_id
display_name
birthday
description
onboarding_completed_at
created_at
updated_at
```

현재 `nickname` 필드는 없으며 생일·소개는 profile에 있습니다. 근거: [서비스 schema](../../../src/lib/db/schema/service.ts).

### 7.3 Wishlist

공개 위시리스트 단위입니다.

현재 주요 DB 필드:

```text
id
owner_id
slug
title
theme_id
visibility
messages_read_at
created_at
updated_at
```

`theme_id`는 공개 위시리스트의 디자인 프리셋입니다. 소유자별 wishlist는 하나이며 `owner_id`가 unique입니다. 현재 테마는 공개 화면에 적용하고 개인별 OG에는 적용하지 않습니다. 초기 OG 테마 의도와의 차이는 13.2절에 기록합니다. 근거: [서비스 schema](../../../src/lib/db/schema/service.ts), [공개 화면](../../../components/public-wishlist-view.tsx), [개인별 OG](../../../app/wishlist/[slug]/opengraph-image.tsx).

### 7.4 WishItem

생일자가 받고 싶은 선물입니다.

현재 주요 DB 필드:

```text
id
wishlist_id
title
description
target_amount
funded_amount
image_url
product_url
status
sort_order
created_at
updated_at
```

상태값:

```ts
type WishStatus = "open" | "fulfilled" | "hidden" | "paused";
```

표시 문구:

```text
open: 마음 모으는 중
fulfilled: 완료
hidden: 숨김
paused: 잠시 멈춤
```

완료 판정(`isWishComplete`)은 상태가 `fulfilled`이거나 진행률이 100% 이상인 경우입니다. 화면의 표시 상태는 별도로 `getDisplayedWishStatus`가 결정하며, `paused`·`hidden`을 진행률보다 우선 유지합니다. 나머지 상태에서는 `fulfilled` 또는 100% 이상인 `open`을 `완료`로 표시합니다. 공개 카드·관리자 선물 행·대시보드 최근 선물은 이 표시 함수를 사용하며, 저장된 상태값 자체를 변경하는 것은 아닙니다.

근거: [서비스 schema](../../../src/lib/db/schema/service.ts), [상태 라벨·완료 판정](../../../src/lib/wish-item/status.ts), [진행률 계산](../../../src/lib/public-wishlist/service.ts).

### 7.5 BankAccount

생일자의 계좌 안내 정보입니다.

현재 주요 DB 필드:

```text
id
user_id
bank_name
account_number_encrypted
account_holder
visibility
created_at
updated_at
```

공개 방식:

```text
always_visible
reveal_on_click
copy_only
hidden
```

DB 기본값은 `hidden`입니다. 설정 화면의 `계좌 공개`에서 `공개 페이지에 보이기`는 `copy_only`, `숨기기`는 `hidden`으로 저장합니다. 계좌가 아직 없으면 선택은 비활성이고, 값을 보내지 않은 첫 저장은 `copy_only`입니다. `always_visible`과 `reveal_on_click`은 schema에 남아 있지만 이 선택에는 없습니다. 공개 UI는 `always_visible`이면 계좌 영역을 펼치고 `copy_only`이면 번호 텍스트를 숨겨 복사를 제공합니다. `hidden`이면 공개 페이지에서 계좌를 뺍니다. 근거: [서비스 schema](../../../src/lib/db/schema/service.ts), [설정 서비스](../../../src/lib/settings/service.ts), [설정 화면](../../../app/admin/settings/page.tsx), [계좌 영역](../../../components/public-account-section.tsx), [계좌 카드](../../../components/public-bank-account-card.tsx).

계좌번호는 평문 저장을 피합니다. 초기에는 애플리케이션 레벨 암호화를 사용하고, 운영 환경에서는 암호화 키를 환경 변수 또는 secret manager로 관리합니다.

### 7.6 Message

친구가 남기는 비공개 메시지입니다.

현재 주요 DB 필드:

```text
id
wishlist_id
wish_item_id
sender_name
body
is_hidden
client_request_id
created_at
```

메시지는 공개 페이지에 노출하지 않습니다. 생일자 본인만 어드민에서 볼 수 있습니다.

`sender_name`은 선택이며 비어 있으면 화면에서 익명으로 표시합니다. 개별 `is_read` 대신 `wishlists.messages_read_at`과 작성 시각으로 안 읽음을 계산합니다. 현재 숨김·복구는 `is_hidden`으로 처리합니다. 근거: [서비스 schema](../../../src/lib/db/schema/service.ts), [메시지함](../../../app/admin/messages/page.tsx), [메시지 repository](../../../src/lib/admin-messages/repository.ts).

### 7.7 FundingLog

현재는 친구의 선물별 참여 금액 이력입니다. 초기의 관리자 수동 금액 반영 UI는 구현되어 있지 않습니다.

현재 주요 DB 필드:

```text
id
wish_item_id
message_id
amount
created_at
```

금액 참여는 메시지·`funding_logs` 생성과 `wish_items.funded_amount` 증가를 하나의 트랜잭션으로 처리합니다. 메시지만 보내면 금액 로그를 만들지 않습니다. 참여를 숨기거나 복구하면 로그는 보존하고 `funded_amount`를 가감합니다. `client_request_id`가 같은 요청의 중복 반영도 방지합니다. 근거: [참여 저장](../../../src/lib/public-participation/repository.ts), [중복 요청 판정](../../../src/lib/public-participation/service.ts), [숨김·복구](../../../src/lib/admin-messages/repository.ts).

## 8. 주요 페이지

### 8.1 랜딩

URL:

```text
/
```

역할:

- 서비스 소개
- 샘플 위시리스트 미리보기
- 사용 방법 안내
- 회원가입/로그인 CTA

주요 카피:

```text
친구들과 함께하는 생일 선물 펀딩
받고 싶은 선물과 목표 금액을 정하고, 링크 하나로 친구들에게 공유해요.
친구는 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 마음을 보탤 수 있어요.
```

현재 홈은 고정 샘플 카드와 FAQ를 표시합니다. `/sample`은 실제 공개 화면 컴포넌트를 데모 모드로 재사용합니다. 근거: [홈](../../../app/page.tsx), [카피](../../../src/lib/design/copy.ts), [샘플](../../../app/sample/page.tsx).

### 8.2 로그인

URL:

```text
/login
```

역할:

- Google 로그인
- Kakao 로그인

로그인 완료 후 온보딩 여부에 따라 `/onboarding` 또는 `/admin`으로 이동합니다.

로그인 페이지와 홈의 계정 CTA는 같은 분기 규칙을 사용합니다.

- 세션이 없으면 로그인 CTA를 보여주고 `/login`으로 이동합니다.
- 로그인했지만 온보딩을 완료하지 않은 사용자는 `위시리스트 만들기 계속하기` CTA를 보여주고 `/onboarding`으로 이동합니다.
- 로그인했고 온보딩을 완료한 사용자는 `내 위시리스트 관리하기` CTA를 보여주고 `/admin`으로 이동합니다.

### 8.3 온보딩

URL:

```text
/onboarding
```

현재 입력값:

- 화면 이름
- 생일 날짜(출생연도 포함, 선택)
- 소개 문구
- 만 14세 이상 확인(필수)

온보딩 완료 시 서버가 랜덤 slug와 기본 제목·테마로 위시리스트를 생성합니다. 계좌·공개 주소 수정·테마 선택은 관리자 설정에서 처리합니다. 근거: [온보딩 폼](../../../app/onboarding/page.tsx), [온보딩 서비스](../../../src/lib/onboarding/service.ts), [설정](../../../app/admin/settings/page.tsx).

### 8.4 어드민 대시보드

URL:

```text
/admin
```

현재 표시 정보:

- 공개 페이지 링크
- 현재 모인 금액
- 등록된 선물 개수
- 받은 메시지 개수
- 최근 선물
- 최근 메시지
- 생일 당일 축하 문구와 confetti

전체 목표 금액·전체 진행률·완료 선물 개수는 초기 표시 후보였으며 현재 대시보드 지표가 아닙니다. 최초 진입 안내는 관리자 layout에 별도로 있습니다. 근거: [대시보드](../../../app/admin/page.tsx), [관리자 layout](../../../app/admin/layout.tsx).

### 8.5 선물 관리

URL:

```text
/admin/wishes
```

기능:

- 선물 목록
- 선물 등록
- 선물 수정
- 선물 삭제 또는 숨김
- 상태 변경
- 상품 링크에서 정보 불러오기

현재 직접 금액을 반영하는 관리자 입력은 없으며, 모인 금액은 공개 참여와 참여 숨김·복구로 조정됩니다. 근거: [선물 관리](../../../app/admin/wishes/page.tsx), [링크 불러오기](../../../app/admin/wishes/link-autofill-button.tsx), [참여 저장](../../../src/lib/public-participation/repository.ts), [숨김·복구](../../../src/lib/admin-messages/repository.ts).

### 8.6 메시지함

URL:

```text
/admin/messages
```

기능:

- 받은/숨긴 메시지 보기
- 받은 메시지함 열람 시각으로 읽음 처리
- 참여 기록 숨김·복구

선물별 필터와 개별 메시지 영구 삭제는 초기 설계에 있었지만 현재 화면 기능은 아닙니다. 숨김·복구는 관련 금액에도 반영됩니다. 근거: [메시지함](../../../app/admin/messages/page.tsx), [메시지 repository](../../../src/lib/admin-messages/repository.ts).

### 8.7 설정

URL:

```text
/admin/settings
```

기능:

- 프로필 수정
- 공개 slug 수정
- 생일 날짜 수정
- 계좌 정보 수정
- 공개 여부 설정
- 공개 테마 선택
- 선물·메시지·모인 금액 기록 초기화(프로필·공개 주소·테마·계좌 안내 유지)

설정 화면에는 `계좌 공개` 선택이 있습니다. `공개 페이지에 보이기`는 `copy_only`, `숨기기`는 `hidden`입니다. OG 이미지 미리보기는 현재 설정 화면에 없습니다. 근거: [설정 화면](../../../app/admin/settings/page.tsx), [설정 저장](../../../src/lib/settings/service.ts), [초기화 폼](../../../app/admin/settings/reset-wishlist-form.tsx).

### 8.8 공개 위시리스트

URL:

```text
/wishlist/[slug]
```

기능:

- 생일자 소개
- 선물 카드 목록
- 선물 개수·모인 마음 요약과 선물별 진행률
- 계좌 안내
- 비공개 메시지 전용 폼과 선물별 금액·메시지 참여 폼
- `나도 만들기` CTA

친구 방문자는 이 페이지에서 로그인하지 않습니다.

근거: [공개 화면](../../../components/public-wishlist-view.tsx), [공개 조회](../../../src/lib/public-wishlist/service.ts).

### 8.9 개인별 OG 이미지

URL:

```text
/wishlist/[slug]/opengraph-image
```

현재 표시 요소:

- 저장된 위시리스트 제목
- 공개 선물 개수와 모인 금액
- 대표 선물 최대 3개(빈 목록이면 안내 문구)
- 생일 위시리스트/공개 링크 안내

초기 표시 후보였던 진행률 바와 선택 테마 적용은 현재 구현에 없습니다. 고정 픽셀 브랜드 색상과 로컬 폰트로 생성합니다. 근거: [개인별 OG](../../../app/wishlist/[slug]/opengraph-image.tsx).

## 9. 권한 정책

### 9.1 생일자 권한

로그인한 사용자는 자신의 `wishlist_id`에 속한 데이터만 관리할 수 있습니다.

관리 가능 데이터:

- 자신의 profile
- 자신의 wishlist
- 자신의 wish_items
- 자신의 bank_account
- 자신의 messages 열람·숨김·복구
- 자신의 참여 기록 숨김·복구에 따른 모인 금액 조정

로그 생성은 현재 공개 참여 경로가 담당하며 관리자 임의 로그 생성 UI는 없습니다. 근거: [메시지 서비스](../../../src/lib/admin-messages/service.ts), [메시지 repository](../../../src/lib/admin-messages/repository.ts), [참여 저장](../../../src/lib/public-participation/repository.ts).

### 9.2 공개 권한

공개 페이지는 `visibility = public`인 위시리스트만 조회합니다.

공개 가능 데이터:

- 위시리스트 title
- 프로필 소개(description)
- 프로필 birthday의 생일 배지 표시
- 공개 상태 선물
- 계좌 정보는 visibility에 따라 표시·복사 UI 구분

공개하지 않는 데이터:

- 생일자의 email
- 내부 user_id
- 비공개 메시지
- 숨김 상태 선물
- 계좌 `hidden`이면 계좌 정보를 반환하지 않음

주의: `copy_only`는 번호 텍스트를 숨기고 복사를 제공하는 표현 방식입니다. 복사를 위해 비숨김 계좌번호가 클라이언트에 전달되므로, 이를 번호에 대한 접근 제어나 비공개 보장으로 설명하지 않습니다. 근거: [공개 repository의 조회 필드](../../../src/lib/public-wishlist/repository.ts), [공개 조회 결과](../../../src/lib/public-wishlist/service.ts), [계좌 카드](../../../components/public-bank-account-card.tsx).

### 9.3 친구 메시지 작성 제한

비로그인 메시지는 abuse 방지가 필요합니다.

현재 구현:

- 이름 선택(빈 값은 익명), 최대 80자로 정규화
- 메시지 필수, 최대 500자
- wish_item_id는 해당 wishlist에 속한 항목만 허용
- slug·IP·User-Agent 조합으로 단일 런타임 메모리 rate limit(60초에 5회)
- 서버 측 검증 필수
- 같은 client request id의 재전송은 동일 내용이면 중복 저장하지 않고, 다른 내용이면 충돌로 처리

rate limit은 분산 저장소를 사용하는 보장이 아니라 현재 런타임의 best-effort 제한입니다. 근거: [참여 검증](../../../src/lib/public-participation/service.ts), [rate limit](../../../src/lib/public-participation/rate-limit.ts), [참여 repository](../../../src/lib/public-participation/repository.ts).

## 10. 오류 처리

### 10.1 인증 오류

- 로그인 전용 페이지는 현재 연령 제한으로 계정이 삭제된 경우의 `notice`를 표시합니다. 모든 OAuth 실패를 자체 오류 문구로 처리한다는 초기 목표는 현재 코드로 확인되지 않습니다. 근거: [로그인 화면](../../../app/login/page.tsx).
- 온보딩 미완료 사용자가 어드민에 접근하면 `/onboarding`으로 이동합니다.
- 세션이 없는 사용자가 어드민에 접근하면 `/login`으로 이동합니다.

### 10.2 공개 페이지 오류

- 존재하지 않는 slug는 404를 반환합니다.
- 비공개 wishlist는 공개 페이지에서 404처럼 처리합니다.
- hidden 상태 선물은 공개 목록에 포함하지 않습니다.
- 현재 404·로딩·오류 경계는 선택 테마를 전달받지 않고 기본 공개 스타일을 사용합니다. 근거: [공개 페이지](../../../app/wishlist/[slug]/page.tsx), [404](../../../app/wishlist/[slug]/not-found.tsx), [로딩](../../../app/wishlist/[slug]/loading.tsx), [오류 경계](../../../app/wishlist/[slug]/error.tsx).

### 10.3 데이터 검증 오류

- 서버에서 입력을 다시 검증하는 것이 설계 원칙이며, 현재 주요 입력은 서비스의 정규화·검증 함수를 사용합니다.
- 선물 목표 금액은 1 이상 2,147,483,647 이하의 정수, 공개 참여 금액은 1 이상 100,000,000 이하의 정수입니다. 모인 금액의 초기값 `0`과 사용자 입력의 하한을 구분합니다.
- 선물 URL은 `http` 또는 `https`만 허용합니다.
- slug는 trim·소문자 정규화 후 영문 소문자·숫자·하이픈으로 3-32자를 허용하고, 설정에서는 `sample`을 예약어로 거절합니다.

근거: [선물 검증](../../../src/lib/wishes/service.ts), [참여 검증](../../../src/lib/public-participation/service.ts), [slug 검사](../../../src/lib/wishlist/slug.ts), [설정 검사](../../../src/lib/settings/service.ts).

### 10.4 메시지 작성 오류

- 저장 실패 시 친구에게 재시도 가능한 오류 메시지를 보여줍니다.
- 메시지 저장 API는 실패 원인을 과도하게 노출하지 않습니다.
- rate limit에 걸리면 일정 시간 후 재시도를 안내합니다.

현재 공개 폼은 Action의 redirect 결과(`error`/`sent`)를 읽어 토스트와 계좌 안내를 표시하며, 제출 중에는 버튼을 비활성화합니다. 관리자 폼은 POST 후 redirect와 공통 토스트를 사용합니다. 입력 복원·필드별 오류·모든 관리자 제출의 pending 처리가 완성된 공통 규칙이라는 뜻은 아닙니다. 근거: [공개 Action](../../../app/wishlist/[slug]/actions.ts), [공개 토스트](../../../components/public-wishlist-toast-events.tsx), [공개 submit](../../../components/public-participation-submit-button.tsx), [관리자 POST](../../../app/api/admin/wishes/route.ts), [관리자 토스트](../../../app/admin/admin-toast-events.tsx).

## 11. 테스트 전략

이 절은 검증 대상과 현재 테스트 위치를 정적으로 대조한 설명이며 전체 테스트의 새 실행 기록이 아닙니다. 현재 단위·파일 계약 테스트는 `src/lib/**`에 있고 E2E는 주로 `/sample`과 비로그인 온보딩 접근을 다룹니다. 테스트 파일의 존재를 실제 OAuth·DB 참여 흐름의 검증 완료로 간주하지 않습니다. 근거: [테스트 명령](../../../package.json), [샘플 E2E 명세](../../../specs/sample-wishlist.md), [비로그인 온보딩 E2E](../../../tests/auth/onboarding-unauthenticated.spec.ts).

### 11.1 도메인 테스트

대상:

- 진행률 계산
- 상태 표시 라벨
- 공개 가능한 선물 필터링
- 계좌 공개 방식
- slug 검증

### 11.2 Application Service 테스트

대상:

- 온보딩 완료 시 profile과 wishlist 생성
- 선물 생성/수정/삭제 권한 검증
- funding log 생성과 funded_amount 반영
- 메시지 저장 검증
- 메시지함 열람 시각 기반 읽음 처리와 참여 숨김·복구

### 11.3 Repository 테스트

대상:

- wishlist 조회
- slug unique 보장
- owner 기준 데이터 필터링
- soft delete 또는 hidden 처리

### 11.4 E2E 테스트

초기 설계의 핵심 검증 대상(전체 완료를 주장하지 않음):

- 신규 사용자가 로그인 후 온보딩을 완료하고 어드민에 진입
- 생일자가 선물을 추가하고 공개 페이지에서 확인
- 친구가 공개 페이지에서 메시지를 남김
- 생일자가 메시지함에서 메시지를 확인
- 친구의 금액 참여와 생일자의 참여 숨김·복구에 따라 공개 진행률이 바뀜

## 12. 데이터베이스 선택

### 12.1 기준

DB는 Postgres 기준으로 설계합니다.

기본 호스팅 선택:

- Neon Postgres

대안:

- Supabase Postgres

서비스 코드는 특정 호스팅 SDK에 종속되지 않습니다. DB 접근은 repository 구현체에 격리합니다.

### 12.2 Neon을 사용할 경우

사용 가능 기능:

- 순수 Postgres 호스팅
- 서버리스 친화적인 DB 연결

주의점:

- Auth, Storage, 파일 업로드는 별도 설계가 필요합니다.
- 런타임 `DATABASE_URL`은 pooled connection URL을 사용하고, Drizzle schema push와 migration에는 direct connection URL을 사용합니다.
- 이미지 저장소는 Cloudflare R2, S3 계열, Supabase Storage 중 하나를 별도로 선택해야 합니다.

### 12.3 Supabase를 사용할 경우

사용 가능 기능:

- Postgres
- Auth 대체 가능성
- Storage
- RLS

주의점:

- Supabase는 대안으로만 둡니다.
- Auth.js를 쓰는 경우 Supabase Auth와 역할이 겹칩니다.
- Supabase SDK를 UI와 service 곳곳에서 직접 호출하지 않습니다.
- RLS는 보조 안전장치로 사용하되, 애플리케이션 권한 검증을 생략하지 않습니다.

### 12.4 1차 추천

1차 설계는 `Neon Postgres + Drizzle + Auth.js`를 기준으로 작성합니다.

DB 호스팅은 Neon Postgres를 기본 선택으로 둡니다. Supabase는 대안으로만 검토합니다. 다만 코드 구조에서는 `Postgres`만 전제하고, 특정 호스팅 업체를 전제로 도메인 정책을 만들지 않습니다.

## 13. UI/카피 방향

### 13.1 디자인 시스템 원칙

실제 UI 작업의 참조 순서와 재사용 기준은 [디자인 가이드](../../design/README.md)에 둡니다. 이 절은 제품의 영역 구분과 의도를 설명합니다.

`뭐갖고싶어`의 디자인 시스템은 두 층으로 나눕니다.

```text
Core UI: 어드민, 로그인, 온보딩, 설정처럼 반복 사용되는 운영 UI
Public Theme UI: 친구들이 보는 공개 위시리스트와 샘플 페이지
```

Core UI는 일관성, 접근성, 입력 효율을 우선합니다. 공개 페이지는 생일자가 고르는 테마에 따라 분위기를 바꿀 수 있습니다. 테마가 바뀌어도 선물 카드, 진행률, 계좌 안내, 메시지 폼, CTA의 정보 구조는 유지합니다.

현재 로그인·온보딩에는 고정 픽셀 브랜드 장식이 있지만 선택 공개 테마는 적용하지 않습니다. 관리자 상시 작업은 차분하게 유지하고 첫 진입 안내에는 굵은 테두리·오프셋 그림자·테마 미리보기를 허용한 후속 설계가 있습니다. shadcn/Radix 기반 UI도 이미 사용합니다. 근거: [비주얼 시스템](2026-05-14-mwagotgo-sipeo-visual-system-design.md), [진입 안내 설계](2026-07-22-admin-first-entry-guide-design.md#6-시각-디자인), [온보딩 생일 UI](../../../app/onboarding/birthday-picker.tsx), [의존성](../../../package.json).

### 13.2 공개 페이지 테마

공개 위시리스트 페이지는 테마 프리셋을 지원합니다.

기본 공개 테마는 `pixel_y2k`입니다. 최초 설계는 참고 페이지의 연핑크/아이보리 배경, 핑크/민트/노랑 포인트, 진보라 테두리, 두꺼운 그림자, 픽셀 카드 감성을 첫 브랜드 인상으로 계승하려 했습니다. 현재 실제 테두리·배경·역할별 색은 [공개 테마 CSS](../../../app/public-themes.css)를 따릅니다. `뭐갖고싶어`가 친구 사이에서 가볍게 공유하는 생일 위시리스트 서비스라는 이유로 기본값을 귀엽고 장난스럽게 두었던 설계 의도를 유지합니다.

현재 제공하는 공개 테마:

```text
pixel_y2k: 기본값. 현재 예시 페이지에 가까운 픽셀/Y2K 감성
mono_bw: 블랙 앤 화이트 중심의 미니멀 감성
soft_pastel: 부드러운 파스텔 생일 카드 감성
```

현재 테마는 [공개 CSS](../../../app/public-themes.css)의 `data-theme`별 커스텀 속성과 공통 `.pub-*` 클래스로 관리합니다. 커스텀 속성의 `pub-` 접두사는 제거했고, 현재 이름은 [토큰 매핑](../../design/tokens-mapping.md)에 있습니다. 다음은 초기 설계의 역할 목록이며, 모두 같은 이름의 구현 토큰이거나 구현 완료 항목이라는 뜻은 아닙니다.

```text
background
foreground
primary
accent
border
card
shadow
radius
font_family
button_style
progress_style
badge_style
decorative_assets
og_template
```

초기에는 완전한 테마 마켓을 만들지 않습니다. 서비스가 제공하는 제한된 프리셋 중 하나를 고르는 방식으로 시작합니다. 이렇게 해야 공개 페이지의 품질과 접근성을 유지하면서도, 생일자별 개성을 줄 수 있습니다.

현재 선택 테마 적용 범위:

```text
/wishlist/[slug] 공개 위시리스트
/sample?theme=... 샘플 공개 위시리스트
```

초기 설계는 개인별 OG·공유 미리보기까지 선택 테마를 확장하려 했습니다. 현재 개인별 OG는 고정 픽셀 스타일이며 `themeId`를 사용하지 않습니다. 404·로딩·오류 경계도 기본 공개 테마를 사용합니다. 따라서 해당 범위까지 선택 테마가 보장된다고 설명하지 않습니다. 근거: [공개 화면](../../../components/public-wishlist-view.tsx), [샘플](../../../app/sample/page.tsx), [개인별 OG](../../../app/wishlist/[slug]/opengraph-image.tsx), [404](../../../app/wishlist/[slug]/not-found.tsx), [로딩](../../../app/wishlist/[slug]/loading.tsx).

테마 비적용 범위:

```text
/admin
/admin/wishes
/admin/messages
/admin/settings
/onboarding
/login
```

어드민과 인증 화면은 선택 공개 테마를 적용하지 않습니다. 첫 진입 안내의 공개 카드 미리보기는 해당 기능의 예외이며 전체 관리자 화면을 테마화하지 않습니다.

### 13.3 브랜드 톤

- 귀여운
- 솔직한
- 가벼운
- 친구 같은
- 살짝 뻔뻔한
- Y2K / 픽셀 감성

Y2K는 기본 브랜드 톤이자 첫 번째 공개 페이지 테마입니다. 다만 서비스가 성장하면 모든 공개 페이지가 같은 Y2K 스타일일 필요는 없습니다. 공개 페이지 테마는 생일자의 취향을 표현하는 기능으로 확장합니다.

### 13.4 주요 카피

초기 카피 예시는 당시 브랜드 의도를 설명하는 기록입니다. 현재 문구는 [공통 카피](../../../src/lib/design/copy.ts), [상태 라벨](../../../src/lib/wish-item/status.ts), [공개 화면](../../../components/public-wishlist-view.tsx)을 근거로 확인합니다.

현재 랜딩:

```text
친구들과 함께하는 생일 선물 펀딩
받고 싶은 선물과 목표 금액을 정하고, 링크 하나로 친구들에게 공유해요.
친구는 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 마음을 보탤 수 있어요.
```

현재 공개 페이지:

```text
{wishlist.title}
```

현재 선물·참여 관련 문구 예시:

```text
마음 모으는 중
모인 마음
선물 링크 보기
마음 보내기
축하 메시지 남기기
완료
```

CTA:

```text
내 위시리스트 만들기
위시리스트 만들기 계속하기
내 위시리스트 관리하기
펀딩 예시 보기
갖고 싶은 거 추가하기
마음 보내기
공유하기
나도 만들기
```

## 14. 초기 구현 순서와 현재 상태

아래 순서는 최초 계획의 기록입니다. 현재의 새 작업 목록이나 우선순위로 사용하지 않습니다. 각 절에 구현 여부를 덧붙이며, 테스트·모바일·접근성의 전체 완료 여부는 별도 검증이 필요합니다.

### 14.1 기반 구조

- 프로젝트 구조 정리
- Drizzle schema 작성
- Auth.js 설정
- Google/Kakao provider 설정
- repository interface 작성
- application service 골격 작성

현재 위 구조와 설정이 존재합니다. 근거: [인증](../../../auth.ts), [서비스 schema](../../../src/lib/db/schema/service.ts), [온보딩 서비스](../../../src/lib/onboarding/service.ts).

### 14.2 인증과 온보딩

- 로그인 페이지
- OAuth callback
- session 처리
- onboarding guard
- 온보딩 페이지
- 기본 wishlist 생성

현재 구현되어 있으며 6절의 생일·서버 생성 slug 흐름을 따릅니다. 근거: [온보딩](../../../app/onboarding/page.tsx), [인증 후 진입](../../../app/auth/after-login/route.ts).

### 14.3 어드민

- 대시보드
- 선물 관리
- 메시지함
- 설정
- 공개 페이지 테마 선택
- 금액 반영 로그

관리자 화면과 테마 선택은 존재합니다. 금액 로그는 현재 공개 참여에서 생성하며 초기 관리자 수동 금액 반영과 구분합니다. 근거: [선물](../../../app/admin/wishes/page.tsx), [설정](../../../app/admin/settings/page.tsx), [참여 저장](../../../src/lib/public-participation/repository.ts).

### 14.4 공개 경험

- `/wishlist/[slug]` 공개 페이지
- 공개 페이지 테마 적용
- 계좌 공개 방식
- 메시지 작성
- `나도 만들기` CTA
- 개인별 OG 이미지

현재 공개 참여·계좌 안내·개인별 OG는 존재합니다. 관리자 설정의 `계좌 공개`에서 보이기(`copy_only`)와 숨기기(`hidden`)를 고릅니다. 개인별 OG 선택 테마 반영은 현재 구현에 없습니다. 근거: [설정 화면](../../../app/admin/settings/page.tsx), [공개 화면](../../../components/public-wishlist-view.tsx), [개인별 OG](../../../app/wishlist/[slug]/opengraph-image.tsx).

### 14.5 랜딩과 마감

- 랜딩 페이지
- 기본 서비스 OG
- 모바일 UI 정리
- 접근성 점검
- E2E 핵심 플로우 검증

현재 랜딩·기본 OG와 샘플 E2E 파일은 존재합니다. 이 문서 갱신은 모바일·접근성·실환경 핵심 흐름 전체의 검증 완료 기록이 아닙니다. 근거: [홈](../../../app/page.tsx), [기본 OG](../../../app/opengraph-image.tsx), [샘플 명세](../../../specs/sample-wishlist.md).

## 15. 설계 결정 요약

- 서비스는 빠른 임시 MVP가 아니라 확장 가능한 서비스 골격으로 설계합니다.
- 초기 배포는 단일 Next.js repo 기반 모듈러 모놀리스로 시작합니다.
- monorepo 전환은 1차 범위에서 제외하고, API 서버나 모바일 앱은 필요해질 때 별도 Git repo로 분리합니다.
- 도메인 규칙, 온보딩 로직, repository, DB 구현은 `src/lib/**`에 두고, 공개 참여 폼의 Server Action과 `app/api/**` Route Handler를 실제 진입점에 맞게 구분합니다.
- 인증은 Auth.js 기반 Google/Kakao OAuth를 사용합니다.
- 신규 로그인 사용자는 온보딩으로 이동합니다.
- 친구 방문자는 로그인하지 않습니다.
- DB는 Neon Postgres를 기본 선택으로 두되, 도메인 정책은 Postgres 기준으로 설계합니다.
- Supabase는 대안으로만 둡니다.
- 공개 페이지는 테마 프리셋을 지원하고, 어드민 UI는 테마와 분리합니다.
- 닉네임이나 slug는 PK로 쓰지 않습니다.
- 계좌 정보와 메시지는 공개 권한을 엄격히 분리합니다.
- 결제, 알림, 모바일 앱, 외부 API는 후속 확장으로 남깁니다.

## 16. 다음 단계

최초 설계 이후 [기반 구현 계획](../plans/2026-05-14-mwagotgo-sipeo-foundation-plan.md), [공개 참여 계획](../plans/2026-05-15-public-participation-plan.md), [테마 토큰 통합 계획](../plans/2026-06-01-public-theme-token-integration.md), [첫 진입 안내 설계](2026-07-22-admin-first-entry-guide-design.md)가 작성되었습니다. 초기 계획의 체크박스·검증 기록은 해당 시점의 기록이며, 현재 규칙이나 최신 테스트 실행 결과와 혼동하지 않습니다. 이 문서 갱신에서는 새 기능·후속 우선순위·디자인 정책을 정하지 않습니다.
