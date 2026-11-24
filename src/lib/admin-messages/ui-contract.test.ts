import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const adminMessagesPagePath = join(
  process.cwd(),
  "app/admin/messages/page.tsx",
);

describe("admin messages UI contract", () => {
  test("marks messages read only when viewing received messages", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8").replaceAll(
      "\r\n",
      "\n",
    );
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

  test("hides a message through a confirm dialog without changing the post", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/messages/hide-message-form.tsx"),
      "utf8",
    );

    expect(source).toContain("<ConfirmDialog");
    expect(source).toContain('tone="default"');
    expect(source).toContain('triggerVariant="subtle"');
    expect(source).toContain('name="intent" value="hide"');
    expect(source).toContain("action={`/api/admin/messages/${messageId}`}");
    expect(source).toContain("ADMIN_COPY.hideMessageConfirm.title");
    expect(source).not.toContain(["window", "confirm"].join("."));
  });

  test("shows the full message body with line breaks preserved", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).not.toContain("line-clamp");
    expect(source).toContain("whitespace-pre-wrap wrap-break-word");
    expect(source).toContain("{message.body}");
  });
});
