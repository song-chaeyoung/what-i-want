import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PUBLIC_WISHLIST_COPY,
  formatWishCount,
} from "@/src/lib/design/copy";
import { DrizzlePublicWishlistRepository } from "@/src/lib/public-wishlist/repository";
import { getPublicWishlist } from "@/src/lib/public-wishlist/service";
import type { PublicWishItemView } from "@/src/lib/public-wishlist/types";
import { getWishStatusLabel } from "@/src/lib/wish-item/status";

type PublicWishlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicWishlistPage({
  params,
}: PublicWishlistPageProps) {
  const { slug } = await params;
  const result = await getPublicWishlist(
    slug,
    new DrizzlePublicWishlistRepository(),
  );

  if (!result.ok) {
    notFound();
  }

  const totalFundedAmount = result.items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );

  return (
    <main className="pixel-dot-bg min-h-dvh text-[#171717]">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <header className="pixel-board bg-[#fffdf7] p-6 lg:sticky lg:top-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="sticker-label">birthday wishlist</p>
              <p className="text-sm font-black text-[#0f766e]">
                /b/{result.wishlist.slug}
              </p>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-[#4c1d95] sm:text-5xl">
              {result.wishlist.title}
            </h1>
            <p className="mt-5 text-base font-semibold leading-7 text-[#4b5563]">
              {PUBLIC_WISHLIST_COPY.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <SummaryBox
                label={PUBLIC_WISHLIST_COPY.summaryWishLabel}
                value={formatWishCount(result.items.length)}
              />
              <SummaryBox
                label={PUBLIC_WISHLIST_COPY.summaryFundedLabel}
                value={formatCurrency(totalFundedAmount)}
              />
            </dl>

            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md border-2 border-[#171717] bg-white px-5 text-sm font-black transition-colors hover:bg-[#ccfbf1]"
            >
              {PUBLIC_WISHLIST_COPY.createMineCta}
            </Link>
          </header>

          <section className="space-y-4">
            {result.items.length > 0 ? (
              result.items.map((item, index) => (
                <PublicWishCard key={item.id} index={index} item={item} />
              ))
            ) : (
              <div className="pixel-card bg-white p-6">
                <h2 className="text-2xl font-black tracking-normal text-[#4c1d95]">
                  {PUBLIC_WISHLIST_COPY.emptyTitle}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#4b5563]">
                  {PUBLIC_WISHLIST_COPY.emptyDescription}
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function PublicWishCard({
  index,
  item,
}: {
  index: number;
  item: PublicWishItemView;
}) {
  const productUrl = getHttpUrl(item.productUrl);
  const imageUrl = getHttpUrl(item.imageUrl);

  return (
    <article className="pixel-card overflow-hidden bg-white">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div
          className="grid aspect-[4/3] min-h-44 place-items-center border-b-2 border-[#171717] bg-[#ccfbf1] bg-cover bg-center md:aspect-auto md:border-r-2 md:border-b-0"
          style={
            imageUrl
              ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` }
              : undefined
          }
        >
          {!imageUrl ? <PixelGift /> : null}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="sticker-label">NO. {index + 1}</p>
                <p className="text-xs font-black text-[#0f766e]">
                  {item.isComplete
                    ? PUBLIC_WISHLIST_COPY.completeLabel
                    : getWishStatusLabel(item.status)}
                </p>
              </div>
              <h2 className="mt-3 text-2xl font-black leading-tight tracking-normal">
                {item.title}
              </h2>
            </div>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-4 text-sm font-black text-white transition-colors hover:bg-[#0f766e]"
              >
                {PUBLIC_WISHLIST_COPY.productLinkCta}
              </a>
            ) : null}
          </div>

          {item.description ? (
            <p className="mt-4 text-sm font-semibold leading-6 text-[#4b5563]">
              {item.description}
            </p>
          ) : null}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-sm font-black">
              <span>{formatCurrency(item.fundedAmount)}</span>
              <span>
                {item.targetAmount
                  ? formatCurrency(item.targetAmount)
                  : PUBLIC_WISHLIST_COPY.noTargetAmount}
              </span>
            </div>
            <div className="mt-2 h-3 border-2 border-[#171717] bg-[#f3f4f6]">
              <div
                className="h-full bg-[#0f766e]"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-black text-[#4b5563]">
              {item.progress}% {PUBLIC_WISHLIST_COPY.progressSuffix}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PixelGift() {
  return (
    <div className="grid h-28 w-28 grid-cols-4 grid-rows-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0_#111827]">
      <div className="col-span-4 border-b-2 border-[#171717] bg-[#f97316]" />
      <div className="col-span-1 row-span-3 border-r-2 border-[#171717] bg-[#ffe4e6]" />
      <div className="col-span-2 row-span-3 grid place-items-center bg-[#ccfbf1] text-sm font-black text-[#4c1d95]">
        GIFT
      </div>
      <div className="col-span-1 row-span-3 border-l-2 border-[#171717] bg-[#fef3c7]" />
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-[#171717] bg-white p-4">
      <dt className="text-xs font-black text-[#4b5563]">{label}</dt>
      <dd className="mt-1 text-lg font-black tracking-normal text-[#4c1d95]">
        {value}
      </dd>
    </div>
  );
}

function getHttpUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
