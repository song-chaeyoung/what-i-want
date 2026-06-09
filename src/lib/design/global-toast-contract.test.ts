import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const layoutPath = join(root, "app/layout.tsx");

describe("global toast contract", () => {
  test("mounts sonner globally without turning the root layout into a client component", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain('import { Toaster } from "@/components/ui/sonner";');
    expect(source).toContain("export const metadata");
    expect(source).not.toMatch(/^["']use client["'];/);
    expect(source).toContain("{children}<Toaster />");
  });
});
