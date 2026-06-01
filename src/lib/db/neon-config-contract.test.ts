import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("Neon database configuration contract", () => {
  test("uses a direct database URL for Drizzle migrations before the app runtime URL", () => {
    const source = readFileSync(join(root, "drizzle.config.ts"), "utf8");

    const directUrlIndex = source.indexOf("process.env.DATABASE_DIRECT_URL");
    const runtimeUrlIndex = source.indexOf("process.env.DATABASE_URL");

    expect(directUrlIndex).toBeGreaterThanOrEqual(0);
    expect(runtimeUrlIndex).toBeGreaterThanOrEqual(0);
    expect(directUrlIndex).toBeLessThan(runtimeUrlIndex);
  });

  test("documents Neon URL slots without committing a real Neon connection string", () => {
    const envExample = readFileSync(join(root, ".env.example"), "utf8");
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const serviceDesign = readFileSync(
      join(
        root,
        "docs/superpowers/specs/2026-05-14-mwagotgo-sipeo-service-design.md",
      ),
      "utf8",
    );

    expect(envExample).toContain("DATABASE_DIRECT_URL");
    expect(readme).toContain("DATABASE_DIRECT_URL");
    expect(readme).toContain("Neon");
    expect(serviceDesign).toContain("Neon Postgres를 기본 선택");
    expect(serviceDesign).toContain("Supabase는 대안");

    expect(envExample).not.toContain("neon.tech");
    expect(readme).not.toContain("neon.tech");
    expect(serviceDesign).not.toContain("neon.tech");
  });
});
