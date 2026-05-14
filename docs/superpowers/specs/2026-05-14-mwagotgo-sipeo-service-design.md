# 뭐갖고싶어 서비스 설계 v0.1

작성일: 2026-05-14

## 1. 설계 목적

`뭐갖고싶어`는 생일자가 받고 싶은 선물을 위시리스트로 만들고, 친구들이 공개 링크로 들어와 선물과 계좌 안내를 확인한 뒤 비공개 메시지를 남길 수 있는 생일 위시리스트 서비스입니다.

이 문서는 기존 개인용 생일 위시리스트 프로젝트를 기반으로, 결제 기능 없이도 실제 서비스로 운영 가능한 구조를 정의합니다. 목표는 빠른 임시 MVP가 아니라, 향후 결제, 알림, 모바일 앱, 외부 API로 확장할 수 있는 제품 골격을 잡는 것입니다.

## 2. 근거

- 현재 저장소는 Next.js 기반 개인 생일 위시리스트 앱이며, 정적 위시 아이템 데이터, 공개 페이지, 메시지 폼, 계좌 안내, OG 이미지 구조의 원형을 갖고 있습니다.
- 현재 배포본은 선물 카드, 진행률, 상품 링크, 계좌 복사, 비공개 메시지 작성, `내 페이지도 만들기` CTA를 보여줍니다.
- Next.js는 Route Handler, Server Action, 서버 컴포넌트를 통해 웹 프론트와 BFF 역할을 함께 수행할 수 있습니다.
- Auth.js는 Google, Kakao OAuth provider와 Drizzle Adapter를 공식 지원합니다.
- Supabase와 Neon은 무료 Postgres 호스팅 선택지가 될 수 있지만, 서비스 코드를 특정 BaaS SDK에 강하게 묶는 것은 장기 확장성 측면에서 피해야 합니다.

참고:

- GitHub: https://github.com/song-chaeyoung/birthday-wishlist
- 배포본: https://birthday-wishlist-xi.vercel.app/
- Next.js Backend for Frontend: https://nextjs.org/docs/app/guides/backend-for-frontend
- Auth.js Kakao Provider: https://authjs.dev/getting-started/providers/kakao
- Auth.js Drizzle Adapter: https://authjs.dev/getting-started/adapters/drizzle

## 3. 제품 범위

### 3.1 포함 범위

- 랜딩 페이지
- Google/Kakao 로그인
- 신규 사용자 온보딩
- 생일자 어드민 대시보드
- 선물 등록, 수정, 삭제, 상태 관리
- 계좌 정보 등록 및 공개 방식 설정
- 공개 위시리스트 페이지
- 친구의 비공개 메시지 작성
- 생일자의 메시지함
- 수동 진행률 반영
- 금액 반영 로그
- 개인별 OG 이미지
- 기본 서비스 OG 이미지

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
- 공개 URL slug 설정
- 선물 등록과 관리
- 계좌 정보 등록
- 공개 링크 공유
- 메시지 확인
- 진행률 수동 반영

### 4.2 친구 방문자

친구 방문자는 로그인하지 않습니다. 공유 링크로 들어와 선물을 확인하고, 상품 링크 또는 계좌 정보를 확인한 뒤 비공개 메시지를 남깁니다.

주요 행동:

- 공개 위시리스트 확인
- 선물 카드 확인
- 상품 링크 열기
- 계좌 정보 확인 또는 복사
- 비공개 메시지 작성
- `나도 만들기` CTA 클릭

## 5. 아키텍처 방향

### 5.1 선택한 구조

초기 구조는 `단일 Next.js repo 기반 모듈러 모놀리스`로 갑니다.

물리적 배포와 Git 저장소는 하나로 시작합니다. 코드 구조는 참고 프로젝트 `song-chaeyoung/birthday-wishlist`의 `app/api/**`와 `src/lib/**` 패턴을 따릅니다. 웹 UI는 `app/**`, HTTP 진입점은 `app/api/**`, 도메인 규칙과 DB 접근은 `src/lib/**`에 둡니다. 이렇게 하면 초반 배포와 운영 복잡도를 낮추면서도, 나중에 API 서버나 모바일 앱이 필요해질 때 각각 별도 Git repo로 분리할 수 있습니다.

