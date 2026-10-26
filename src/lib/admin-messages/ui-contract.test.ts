import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const adminMessagesPagePath = join(
  process.cwd(),
  "app/admin/messages/page.tsx",
);

describe("admin messages UI contract", () => {
  test("marks messages read only when viewing received messages", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");
    const guardIndex = source.indexOf("if (!hiddenView) {");
    const markReadIndex = source.indexOf("markAdminMessagesRead(\n");

    expect(guardIndex).toBeGreaterThan(-1);
    expect(markReadIndex).toBeGreaterThan(guardIndex);
    expect(source.match(/markAdminMessagesRead\(/g)).toHaveLength(1);
  });

  test("marks messages read only up to when the list was loaded", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");
    const viewedAtIndex = source.indexOf("const viewedAt = new Date();");

    expect(viewedAtIndex).toBeGreaterThan(-1);
    expect(viewedAtIndex).toBeLessThan(
      source.indexOf("await listAdminMessages("),
    );
    expect(source).toMatch(
      /markAdminMessagesRead\(\s*result\.wishlist\.id,\s*viewedAt,/,
    );
  });

  test("shows the full message body with line breaks preserved", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).not.toContain("line-clamp");
    expect(source).toContain("whitespace-pre-wrap wrap-break-word");
    expect(source).toContain("{message.body}");
  });
});
