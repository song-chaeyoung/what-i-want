import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/src/lib/db/schema";

// .env.local(공유 Neon 개발 브랜치)과 데이터가 섞이지 않도록 E2E는 로컬 전용 DB를 쓴다.
// 최초 1회 `createdb mwagotgo_e2e`로 만들고, 스키마는 globalSetup이 마이그레이션으로 맞춘다.
export const E2E_DATABASE_URL = "postgres://localhost:5432/mwagotgo_e2e";

// dev 서버와 seed가 같은 키로 계좌번호를 암호화·복호화하도록 고정한다.
export const E2E_ACCOUNT_ENCRYPTION_SECRET = "e2e-account-encryption-secret";

// seed 사용자 이메일 도메인. 이전 실행이 남긴 데이터를 이 도메인으로 찾아 지운다.
export const E2E_EMAIL_DOMAIN = "e2e.test";

export function createE2EDatabase() {
  const client = postgres(E2E_DATABASE_URL, { onnotice: () => {} });

  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
}

export type E2EDatabase = ReturnType<typeof createE2EDatabase>["db"];
