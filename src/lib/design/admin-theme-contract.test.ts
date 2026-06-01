import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const globalsCssPath = join(root, "app/globals.css");
const adminLayoutPath = join(root, "app/admin/layout.tsx");
const adminPagePath = join(root, "app/admin/page.tsx");
const adminWishesPagePath = join(root, "app/admin/wishes/page.tsx");
const adminMessagesPagePath = join(root, "app/admin/messages/page.tsx");
const adminSettingsPagePath = join(root, "app/admin/settings/page.tsx");

const adminPagePaths = [
  adminPagePath,
  adminWishesPagePath,
  adminMessagesPagePath,
  adminSettingsPagePath,
];

describe("admin calm theme contract", () => {
  test("exposes admin calm Tailwind theme tokens from global CSS", () => {
    const source = readFileSync(globalsCssPath, "utf8");

    expect(source).toContain("--color-ink: var(--brand-ink);");
    expect(source).toContain("--color-line: var(--brand-line);");
    expect(source).toContain("--color-teal: var(--brand-teal);");
    expect(source).toContain("--color-purple: var(--brand-purple);");
    expect(source).toContain("--color-mint: var(--brand-mint);");
    expect(source).toContain("--color-paper: var(--brand-paper);");
    expect(source).toContain("--shadow-pub:");
    expect(source).toContain("--radius-pub:");
    expect(source).not.toContain("@import url(");
  });

  test("uses the exported AdminShell calm surface pattern in admin layout", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain('className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800"');
    expect(source).toContain("border-r border-line bg-white");
    expect(source).toContain("border-b border-line bg-white");
    expect(source).toContain("rounded-md border border-line bg-[#fafaf9]");
    expect(source).toContain("href=\"/admin/wishes\"");
    expect(source).toContain("href=\"/admin/messages\"");
    expect(source).toContain("href=\"/admin/settings\"");
    expect(source).not.toContain("bg-[#f7f5f0]");
  });

  test("moves admin pages from pixel cards to calm bordered white cards", () => {
    for (const filePath of adminPagePaths) {
      const source = readFileSync(filePath, "utf8");

      expect(source).not.toContain("shadow-[4px_4px_0_#111827]");
      expect(source).not.toContain("border-[#171717]");
    }

    expect(readFileSync(adminPagePath, "utf8")).toContain("rounded-md border border-line bg-white");
    expect(readFileSync(adminWishesPagePath, "utf8")).toContain(
      "rounded-md border border-line bg-white",
    );
    expect(readFileSync(adminMessagesPagePath, "utf8")).toContain(
      "items-start rounded-md border border-line",
    );
    expect(readFileSync(adminSettingsPagePath, "utf8")).toContain(
      "rounded-md border border-line bg-white",
    );
  });

  test("preserves admin wishes form and public link contracts", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");

    expect(source).toContain('href={`/b/${result.wishlist.slug}`}');
    expect(source).toContain('action="/api/admin/wishes"');
    expect(source).toContain('method="post"');
    expect(source).toContain('name="title"');
    expect(source).toContain('name="targetAmount"');
    expect(source).toContain('name="productUrl"');
    expect(source).toContain('name="imageUrl"');
    expect(source).toContain('name="description"');
    expect(source).toContain('action={`/api/admin/wishes/${item.id}`}');
    expect(source).toContain('name="_method" value="patch"');
    expect(source).toContain('name="_method" value="delete"');
    expect(source).toContain('name="status"');
  });

  test("preserves admin messages list rendering contract", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain("listAdminMessages");
    expect(source).toContain("result.messages.map");
    expect(source).toContain("<MessageCard key={message.id} message={message} />");
    expect(source).toContain("formatCurrency(message.amount)");
    expect(source).toContain("formatDate(message.createdAt)");
  });

  test("preserves admin settings form and public link contracts", () => {
    const source = readFileSync(adminSettingsPagePath, "utf8");

    expect(source).toContain('href={`/b/${settings.wishlist.slug}`}');
    expect(source).toContain('action="/api/admin/settings"');
    expect(source).toContain('method="post"');
    expect(source).toContain('name="displayName"');
    expect(source).toContain('name="birthday"');
    expect(source).toContain('name="description"');
    expect(source).toContain('name="wishlistSlug"');
    expect(source).toContain('name="wishlistTitle"');
    expect(source).toContain('name="themeId"');
    expect(source).toContain('name="bankName"');
    expect(source).toContain('name="accountHolder"');
    expect(source).toContain('name="accountNumber"');
    expect(source).toContain('name="accountVisibility"');
  });
});
