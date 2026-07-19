import { defineConfig } from "drizzle-kit";

// drizzle-kit only auto-loads .env, but this project keeps secrets in
// .env.local (Next.js convention) — load it before reading process.env.
// Set DRIZZLE_ENV_FILE to target another environment, e.g. `.env.prod` when
// applying migrations to production. Already-set shell vars still take
// precedence over the file, so an inline override also works.
const envFile = process.env.DRIZZLE_ENV_FILE ?? ".env.local";
try {
  process.loadEnvFile(envFile);
} catch {
  // No env file (e.g. CI) — fall back to whatever is already in process.env.
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
