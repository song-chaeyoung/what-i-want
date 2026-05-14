import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="min-h-dvh bg-[#fff7ed] text-[#171717]">
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <header className="border-2 border-[#171717] bg-[#fef3c7] p-6 shadow-[8px_8px_0_#111827] lg:sticky lg:top-8">
            <p className="text-sm font-bold text-[#0f766e]">
              /b/{result.wishlist.slug}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              {result.wishlist.title}
            </h1>
            <p className="mt-5 text-base leading-7 text-[#4b5563]">
              받고 싶은 선물을 모아둔 공개 위시리스트입니다. 마음에 드는 선물을
              확인하고 상품 링크로 바로 이동할 수 있습니다.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <SummaryBox label="선물" value={`${result.items.length}개`} />
              <SummaryBox
                label="모인 금액"
                value={formatCurrency(totalFundedAmount)}
              />
            </dl>

            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md border-2 border-[#171717] bg-white px-5 text-sm font-bold transition-colors hover:bg-[#ccfbf1]"
            >
              내 위시리스트 만들기
            </Link>
          </header>

          <section className="space-y-4">
            {result.items.length > 0 ? (
              result.items.map((item) => (
                <PublicWishCard key={item.id} item={item} />
              ))
            ) : (
              <div className="border-2 border-[#171717] bg-white p-6 shadow-[6px_6px_0_#111827]">
                <h2 className="text-xl font-black tracking-normal">
                  아직 공개된 선물이 없습니다.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                  생일자가 선물을 추가하면 이 페이지에 표시됩니다.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function PublicWishCard({ item }: { item: PublicWishItemView }) {
  const productUrl = getHttpUrl(item.productUrl);
  const imageUrl = getHttpUrl(item.imageUrl);

  return (
    <article className="overflow-hidden border-2 border-[#171717] bg-white shadow-[6px_6px_0_#111827]">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div
          className="grid aspect-[4/3] min-h-44 place-items-center border-b-2 border-[#171717] bg-[#ccfbf1] bg-cover bg-center md:aspect-auto md:border-r-2 md:border-b-0"
          style={
            imageUrl
              ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` }
              : undefined
          }
        >
          {!imageUrl ? (
            <div className="grid h-24 w-24 place-items-center border-2 border-[#171717] bg-[#f97316] text-3xl font-black text-white shadow-[4px_4px_0_#111827]">
              GIFT
            </div>
          ) : null}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#0f766e]">
                {item.isComplete ? "완료" : getWishStatusLabel(item.status)}
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight tracking-normal">
                {item.title}
              </h2>
            </div>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#111827] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0f766e]"
              >
                상품 보기
              </a>
            ) : null}
          </div>

          {item.description ? (
            <p className="mt-4 text-sm leading-6 text-[#4b5563]">
              {item.description}
            </p>
          ) : null}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-sm font-bold">
              <span>{formatCurrency(item.fundedAmount)}</span>
              <span>
                {item.targetAmount
                  ? formatCurrency(item.targetAmount)
                  : "목표 금액 없음"}
              </span>
            </div>
            <div className="mt-2 h-3 border border-[#171717] bg-[#f3f4f6]">
              <div
                className="h-full bg-[#0f766e]"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-[#4b5563]">
              {item.progress}% 달성
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-[#171717] bg-white p-4">
      <dt className="text-xs font-bold text-[#4b5563]">{label}</dt>
      <dd className="mt-1 text-lg font-black tracking-normal">{value}</dd>
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
