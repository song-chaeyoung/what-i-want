# DB 마이그레이션 운영 가이드

dev에서 스키마를 바꾸고 테스트한 뒤 prod로 승격하는 절차를 정리한 문서예요.
운영 DB는 Neon Postgres를 가정해요.

## 이렇게 시키세요 (AI 에이전트에게)

이 문서를 가리키고 아래 한 문단만 주면 돼요. 나머지 판단은 문서가 담당해요.

> `docs/db-migrations.md`의 "에이전트 실행 런북"에 따라 prod DB에 마이그레이션을
> 적용해줘. 먼저 읽기 전용 진단으로 prod 상태를 확인하고, 실제 쓰기 명령(baseline
> SQL·migrate)은 실행 직전에 나한테 보여준 뒤 진행해. 대상 env는 `.env.prod`야.

상황별 짧은 변형:

- **dev에 먼저 적용해 테스트만**:
  > 스키마 바꿨어. `pnpm db:generate` 하고 dev(`.env.local`)에 `pnpm db:migrate`로
  > 적용한 뒤 `pnpm test`까지 돌려줘. prod는 아직 건드리지 마.
- **상태 진단만 (쓰기 금지)**:
  > `docs/db-migrations.md` 트러블슈팅 참고해서 prod 마이그레이션 상태만 조회해줘.
  > 쓰기는 하지 마.

잘 되게 하는 전제 3가지:

1. `.env.prod`가 유효한 prod direct URL을 가리킬 것 (Neon 브랜치 변경·자격증명 회전 시
   먼저 갱신).
2. 적용할 마이그레이션 파일이 repo에 커밋돼 있을 것 (`db:generate` 결과물).
3. `psql` 또는 Neon 콘솔 접근이 있을 것 (`psql`이 없으면 "실행할 SQL을 출력해줘"로 대체).

## 왜 이 문서가 필요한가

- 지금까지 스키마는 `db:push`로 반영해 왔어요. push는 현재 스키마와 DB를
  즉석에서 diff해 밀어넣는 방식이라 **이력이 남지 않고**, prod에서는 예상치 못한
  파괴적 변경이 그대로 실행될 위험이 있어요.
- 그래서 앞으로는 **버전 관리형 마이그레이션(`db:migrate`)** 으로 갑니다. 마이그레이션
  SQL 파일이 진실의 원천이고, dev에 먼저 적용해 검증한 뒤 같은 파일을 prod에 적용해요.
- drizzle는 `drizzle.__drizzle_migrations` 테이블에 적용 이력을 기록하고, 그 이력을
  기준으로 "아직 안 돌린 파일만" 적용해요. 판단 기준은 **이력 중 가장 큰 `created_at`**
  이고, 그보다 journal의 `when` 값이 큰 마이그레이션만 실행돼요.
  (구현: `node_modules/drizzle-orm/pg-core/dialect.js`의 `migrate`)

## 환경 구성

### 스크립트 (`package.json`)

| 명령 | 용도 |
| --- | --- |
| `pnpm db:generate` | 스키마 변경으로부터 마이그레이션 SQL 파일 생성 |
| `pnpm db:migrate` | 이력에 없는 마이그레이션을 대상 DB에 적용 |
| `pnpm db:push` | (레거시) 스키마를 즉석 diff로 반영 — 신규 흐름에서는 사용하지 않음 |

### 대상 DB 선택 (`drizzle.config.ts`)

- config는 기본적으로 `.env.local`(=dev)을 로드해요.
- `DRIZZLE_ENV_FILE` 환경변수로 다른 env 파일을 지정할 수 있어요.
- 접속 주소는 `DATABASE_DIRECT_URL ?? DATABASE_URL` 순으로 읽어요.

```bash
pnpm db:migrate                              # dev (.env.local)
DRIZZLE_ENV_FILE=.env.prod pnpm db:migrate   # prod (.env.prod)
```

> **Neon 주의**: 마이그레이션(DDL)은 pooled 엔드포인트가 아니라 **direct 엔드포인트**로
> 실행하세요. `.env*`의 `DATABASE_DIRECT_URL`이 direct 주소예요 (호스트에 `-pooler`가
> 없음). `.env.prod`는 비밀값이라 git에 커밋되지 않아요.

## 최초 1회: baseline (전환 부트스트랩)

dev·prod 모두 과거에 `db:push`로 만들어져서 `__drizzle_migrations` 이력 테이블이
없어요. 이 상태에서 `db:migrate`를 그냥 돌리면 `0000`부터 전부 재실행하려다 이미
존재하는 테이블에서 충돌나요. 그래서 **"현재 DB 스키마에 이미 반영된 마이그레이션"을
적용됨으로 seed**해 두어야 해요. DB별로 한 번씩만 실행하면 됩니다.

각 DB의 현재 상태가 다르므로 seed 범위가 달라요:

- **dev**: `messages_read_at`까지(=`0004`) 이미 push로 반영됨 → `0000`~`0004` 전부 seed
- **prod**: `0003`까지만 반영됨(`messages_read_at` 없음) → `0000`~`0003`만 seed 후,
  `db:migrate`로 `0004`를 적용

