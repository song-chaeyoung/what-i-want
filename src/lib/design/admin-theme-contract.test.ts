import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const globalsCssPath = join(root, "app/globals.css");
const adminLayoutPath = join(root, "app/admin/layout.tsx");
const adminShellNavPath = join(root, "app/admin/admin-shell-nav.tsx");
const adminUiPath = join(root, "app/admin/admin-ui.tsx");
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
  test("centralizes repeated admin UI primitives", () => {
    const adminUiSource = readFileSync(adminUiPath, "utf8");
    const adminPageSource = readFileSync(adminPagePath, "utf8");
    const adminWishesSource = readFileSync(adminWishesPagePath, "utf8");
    const adminMessagesSource = readFileSync(adminMessagesPagePath, "utf8");
    const adminSettingsSource = readFileSync(adminSettingsPagePath, "utf8");

    expect(adminUiSource).toContain("export function AdminMetricGroup");
    expect(adminUiSource).toContain("export function AdminMetric");
    expect(adminUiSource).toContain("export function AdminField");
    expect(adminUiSource).toContain("export const adminInputClassName");
    expect(adminUiSource).toContain("export const adminTextareaClassName");
    expect(adminUiSource).toContain("export const adminPrimaryButtonClassName");
    expect(adminUiSource).toContain("export const adminSecondaryButtonClassName");
    expect(adminUiSource).not.toContain("/b/{slug}");

    expect(adminPageSource).toContain('from "./admin-ui"');
    for (const source of [adminWishesSource, adminMessagesSource, adminSettingsSource]) {
      expect(source).toContain('from "../admin-ui"');
    }

    expect(adminPageSource).toContain("<AdminMetricGroup");
    expect(adminPageSource).toContain("<AdminMetric");
    expect(adminWishesSource).toContain("<AdminMetricGroup");
    expect(adminWishesSource).toContain("<AdminMetric");
    expect(adminWishesSource).toContain("<AdminField");
    expect(adminMessagesSource).toContain("<AdminMetricGroup");
    expect(adminMessagesSource).toContain("<AdminMetric");
    expect(adminSettingsSource).toContain("<AdminField");
    expect(adminWishesSource).not.toContain("function Field");
    expect(adminSettingsSource).not.toContain("function Field");
    expect(adminWishesSource).not.toContain("const inputClassName");
    expect(adminSettingsSource).not.toContain("const inputClassName");
  });

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

    expect(source).toContain('import Link from "next/link";');
    expect(source).toContain('className="flex min-h-dvh bg-[#fafaf9] font-sans text-zinc-800"');
    expect(source).toContain("border-r border-line bg-[#fbfbfa]");
    expect(source).toContain("sticky top-0 z-10 flex min-h-12");
    expect(source).toContain("border-b border-line bg-white/90");
    expect(source).toContain("backdrop-blur");
    expect(source).toContain("shadow-[0_1px_0_rgba(24,24,27,0.02)]");
    expect(source).toContain("px-4 py-2");
    expect(source).toContain("border-t border-line px-1.5 pt-4");
    expect(source).toContain("<AdminPageTitle />");
    expect(source).toContain("<AdminShellNav />");
    expect(source).toContain("state.wishlistSlug ? (");
    expect(source).toContain('href={`/wishlist/${state.wishlistSlug}`}');
    expect(source).toContain("공개 페이지 보기");
    expect(source).not.toContain("bg-[#f7f5f0]");
  });

  test("adds compact icon admin navigation without public theme classes", () => {
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(navSource).toContain('"use client";');
    expect(navSource).toContain('import { usePathname } from "next/navigation";');
    expect(navSource).toContain(
      'import { Gift, Inbox, LayoutDashboard, Settings } from "lucide-react";',
    );
    expect(navSource).toContain("const adminNavItems");
    expect(navSource).toContain('aria-current={isActive ? "page" : undefined}');
    expect(navSource).toContain('href: "/admin"');
    expect(navSource).toContain('href: "/admin/wishes"');
    expect(navSource).toContain('href: "/admin/messages"');
    expect(navSource).toContain('href: "/admin/settings"');
    expect(navSource).toContain("icon: LayoutDashboard");
    expect(navSource).toContain("icon: Gift");
    expect(navSource).toContain("icon: Inbox");
    expect(navSource).toContain("icon: Settings");
    expect(navSource).toContain("const Icon = item.icon;");
    expect(navSource).toContain('<Icon aria-hidden="true"');
    expect(navSource).toContain('className="border-b border-line bg-[#fbfbfa] px-4 md:hidden"');
    expect(navSource).not.toContain("rounded-full border border-line bg-[#f4f4f3] p-1");
    expect(navSource).toContain("flex gap-3 overflow-x-auto");
    expect(navSource).toContain("shrink-0 whitespace-nowrap");
    expect(navSource).toContain("border-b-2");
    expect(navSource).toContain("border-ink text-ink");
    expect(navSource).toContain("border-transparent text-zinc-500");
    expect(layoutSource).not.toContain("pub-page");
    expect(layoutSource).not.toContain("pub-card");
    expect(layoutSource).not.toContain("pub-btn");
    expect(layoutSource).not.toContain("data-theme");
    expect(navSource).not.toContain("pub-page");
    expect(navSource).not.toContain("pub-card");
    expect(navSource).not.toContain("pub-btn");
    expect(navSource).not.toContain("data-theme");
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
      "divide-y divide-line rounded-md border border-line bg-white",
    );
    expect(readFileSync(adminSettingsPagePath, "utf8")).toContain(
      "rounded-md border border-line bg-white",
    );
  });

  test("preserves admin wishes form and public link contracts", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");
    const adminUiSource = readFileSync(adminUiPath, "utf8");

    expect(source).not.toContain("slug={result.wishlist.slug}");
    expect(adminUiSource).not.toContain("slug?: string;");
    expect(adminUiSource).not.toContain("const href = actionHref ?? (slug ? `/wishlist/${slug}` : null);");
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

  test("compresses admin wishes into a metric band and underline status tabs", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");
    const adminUiSource = readFileSync(adminUiPath, "utf8");

    expect(source).toContain("const totalFundedAmount = result.items.reduce(");
    expect(source).toContain("const statusCounts: Record<WishStatus, number>");
    expect(source).toContain("<AdminMetricGroup");
    expect(adminUiSource).toContain(
      "divide-y divide-line overflow-hidden rounded-md border border-line bg-white",
    );
    expect(source).toContain("<AdminMetric");
    expect(source).toContain('label="총 선물"');
    expect(source).toContain('label="모인 금액"');
    expect(source).toContain('aria-label="선물 상태 필터"');
    expect(source).toContain("border-b-2");
    expect(source).toContain("border-ink text-ink");
    expect(source).toContain("statusCounts[status]");
    expect(source).not.toContain("shadow-pub");
  });

  test("keeps admin wish creation in a native collapsed panel", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");

    expect(source).toContain('id="create-wish"');
    expect(source).toContain("<details");
    expect(source).toContain("open={result.items.length === 0 && !selectedStatus}");
    expect(source).toContain("<summary");
    expect(source).toContain('action="/api/admin/wishes"');
    expect(source).toContain('method="post"');
    expect(source).toContain('name="title"');
    expect(source).toContain('name="targetAmount"');
    expect(source).toContain('name="productUrl"');
    expect(source).toContain('name="imageUrl"');
    expect(source).toContain('name="description"');
  });

  test("renders admin wishes as list rows with thumbnails and collapsed edits", () => {
    const source = readFileSync(adminWishesPagePath, "utf8");

    expect(source).toContain('<details className="group rounded-md border border-line bg-white">');
    expect(source).toContain('className="flex cursor-pointer list-none items-start gap-3 p-3');
    expect(source).toContain("<WishThumbnail item={item} />");
    expect(source).toContain("function WishThumbnail");
    expect(source).toContain("item.imageUrl");
    expect(source).toContain("backgroundImage: `url(${JSON.stringify(item.imageUrl)})`");
    expect(source).toContain("bg-[#f4f4f3]");
    expect(source).toContain("수정");
    expect(source).toContain('name="_method" value="patch"');
    expect(source).toContain('name="_method" value="delete"');
  });

  test("preserves admin messages list rendering contract", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain("listAdminMessages");
    expect(source).toContain("result.messages.map");
    expect(source).toContain("<MessageRow key={message.id} message={message} />");
    expect(source).toContain("formatCurrency(message.amount)");
    expect(source).toContain("formatDate(message.createdAt)");
  });

  test("adds soft message card tone and empty-state CTAs", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain('import Link from "next/link";');
    expect(source).toContain("bg-[#fff7ed]");
    expect(source).toContain('href={`/wishlist/${result.wishlist.slug}`}');
    expect(source).toContain('href="/admin/wishes"');
  });

  test("preserves admin settings form and public link contracts", () => {
    const source = readFileSync(adminSettingsPagePath, "utf8");
    const adminUiSource = readFileSync(adminUiPath, "utf8");

    expect(source).not.toContain("slug={settings.wishlist.slug}");
    expect(adminUiSource).not.toContain("slug?: string;");
    expect(adminUiSource).not.toContain("const href = actionHref ?? (slug ? `/wishlist/${slug}` : null);");
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
    expect(source).not.toContain('name="accountVisibility"');
    expect(source).not.toContain("accountVisibilityOptions");
  });

  test("adds settings section boundaries and field requirement hints", () => {
    const source = readFileSync(adminSettingsPagePath, "utf8");
    const adminUiSource = readFileSync(adminUiPath, "utf8");

    expect(adminUiSource).toContain("required?: boolean;");
    expect(adminUiSource).toContain("hint?: string;");
    expect(source).toContain("required");
    expect(source).not.toContain('badge="');
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

  test("compresses admin dashboard into a metric band with a public link block", () => {
    const source = readFileSync(adminPagePath, "utf8");

    expect(source).toContain("<AdminMetricGroup");
    expect(source).toContain("<AdminMetric");
    expect(source).toContain('label="선물"');
    expect(source).toContain('label="메시지"');
    expect(source).toContain('label="모인 금액"');
    expect(source).toContain("내 공개 주소");
    expect(source).toContain("<CopyPublicLinkButton");
    expect(source).not.toContain("function SummaryCard");
    expect(source).not.toContain("shadow-pub");
    expect(source).not.toContain("pub-page");
    expect(source).not.toContain("pub-card");
    expect(source).not.toContain("pub-btn");
    expect(source).not.toContain("data-theme");
  });

  test("adds dashboard work queues instead of a metric-only dashboard", () => {
    const source = readFileSync(adminPagePath, "utf8");

    expect(source).toContain("const recentWishes = wishesResult.items.slice(0, 4);");
    expect(source).toContain("const recentMessages = messagesResult.messages.slice(0, 4);");
    expect(source).toContain("<DashboardQueue");
    expect(source).toContain('title="최근 선물"');
    expect(source).toContain('title="최근 메시지"');
    expect(source).toContain("<DashboardQueueRow");
    expect(source).toContain('emptyActionHref="/admin/wishes"');
    expect(source).toContain("formatDate(message.createdAt)");
  });

  test("renders admin messages as inbox rows without large public card shadows", () => {
    const source = readFileSync(adminMessagesPagePath, "utf8");

    expect(source).toContain("<AdminMetricGroup");
    expect(source).toContain('label="받은 메시지"');
    expect(source).toContain('className="divide-y divide-line rounded-md border border-line bg-white"');
    expect(source).toContain("function MessageRow");
    expect(source).toContain("<MessageRow key={message.id} message={message} />");
    expect(source).toContain("rounded-full bg-[#fff7ed]");
    expect(source).not.toContain("function MessageCard");
    expect(source).not.toContain("shadow-pub");
  });

  test("renders admin settings as row sections rather than large card columns", () => {
    const source = readFileSync(adminSettingsPagePath, "utf8");

    expect(source).toContain("<SettingsSection");
    expect(source).toContain("<SettingsRow");
    expect(source).toContain('title="프로필"');
    expect(source).toContain('title="공개 페이지"');
    expect(source).toContain('title="계좌 안내"');
    expect(source).toContain("divide-y divide-line");
    expect(source).not.toContain("lg:grid-cols-[1fr_1fr]");
    expect(source).not.toContain("shadow-pub");
  });
});