### 5.2 추천 단일 repo 구조

```text
app/
  page.tsx
  layout.tsx
  login/
  onboarding/
  admin/
  api/
    auth/[...nextauth]/route.ts
    onboarding/route.ts

components/
  ui/
  layout/

src/
  lib/
    wishlist/
    wish-item/
    onboarding/
    auth/
    db/
      schema/
      migrations/

public/
docs/
```

현재 프로젝트는 루트에 `app/`, `public/`, `package.json`이 있는 단일 Next 앱으로 시작되어 있습니다. 따라서 `apps/`, `packages/`, workspace package alias를 만들지 않고, 새 기능부터 `app/api/**`와 `src/lib/**` 기준으로 배치합니다.

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

## 6. 인증과 온보딩

### 6.1 인증 방식

인증은 Auth.js 기반 OAuth로 시작합니다.

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
화면 이름: profiles.display_name 또는 wishlists.owner_name
```

닉네임이나 slug는 PK로 쓰지 않습니다. slug는 변경 가능성이 있고, 닉네임은 중복 정책과 변경 정책이 생길 수 있기 때문입니다.

### 6.3 신규 사용자 흐름

```text
1. 사용자가 Google 또는 Kakao 로그인
2. Auth.js가 user/account/session 생성
3. 서버에서 profile과 기본 wishlist 존재 여부 확인
4. 온보딩 미완료 상태면 /onboarding으로 이동
5. 사용자가 화면 이름, slug, 생일 날짜, 소개 문구 입력
6. 기본 wishlist 생성
7. /admin으로 이동
```

### 6.4 기존 사용자 흐름

```text
1. 사용자가 로그인
2. 세션 확인
3. 온보딩 완료 상태 확인
4. /admin으로 이동
```

### 6.5 친구 방문자 흐름

```text
1. /b/[slug] 접속
2. 공개 위시리스트 조회
3. 선물과 계좌 안내 확인
4. 닉네임과 메시지 입력
5. 비공개 메시지 저장
```

친구 방문자는 로그인하지 않습니다. 이 원칙은 공유 서비스의 가벼움을 유지하기 위한 핵심 정책입니다.

## 7. 도메인 모델

### 7.1 User

OAuth 인증을 통해 생성되는 내부 사용자입니다.

주요 필드:

```text
id
email
created_at
updated_at
```

Provider 계정 정보는 Auth.js `accounts` 계열 테이블에서 관리합니다.

### 7.2 Profile

서비스 내부 사용자 프로필입니다.

주요 필드:

```text
user_id
display_name
nickname
onboarding_completed_at
created_at
updated_at
```

### 7.3 Wishlist

공개 위시리스트 단위입니다.

주요 필드:

```text
id
user_id
slug
owner_name
title
description
birthday_date
theme
visibility
created_at
updated_at
```

`theme`은 공개 위시리스트 페이지의 디자인 프리셋을 가리킵니다. 어드민 UI의 운영 경험은 일관되게 유지하고, 친구들이 보는 공개 페이지와 개인별 OG 이미지에만 테마를 적용합니다.

### 7.4 WishItem

생일자가 받고 싶은 선물입니다.

주요 필드:

```text
id
wishlist_id
name
description
price
funded_amount
image_url
product_url
priority
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
open: 모으는 중
fulfilled: 완료
hidden: 숨김
paused: 일시중지
```

진행률이 100%이거나 상태가 `fulfilled`이면 공개 카드에서는 완료 상태로 보입니다.

### 7.5 BankAccount

생일자의 계좌 안내 정보입니다.

주요 필드:

```text
id
wishlist_id
bank_name
account_number_encrypted
account_holder
visibility_mode
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

기본값은 `reveal_on_click`입니다.

계좌번호는 평문 저장을 피합니다. 초기에는 애플리케이션 레벨 암호화를 사용하고, 운영 환경에서는 암호화 키를 환경 변수 또는 secret manager로 관리합니다.

### 7.6 Message

친구가 남기는 비공개 메시지입니다.

주요 필드:

```text
id
wishlist_id
wish_item_id
nickname
message
is_read
created_at
deleted_at
```

메시지는 공개 페이지에 노출하지 않습니다. 생일자 본인만 어드민에서 볼 수 있습니다.

### 7.7 FundingLog

