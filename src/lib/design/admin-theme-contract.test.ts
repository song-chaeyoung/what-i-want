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

  test("filters admin wishes by valid status search params without public theme classes", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");

    expect(source).toContain("status?: string;");
    expect(source).toContain("const selectedStatus = getSelectedStatus(params.status);");
    expect(source).toContain("const visibleItems = selectedStatus");
    expect(source).toContain("result.items.filter((item) => item.status === selectedStatus)");
    expect(source).toContain('href="/admin/wishes"');
    expect(source).toContain('href={`/admin/wishes?status=${status}`}');
    expect(source).toContain("getWishStatusLabel(status)");
    expect(source).toContain("function getSelectedStatus");
    expect(source).not.toContain("pub-page");
    expect(source).not.toContain("pub-card");
    expect(source).not.toContain("pub-btn");
    expect(source).not.toContain("data-theme");
  });

  test("adds calm admin wish status hierarchy and a next-action empty state", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");

    expect(source).toContain("const statusBadgeClassNames");
    expect(source).toContain("const statusDotClassNames");
    expect(source).toContain("bg-[#ecfdf5] text-[#047857]");
    expect(source).toContain("bg-[#fff7ed] text-[#9a3412]");
    expect(source).toContain("bg-[#f4f4f5] text-zinc-600");
    expect(source).toContain("emptyStateMessage");
    expect(source).toContain("emptyStateCta");
  });

  test("preserves admin messages list rendering contract", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain("listAdminMessages");
    expect(source).toContain("result.messages.map");
    expect(source).toContain("<MessageCard key={message.id} message={message} />");
    expect(source).toContain("formatCurrency(message.amount)");
    expect(source).toContain("formatDate(message.createdAt)");
  });

  test("adds soft message card tone and empty-state CTAs", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain('import Link from "next/link";');
    expect(source).toContain("bg-[#fffaf7]");
    expect(source).toContain("border-[#f3d7c7]");
    expect(source).toContain('href={`/b/${result.wishlist.slug}`}');
    expect(source).toContain('href="/admin/wishes"');
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

  test("adds settings section boundaries and field requirement hints", () => {
    const source = readFileSync(adminSettingsPagePath, "utf8");

    expect(source).toContain("badge?: string;");
    expect(source).toContain("hint?: string;");
    expect(source).toContain('badge="필수"');
    expect(source).toContain('badge="선택"');
    expect(source).toContain('hint="');
    expect(source).toContain("border-b border-line");
  });

  test("uses real admin dashboard summary services", () => {
    const source = readFileSync(adminPagePath, "utf8");

    expect(source).toContain("requireUser");
    expect(source).toContain("listWishes");
    expect(source).toContain("listAdminMessages");
    expect(source).toContain("totalFundedAmount");
    expect(source).not.toContain('<SummaryCard label="선물" value="0" />');
    expect(source).not.toContain('<SummaryCard label="메시지" value="0" />');
  });
});
