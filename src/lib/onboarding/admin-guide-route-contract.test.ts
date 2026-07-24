import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const routePath = join(
  process.cwd(),
  "app/api/admin/onboarding-guide/complete/route.ts",
);

describe("admin guide completion route contract", () => {
  test("authenticates and maps completion results to JSON status codes", () => {
    expect(existsSync(routePath)).toBe(true);
    const source = readFileSync(routePath, "utf8");

    expect(source).toContain('import { auth } from "@/auth";');
    expect(source).toContain("completeAdminGuide(");
    expect(source).toContain("new DrizzleOnboardingRepository()");
    expect(source).toContain('{ error: "unauthorized" }');
    expect(source).toContain('{ status: 401 }');
    expect(source).toContain('{ error: result.error }');
    expect(source).toContain('{ status: 409 }');
    expect(source).toContain("NextResponse.json({ ok: true })");
    expect(source).toContain('{ error: "unexpected" }');
    expect(source).toContain('{ status: 500 }');
  });
});
