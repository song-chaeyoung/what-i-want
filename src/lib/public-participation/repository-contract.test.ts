import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repositoryPath = join(
  process.cwd(),
  "src/lib/public-participation/repository.ts",
);
const routePath = join(
  process.cwd(),
  "app/api/public/wishlists/[slug]/participation/route.ts",
);

describe("public participation persistence contract", () => {
  test("persists message, funding log, and funded amount in one transaction", () => {
    const source = readFileSync(repositoryPath, "utf8");

    expect(source).toContain("implements PublicParticipationRepository");
    expect(source).toContain(".transaction");
    expect(source).toContain(".insert(messages)");
    expect(source).toContain(".insert(fundingLogs)");
    expect(source).toContain(".update(wishItems)");
    expect(source).toContain(".returning({ id: wishItems.id })");
    expect(source).toContain("throw new Error");
    expect(source).toContain("fundedAmount");
    expect(source).toContain("sql`");
  });

  test("exposes the public participation route handler under app api", () => {
    const source = readFileSync(routePath, "utf8");

    expect(source).toContain("export async function POST");
    expect(source).toContain("submitPublicParticipation");
    expect(source).toContain("DrizzlePublicParticipationRepository");
    expect(source).toContain("/b/${slug}");
  });
});
