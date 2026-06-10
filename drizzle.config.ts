import { defineConfig } from "drizzle-kit";

// drizzle-kit only auto-loads .env, but this project keeps secrets in
// .env.local (Next.js convention) — load it before reading process.env.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI) — fall back to whatever is already in process.env.
}

const databaseUrl =
  process.env.DATABASE_DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@127.0.0.1:5432/mwagotgo";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
