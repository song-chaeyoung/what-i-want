import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { ACCOUNT_NUMBER_INPUT_PATTERN } from "./account-number";

describe("account number input pattern", () => {
  test("compiles with the HTML v flag and allows digits, spaces, and hyphens", () => {
    expect(() => new RegExp(ACCOUNT_NUMBER_INPUT_PATTERN, "v")).not.toThrow();

    const pattern = new RegExp(`^(?:${ACCOUNT_NUMBER_INPUT_PATTERN})$`, "v");

    expect(pattern.test("3333-12-1234567")).toBe(true);
    expect(pattern.test("3333 12 1234567")).toBe(true);
    expect(pattern.test("")).toBe(true);
    expect(pattern.test("3333-AB")).toBe(false);
  });

  test("is the pattern on the settings account number field", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/settings/page.tsx"),
      "utf8",
    );

    expect(source).toContain("pattern={ACCOUNT_NUMBER_INPUT_PATTERN}");
  });
});
