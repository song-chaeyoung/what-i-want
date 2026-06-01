import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("onboarding UI contract", () => {
  test("does not ask users to enter a public slug", () => {
    const source = readFileSync(join(root, "app/onboarding/page.tsx"), "utf8");

    expect(source).not.toContain('name="slug"');
    expect(source).not.toContain('htmlFor="slug"');
  });
});
