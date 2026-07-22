import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repositoryPath = join(
  process.cwd(),
  "src/lib/profile/repository.ts",
);

describe("profile greeting repository contract", () => {
  test("selects only the greeting fields for the authenticated user", () => {
    const source = readFileSync(repositoryPath, "utf8");

    expect(source).toContain("export async function getProfileGreeting(");
    expect(source).toContain("database: Database = db");
    expect(source).toContain("displayName: profiles.displayName");
    expect(source).toContain("birthday: profiles.birthday");
    expect(source).toContain(".from(profiles)");
    expect(source).toContain(".where(eq(profiles.userId, userId))");
    expect(source).toContain(".limit(1)");
    expect(source).toContain("return row ?? null;");
    expect(source).not.toContain("profiles.description");
    expect(source).not.toContain("wishlists");
    expect(source).not.toContain("bankAccounts");
  });
});
