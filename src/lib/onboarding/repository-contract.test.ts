import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repositoryPath = join(process.cwd(), "src/lib/onboarding/repository.ts");

function readDeleteIncompleteUserSource() {
  const source = readFileSync(repositoryPath, "utf8");
  const start = source.indexOf("async deleteIncompleteUser");
  const end = source.indexOf("function findViolatedConstraint");

  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);

  return source.slice(start, end);
}

describe("onboarding persistence contract", () => {
  test("locks the user row before re-reading completion and deleting", () => {
    const source = readDeleteIncompleteUserSource();
    const lockIndex = source.indexOf('.for("update")');
    const completedCheckIndex = source.indexOf(
      "isNotNull(profiles.onboardingCompletedAt)",
    );
    const deleteIndex = source.indexOf(".delete(users)");

    expect(source).toContain(".transaction(");
    expect(lockIndex).toBeGreaterThan(-1);
    expect(completedCheckIndex).toBeGreaterThan(lockIndex);
    expect(deleteIndex).toBeGreaterThan(completedCheckIndex);
  });

  test("treats a user deleted by a concurrent request as deleted", () => {
    const source = readDeleteIncompleteUserSource();

    expect(source).toMatch(/if \(!user\) \{\s*return true;/);
  });

  test("maps a foreign key violation after concurrent deletion to the age notice", () => {
    const source = readFileSync(repositoryPath, "utf8");

    expect(source).toContain('const FOREIGN_KEY_VIOLATION = "23503";');
    expect(source).toContain(
      "findViolatedConstraint(error, FOREIGN_KEY_VIOLATION)",
    );
    expect(source).toContain('return { ok: false, error: "under_minimum_age" };');
  });
});