> seed 행의 `created_at`은 journal의 `when` 값, `hash`는 마이그레이션 SQL 파일 전체의
> sha256이에요. 아래 값은 현재 파일 기준으로 계산된 것이라 파일을 수정하면 다시 계산해야
> 해요.

### dev baseline (`0000`~`0004`)

```sql
BEGIN;
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT * FROM (VALUES
  ('bdae87210f78395fee416d8a1ce024d2452dbd4a9ced516d87148f21330793ac', 1778743056496),
  ('26626005e1d182ad04ca5463e8642887ad01612a7a7b5ec71895687588c03b09', 1778745640551),
  ('248c53d658091914f2f65cb151b7978e7ec986c7dcab4174bcaabb92504fe7b0', 1781054344931),
  ('e71a5db0e4250d50ec8e7c121de8f173b99fc07a3b077b82785747fefb3858c3', 1781155297401),
  ('df212606110e0f54a83e8a002731998eb90dbf5d40b5ddebef758db56e503c86', 1784454627354)
) AS v(hash, created_at)
WHERE NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations");
COMMIT;
```

이후 `pnpm db:migrate`는 "적용할 것 없음"으로 끝나요 (dev는 이미 최신).

### prod baseline (`0000`~`0003`)

먼저 prod에 `0004`가 아직 없는지 확인:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'wishlists' AND column_name = 'messages_read_at';
-- 0행이어야 정상. 1행이면 이미 스키마가 반영된 것이니 dev용(0000~0004) seed를 쓰세요.
```

baseline seed:

```sql
BEGIN;
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT * FROM (VALUES
  ('bdae87210f78395fee416d8a1ce024d2452dbd4a9ced516d87148f21330793ac', 1778743056496),
  ('26626005e1d182ad04ca5463e8642887ad01612a7a7b5ec71895687588c03b09', 1778745640551),
  ('248c53d658091914f2f65cb151b7978e7ec986c7dcab4174bcaabb92504fe7b0', 1781054344931),
  ('e71a5db0e4250d50ec8e7c121de8f173b99fc07a3b077b82785747fefb3858c3', 1781155297401)
) AS v(hash, created_at)
WHERE NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations");
COMMIT;
```

그다음 `0004` 적용:

```bash
DRIZZLE_ENV_FILE=.env.prod pnpm db:migrate
```

drizzle가 이력의 최대 `created_at`(=`0003`의 `when`)을 보고 그보다 큰 `0004`만
적용하고, `0004` 행을 정확한 해시로 기록해요.

## 평상시 루프 (baseline 이후)

스키마를 바꿀 때마다 반복하는 표준 흐름이에요.

1. **스키마 수정** — `src/lib/db/schema/*.ts` 편집
2. **마이그레이션 생성**
   ```bash
   pnpm db:generate
   ```
   `src/lib/db/migrations/`에 새 SQL 파일과 스냅샷이 생기고 `_journal.json`이 갱신돼요.
   생성된 SQL을 **직접 열어 의도한 변경만 있는지 확인**하세요.
3. **dev 적용 + 테스트**
   ```bash
   pnpm db:migrate      # .env.local
   pnpm test
   ```
   앱을 dev에서 실제로 돌려 새 스키마가 정상 동작하는지 확인해요.
4. **커밋** — 마이그레이션 파일(SQL·스냅샷·journal)을 코드 변경과 함께 커밋
5. **prod 승격**
   ```bash
   DRIZZLE_ENV_FILE=.env.prod pnpm db:migrate
   ```
   dev에서 검증한 것과 동일한 SQL 파일이 prod에 적용돼요.

### 배포 순서 팁

- 컬럼 추가 같은 **하위 호환(nullable/기본값 있음)** 변경은 앱 배포 전/후 아무 때나
  적용해도 안전해요.
- 컬럼 삭제·NOT NULL 강제·타입 변경 등 **비호환 변경**은 "새 코드가 구 스키마에서도,
  구 코드가 새 스키마에서도 잠깐 공존"할 수 있도록 여러 단계로 나눠 배포하세요.

## 에이전트 실행 런북 (모델이 직접 수행할 때)

이 절은 사람이든 AI 에이전트든 **이 문서만 보고 prod 마이그레이션을 동일하게 수행**할 수
있도록 결정적인 절차를 정의해요. 추측하지 말고 아래 명령의 출력으로 판단하세요.

### 원칙

- **prod 쓰기 전에는 반드시 확인 게이트를 거쳐요.** 사용자가 "마이그레이션해줘"라고
  지시했더라도, 실제로 prod에 쓰는 명령(baseline SQL 전문 + migrate 명령)을 먼저 사용자에게
  보여주고 마지막 confirm을 받은 뒤 실행하세요. 되돌리기 어려운 작업이기 때문이에요.
- **읽기 진단은 확인 없이 해도 돼요.** 상태 조회(SELECT)는 부수효과가 없어요.
- **비밀값을 출력하지 마세요.** 접속 URL은 env 파일에서 변수로만 읽고 로그에 찍지 않아요.
- **파괴적 변경(컬럼 삭제·NOT NULL 강제·타입 변경)은 별도로 위험도를 고지**하고 진행하세요.

### 전제 조건

- 로컬 repo에 대상 마이그레이션 파일과 `_journal.json`, `db:migrate` 스크립트,
  `drizzle.config.ts`의 `DRIZZLE_ENV_FILE` 지원이 있어야 해요.
- `.env.prod`가 존재하고 `DATABASE_DIRECT_URL`이 **유효한 운영 DB의 direct 엔드포인트**를
  가리켜야 해요. (Neon 브랜치 변경·자격증명 회전 시 먼저 갱신되어 있어야 함)
- `psql`이 있으면 그대로 사용하고, 없으면 Neon 콘솔 SQL 에디터로 SQL을 실행하세요.

### 실행 순서

접속 URL은 매 명령에서 env 파일로부터 변수로 읽어요 (값 미출력):

```bash
URL=$(grep '^DATABASE_DIRECT_URL=' .env.prod | cut -d= -f2- | tr -d '"')
```

**1단계 — 상태 진단 (읽기 전용)**

```bash
# (a) 마이그레이션 이력 테이블 존재 여부
psql "$URL" -c "SELECT to_regclass('drizzle.__drizzle_migrations') AS migrations_table;"
# (b) 이력이 있으면 어디까지 적용됐는지
psql "$URL" -c "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;"
# (c) 대상 스키마 반영 여부 (0004 예시)
psql "$URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='wishlists' AND column_name='messages_read_at';"
```

**2단계 — 상태로 분기 판단**

| (a) 이력 테이블 | (c) 대상 컬럼 | 해석 | 할 일 |
| --- | --- | --- | --- |
| `null` (없음) | 0행 | push로 구축, 아직 baseline 안 됨 | 3단계(baseline `0000~0003`) → 4단계 |
| `null` (없음) | 1행 | push로 이미 스키마 반영됨, 이력만 없음 | baseline을 `0000~0004`(대상 포함)로 seed, 4단계 생략 |
| 존재 | — | 이미 migrate 체계 | baseline 생략, 바로 4단계 |

**3단계 — baseline seed (이력 테이블이 없을 때만, 1회성)**

위 "최초 1회: baseline" 절의 **prod baseline (`0000`~`0003`)** SQL을 파일로 저장한 뒤
실행하세요. (WHERE NOT EXISTS 가드가 있어 재실행해도 중복 seed되지 않아요.)

```bash
psql "$URL" -f <baseline-sql-파일경로>
```

**4단계 — 마이그레이션 적용**

```bash
DRIZZLE_ENV_FILE=.env.prod pnpm db:migrate
```

**5단계 — 검증**

```bash
# 이력 행 수 == _journal.json 엔트리 수 인지 확인
psql "$URL" -c "SELECT count(*) FROM drizzle.__drizzle_migrations;"
# 대상 스키마가 실제로 반영됐는지 (0004 예시)
psql "$URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='wishlists' AND column_name='messages_read_at';"
```

## 새 마이그레이션 추가 시: baseline 값 재계산

이 문서의 baseline SQL에 박힌 `hash`/`created_at`은 **현재 마이그레이션 파일 기준**이에요.
마이그레이션이 추가·수정되면 아래 스니펫으로 다시 계산해서 baseline 표를 갱신하세요.
(`hash` = SQL 파일 전체의 sha256, `created_at` = `_journal.json`의 `when`. drizzle의
`readMigrationFiles` 구현과 동일: `node_modules/drizzle-orm/migrator.js`)

```bash
node -e '
const crypto=require("node:crypto"), fs=require("node:fs");
const dir="src/lib/db/migrations";
const j=JSON.parse(fs.readFileSync(dir+"/meta/_journal.json","utf8"));
for(const e of j.entries){
  const sql=fs.readFileSync(dir+"/"+e.tag+".sql","utf8");
  const hash=crypto.createHash("sha256").update(sql).digest("hex");
  console.log(`(\x27${hash}\x27, ${e.when}),  -- ${e.tag}`);
}'
```

> 단, baseline은 **push로 만들어진 DB를 migrate 체계로 전환할 때 한 번만** 필요해요.
> 한 번 baseline된 DB는 이후 새 마이그레이션이 생겨도 `pnpm db:migrate`만 반복하면 되고,
> 재계산·재seed가 필요 없어요.

## 확인 & 트러블슈팅

적용 이력 확인:

```sql
SELECT id, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;
```

- journal 엔트리 수와 이력 행 수가 같으면 최신 상태예요.
- **`relation "drizzle.__drizzle_migrations" does not exist`** → 아직 baseline 안 한
  DB예요. 위 baseline 절차를 먼저 실행하세요.
- **migrate가 이미 있는 테이블을 다시 만들려다 실패** → 이력이 비어 있어 `0000`부터
  재실행한 경우예요. baseline이 제대로 seed됐는지 확인하세요.
- **엉뚱한 DB에 적용됨** → `DRIZZLE_ENV_FILE`을 빠뜨렸는지 확인. 셸에 직접 export한
  `DATABASE_DIRECT_URL`이 있으면 그 값이 env 파일보다 우선해요.
