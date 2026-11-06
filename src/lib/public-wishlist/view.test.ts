import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { PublicWishlistView } from "@/components/public-wishlist-view";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import type {
  PublicWishItemView,
  PublicWishlistRecord,
} from "@/src/lib/public-wishlist/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));

vi.mock("@/app/wishlist/[slug]/actions", () => ({
  submitParticipationAction: async () => {},
}));

const sampleDate = new Date("2026-01-01T00:00:00+09:00");

const wishlist: PublicWishlistRecord = {
  id: "list-1",
  slug: "sample",
  title: "민지님의 위시리스트",
  themeId: "pixel_y2k",
  ownerBirthday: null,
  ownerDescription: null,
};

function money(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

function wishItem(
  overrides: Partial<Omit<PublicWishItemView, "targetAmount">> & {
    targetAmount: number | null;
  },
): PublicWishItemView {
  return {
    id: "wish-1",
    wishlistId: wishlist.id,
    title: "무선 헤드폰",
    description: null,
    fundedAmount: 12000,
    productUrl: null,
    imageUrl: null,
    status: "open",
    sortOrder: 0,
    createdAt: sampleDate,
    updatedAt: sampleDate,
    progress: 26,
    isComplete: false,
    ...overrides,
  } as PublicWishItemView;
}

function renderCard(item: PublicWishItemView): string {
  return renderToStaticMarkup(
    createElement(PublicWishlistView, {
      wishlist,
      items: [item],
      account: null,
      demo: true,
    }),
  );
}

describe("public wish card progress", () => {
  test("shows the progress bar and percentage when a target exists", () => {
    const html = renderCard(
      wishItem({
        targetAmount: 45000,
        fundedAmount: 12000,
        progress: 26,
      }),
    );

    expect(html).toContain(money(12000));
    expect(html).toContain(`${money(45000)} 중`);
    expect(html).toContain('class="pub-progress mt-2"');
    expect(html).toContain("width:26%");
    expect(html).toContain(`26% ${PUBLIC_WISHLIST_COPY.progressSuffix}`);
    expect(html).not.toContain(PUBLIC_WISHLIST_COPY.noTargetAmount);
    expect(html).not.toContain("pub-progress-done");
    expect(html).not.toContain(PUBLIC_WISHLIST_COPY.participationClosedComplete);
    expect(html).toContain(PUBLIC_WISHLIST_COPY.fundCta);
    expect(html).toContain('id="wish-title-wish-1"');
    expect(html).toContain('tabindex="-1"');
  });

  test("keeps the same progress bar on a completed card with a target", () => {
    const html = renderCard(
      wishItem({
        status: "fulfilled",
        targetAmount: 45000,
        fundedAmount: 45000,
        progress: 100,
        isComplete: true,
      }),
    );

    expect(html).toContain('class="pub-progress mt-2"');
    expect(html).toContain("width:100%");
    expect(html).toContain(`100% ${PUBLIC_WISHLIST_COPY.progressSuffix}`);
    expect(html).not.toContain("pub-progress-done");
    expect(html).toContain(PUBLIC_WISHLIST_COPY.participationClosedComplete);
    expect(html).toContain(
      'class="border-t-2 border-[var(--pub-divider-color)] p-4 text-center text-sm font-semibold text-[var(--ink-muted)]"',
    );
    expect(html).not.toContain(PUBLIC_WISHLIST_COPY.fundCta);
    expect(html).not.toContain('id="participation-submit-wish-1"');
    expect(html).toContain('id="wish-title-wish-1"');
    expect(html).toContain("무선 헤드폰");
  });

  test("shows the paused notice and keeps the card title focusable", () => {
    const html = renderCard(
      wishItem({
        status: "paused",
        targetAmount: 45000,
        fundedAmount: 12000,
        progress: 26,
      }),
    );

    expect(html).toContain(PUBLIC_WISHLIST_COPY.participationClosedPaused);
    expect(html).not.toContain(PUBLIC_WISHLIST_COPY.fundCta);
    expect(html).not.toContain('id="participation-submit-wish-1"');
    expect(html).toContain('id="wish-title-wish-1"');
    expect(html).toContain('tabindex="-1"');
  });

  test("hides the progress bar and percentage when there is no target amount", () => {
    const html = renderCard(
      wishItem({
        targetAmount: null,
        fundedAmount: 8000,
        progress: 0,
      }),
    );

    expect(html).toContain(money(8000));
    expect(html).toContain(PUBLIC_WISHLIST_COPY.noTargetAmount);
    expect(html).not.toContain("pub-progress");
    expect(html).not.toContain(PUBLIC_WISHLIST_COPY.progressSuffix);
    expect(html).toContain(PUBLIC_WISHLIST_COPY.fundCta);
  });

  test("puts the return-focus id on the real send button", () => {
    const html = renderToStaticMarkup(
      createElement(PublicWishlistView, {
        wishlist,
        items: [
          wishItem({
            targetAmount: 45000,
            fundedAmount: 12000,
            progress: 26,
          }),
        ],
        account: null,
      }),
    );

    expect(html).toContain('id="participation-submit-wish-1"');
    expect(html).toContain('id="wish-title-wish-1"');
    expect(html).toContain(PUBLIC_WISHLIST_COPY.participationSubmitCta);
  });
});