생일자가 수동으로 반영한 금액 이력입니다.

주요 필드:

```text
id
wishlist_id
wish_item_id
amount
memo
created_at
created_by
```

`wish_items.funded_amount`만 직접 수정하지 않고, 로그를 함께 남깁니다. 현재 모인 금액은 로그 합산 또는 캐시 필드 동기화 방식으로 관리합니다. 1차 구현에서는 `funded_amount` 캐시 필드와 `funding_logs`를 함께 유지합니다.

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
생일축하해.
뭐 갖고 싶어?
```

### 8.2 로그인

URL:

```text
/login
```

역할:

- Google 로그인
- Kakao 로그인

로그인 완료 후 온보딩 여부에 따라 `/onboarding` 또는 `/admin`으로 이동합니다.

### 8.3 온보딩

URL:

```text
/onboarding
```

입력값:

- 화면 이름
- 공개 URL slug
- 생일 날짜
- 소개 문구
- 계좌 정보 선택 입력

온보딩 완료 시 기본 위시리스트를 생성합니다.

### 8.4 어드민 대시보드

URL:

```text
/admin
```

표시 정보:

- 위시리스트 이름
- 공개 페이지 링크
- 전체 진행률
- 전체 목표 금액
- 현재 모인 금액
- 등록된 선물 개수
- 완료된 선물 개수
- 최근 메시지

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
- 수동 금액 반영

### 8.6 메시지함

URL:

```text
/admin/messages
```

기능:

- 전체 메시지 보기
- 선물별 필터
- 읽음 처리
- 삭제

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
- 계좌 공개 방식 수정
- 공개 여부 설정
- OG 이미지 미리보기

### 8.8 공개 위시리스트

URL:

```text
/b/[slug]
```

기능:

- 생일자 소개
- 선물 카드 목록
- 전체 진행률
- 계좌 안내
- 비공개 메시지 폼
- `나도 만들기` CTA

친구 방문자는 이 페이지에서 로그인하지 않습니다.

### 8.9 개인별 OG 이미지

URL:

```text
/b/[slug]/opengraph-image
```

표시 요소:

- `{ownerName}가 갖고 싶은 건...`
- 생일 위시리스트 보러가기
- 대표 선물 2~3개
- 진행률 바
- 브랜드명 `뭐갖고싶어`

## 9. 권한 정책

### 9.1 생일자 권한

로그인한 사용자는 자신의 `wishlist_id`에 속한 데이터만 관리할 수 있습니다.

관리 가능 데이터:

- 자신의 profile
- 자신의 wishlist
- 자신의 wish_items
- 자신의 bank_account
- 자신의 messages 읽기/삭제
- 자신의 funding_logs 생성

### 9.2 공개 권한

공개 페이지는 `visibility = public`인 위시리스트만 조회합니다.

공개 가능 데이터:

- owner_name
- title
- description
- birthday_date 일부 표시
- 공개 상태 선물
- 계좌 정보는 visibility_mode에 따라 제한 표시

공개하지 않는 데이터:

- 생일자의 email
- 내부 user_id
- 비공개 메시지
- 숨김 상태 선물
- 계좌번호 평문 전체, 단 visibility_mode가 허용하는 경우만 표시

### 9.3 친구 메시지 작성 제한

비로그인 메시지는 abuse 방지가 필요합니다.

1차 정책:

- nickname 필수
- message 필수
- message 최대 길이 제한
- wish_item_id는 해당 wishlist에 속한 항목만 허용
- IP 또는 세션 기반 rate limit
- 서버 측 검증 필수

## 10. 오류 처리

### 10.1 인증 오류

- 로그인 실패 시 `/login`에 오류 메시지를 표시합니다.
- 온보딩 미완료 사용자가 어드민에 접근하면 `/onboarding`으로 이동합니다.
- 세션이 없는 사용자가 어드민에 접근하면 `/login`으로 이동합니다.

### 10.2 공개 페이지 오류

- 존재하지 않는 slug는 404를 반환합니다.
- 비공개 wishlist는 공개 페이지에서 404처럼 처리합니다.
- hidden 상태 선물은 공개 목록에 포함하지 않습니다.

### 10.3 데이터 검증 오류

- 모든 Server Action과 Route Handler에서 입력값을 검증합니다.
- 금액은 0 이상의 정수로 제한합니다.
- URL 필드는 허용 가능한 URL 형식만 저장합니다.
- slug는 영문 소문자, 숫자, 하이픈 조합으로 제한합니다.

### 10.4 메시지 작성 오류

- 저장 실패 시 친구에게 재시도 가능한 오류 메시지를 보여줍니다.
- 메시지 저장 API는 실패 원인을 과도하게 노출하지 않습니다.
- rate limit에 걸리면 일정 시간 후 재시도를 안내합니다.

## 11. 테스트 전략

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
- 메시지 읽음 처리

### 11.3 Repository 테스트

대상:

- wishlist 조회
- slug unique 보장
- owner 기준 데이터 필터링
- soft delete 또는 hidden 처리

### 11.4 E2E 테스트

핵심 플로우:

- 신규 사용자가 로그인 후 온보딩을 완료하고 어드민에 진입
- 생일자가 선물을 추가하고 공개 페이지에서 확인
- 친구가 공개 페이지에서 메시지를 남김
- 생일자가 메시지함에서 메시지를 확인
- 생일자가 금액을 반영하고 공개 페이지 진행률이 바뀜

## 12. 데이터베이스 선택

### 12.1 기준

DB는 Postgres 기준으로 설계합니다.

초기 무료 호스팅 후보:

- Supabase Postgres
- Neon Postgres

서비스 코드는 특정 호스팅 SDK에 종속되지 않습니다. DB 접근은 repository 구현체에 격리합니다.

### 12.2 Supabase를 사용할 경우

사용 가능 기능:

- Postgres
- Auth 대체 가능성
- Storage
- RLS

주의점:

- Auth.js를 쓰는 경우 Supabase Auth와 역할이 겹칩니다.
- Supabase SDK를 UI와 service 곳곳에서 직접 호출하지 않습니다.
- RLS는 보조 안전장치로 사용하되, 애플리케이션 권한 검증을 생략하지 않습니다.

### 12.3 Neon을 사용할 경우

사용 가능 기능:

- 순수 Postgres 호스팅
- 서버리스 친화적인 DB 연결

주의점:

- Auth, Storage, 파일 업로드는 별도 설계가 필요합니다.
- 이미지 저장소는 Cloudflare R2, Supabase Storage, S3 계열 중 하나를 별도로 선택해야 합니다.

### 12.4 1차 추천

1차 설계는 `Postgres + Drizzle + Auth.js`를 기준으로 작성합니다.

DB 호스팅은 초기에는 Supabase 또는 Neon 중 선택할 수 있습니다. 다만 설계 문서와 코드 구조에서는 `Postgres`만 전제하고, 특정 호스팅 업체를 전제로 도메인 정책을 만들지 않습니다.

## 13. UI/카피 방향

### 13.1 디자인 시스템 원칙

`뭐갖고싶어`의 디자인 시스템은 두 층으로 나눕니다.

```text
Core UI: 어드민, 로그인, 온보딩, 설정처럼 반복 사용되는 운영 UI
Public Theme UI: 친구들이 보는 공개 위시리스트 페이지와 개인별 OG 이미지
```

Core UI는 일관성, 접근성, 입력 효율을 우선합니다. 공개 페이지는 생일자가 고르는 테마에 따라 분위기를 바꿀 수 있습니다. 테마가 바뀌어도 선물 카드, 진행률, 계좌 안내, 메시지 폼, CTA의 정보 구조는 유지합니다.

### 13.2 공개 페이지 테마

공개 위시리스트 페이지는 테마 프리셋을 지원합니다.

기본 공개 테마는 `pixel_y2k`입니다. 현재 예시 페이지의 연핑크/아이보리 배경, 핑크/민트/노랑 포인트, 진보라 테두리, 두꺼운 그림자, 픽셀 카드 감성을 서비스의 첫 브랜드 인상으로 계승합니다. `뭐갖고싶어`가 진지한 선물 관리 도구가 아니라 친구 사이에서 가볍게 공유하는 생일 위시리스트 서비스이기 때문에, 기본값은 귀엽고 장난스러운 쪽이 더 적합합니다.

1차 테마 후보:

```text
pixel_y2k: 기본값. 현재 예시 페이지에 가까운 픽셀/Y2K 감성
mono_bw: 블랙 앤 화이트 중심의 미니멀 감성
soft_pastel: 부드러운 파스텔 생일 카드 감성
```

테마는 CSS 토큰과 컴포넌트 variant 조합으로 관리합니다.

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

테마 적용 범위:

```text
/b/[slug] 공개 위시리스트
/b/[slug]/opengraph-image 개인별 OG 이미지
공유용 미리보기 카드
```

테마 비적용 범위:

```text
/admin
/admin/wishes
/admin/messages
/admin/settings
/onboarding
/login
```

어드민과 인증 화면은 서비스 운영 UI이므로 테마를 적용하지 않습니다.

### 13.3 브랜드 톤

- 귀여운
- 솔직한
- 가벼운
- 친구 같은
- 살짝 뻔뻔한
- Y2K / 픽셀 감성

Y2K는 기본 브랜드 톤이자 첫 번째 공개 페이지 테마입니다. 다만 서비스가 성장하면 모든 공개 페이지가 같은 Y2K 스타일일 필요는 없습니다. 공개 페이지 테마는 생일자의 취향을 표현하는 기능으로 확장합니다.

### 13.4 주요 카피

랜딩:

```text
생일축하해.
뭐 갖고 싶어?
```

공개 페이지:

```text
{ownerName}가 갖고 싶은 건...
```

선물 카드:

```text
제일 갖고 싶어요
귀여운 후보
모으는 중
가격
모인 마음
이거 보기
이미 마음이 모였어요
```

CTA:

```text
내 위시리스트 만들기
샘플 보기
갖고 싶은 거 추가하기
마음 보태기
링크 복사하기
나도 만들기
```

## 14. 구현 순서 제안

### 14.1 기반 구조

- 프로젝트 구조 정리
- Drizzle schema 작성
- Auth.js 설정
- Google/Kakao provider 설정
- repository interface 작성
- application service 골격 작성

### 14.2 인증과 온보딩

- 로그인 페이지
- OAuth callback
- session 처리
- onboarding guard
- 온보딩 페이지
- 기본 wishlist 생성

### 14.3 어드민

- 대시보드
- 선물 관리
- 메시지함
- 설정
- 공개 페이지 테마 선택
- 금액 반영 로그

### 14.4 공개 경험

- `/b/[slug]` 공개 페이지
- 공개 페이지 테마 적용
- 계좌 공개 방식
- 메시지 작성
- `나도 만들기` CTA
- 개인별 OG 이미지

### 14.5 랜딩과 마감

- 랜딩 페이지
- 기본 서비스 OG
- 모바일 UI 정리
- 접근성 점검
- E2E 핵심 플로우 검증

## 15. 설계 결정 요약

- 서비스는 빠른 임시 MVP가 아니라 확장 가능한 서비스 골격으로 설계합니다.
- 초기 배포는 단일 Next.js repo 기반 모듈러 모놀리스로 시작합니다.
- monorepo 전환은 1차 범위에서 제외하고, API 서버나 모바일 앱은 필요해질 때 별도 Git repo로 분리합니다.
- 도메인 규칙, 온보딩 로직, repository, DB 구현은 `src/lib/**` 내부 폴더 경계로 분리하고 HTTP mutation은 `app/api/**` Route Handler로 노출합니다.
- 인증은 Auth.js 기반 Google/Kakao OAuth를 사용합니다.
- 신규 로그인 사용자는 온보딩으로 이동합니다.
- 친구 방문자는 로그인하지 않습니다.
- DB는 Postgres 기준으로 설계합니다.
- Supabase와 Neon은 호스팅 선택지로만 둡니다.
- 공개 페이지는 테마 프리셋을 지원하고, 어드민 UI는 테마와 분리합니다.
- 닉네임이나 slug는 PK로 쓰지 않습니다.
- 계좌 정보와 메시지는 공개 권한을 엄격히 분리합니다.
- 결제, 알림, 모바일 앱, 외부 API는 후속 확장으로 남깁니다.

## 16. 다음 단계

이 설계가 승인되면 별도 구현 계획 문서를 작성합니다. 구현 계획에서는 작업 단위를 테스트 가능한 순서로 나누고, 각 단계의 검증 명령과 완료 기준을 명확히 정의합니다.
