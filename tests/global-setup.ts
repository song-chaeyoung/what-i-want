import { like } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { users } from "@/src/lib/db/schema";
import { createE2EDatabase, E2E_EMAIL_DOMAIN } from "./support/e2e-db";

export default async function globalSetup() {
  const { db, close } = createE2EDatabase();

  try {
    await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
    // 중단된 이전 실행이 남긴 seed를 지운다. 나머지 행은 FK cascade로 함께 지워진다.
    await db.delete(users).where(like(users.email, `%@${E2E_EMAIL_DOMAIN}`));
  } finally {
    await close();
  }
}
