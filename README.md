# 뭐갖고싶어

받고 싶은 선물을 링크 하나로 공유하는 Next.js 기반 위시리스트 서비스입니다.

## 구조

이 저장소는 단일 Next.js repo입니다. 구조는 참고 프로젝트
`song-chaeyoung/birthday-wishlist`처럼 `app/api/**`와 `src/lib/**`를 중심으로 둡니다.

- `app`: App Router 페이지와 화면 라우트
- `app/api`: Route Handler 기반 API 진입점
- `src/lib`: 도메인 규칙, DB 접근, 인증 helper, 온보딩 로직
- `src/lib/db/schema`: Drizzle schema
- `src/lib/db/migrations`: Drizzle migration 출력

## 환경 설정

```powershell
corepack pnpm install
Copy-Item .env.example .env.local
```

`.env.local`에는 다음 값이 필요합니다.

- `DATABASE_URL` 앱 런타임 DB URL. Neon 배포 환경에서는 pooled connection URL을 사용합니다.
- `DATABASE_DIRECT_URL` Drizzle schema push와 migration용 direct DB URL. 없으면 `DATABASE_URL`을 사용합니다.
- `AUTH_SECRET`
- `ACCOUNT_ENCRYPTION_SECRET` 계좌번호 암호화 키. 없으면 `AUTH_SECRET`을 사용합니다.
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_KAKAO_ID`
- `AUTH_KAKAO_SECRET`

## 개발 명령

```powershell
corepack pnpm dev
corepack pnpm db:generate
corepack pnpm typecheck
corepack pnpm test
corepack pnpm lint
corepack pnpm build
```

## 데이터베이스

Drizzle schema는 `src/lib/db/schema/index.ts`에서 export합니다. migration 출력은 `src/lib/db/migrations`에 생성됩니다.

Neon을 사용할 때는 앱 런타임의 `DATABASE_URL`에는 pooled connection URL을, `corepack pnpm db:push` 같은 schema 작업용 `DATABASE_DIRECT_URL`에는 direct connection URL을 설정합니다. 실제 연결 문자열은 `.env.local`과 배포 환경 변수에만 저장합니다.

```powershell
corepack pnpm db:generate
corepack pnpm db:push
```
