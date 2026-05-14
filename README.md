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

- `DATABASE_URL`
- `AUTH_SECRET`
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

```powershell
corepack pnpm db:generate
corepack pnpm db:push
```
