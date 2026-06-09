import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PUBLIC_WISHLIST_COPY,
  formatWishCount,
} from "@/src/lib/design/copy";
import { DrizzlePublicWishlistRepository } from "@/src/lib/public-wishlist/repository";
import { getPublicWishlist } from "@/src/lib/public-wishlist/service";
import type {
  PublicBankAccountView,
  PublicWishItemView,
} from "@/src/lib/public-wishlist/types";
import { getWishStatusLabel } from "@/src/lib/wish-item/status";

type PublicWishlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function PublicWishlistPage({
  params,
  searchParams,
}: PublicWishlistPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
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
    <main className="pub-page min-h-dvh" data-theme={result.wishlist.themeId}>
      <header className="pub-header">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="pub-pill">birthday wishlist</p>
          </div>
          <h1 className="pub-headline mt-5 sm:text-5xl">
            {result.wishlist.title}
          </h1>
          <p className="mt-5 text-base font-semibold leading-7 text-[var(--pub-header-sub)]">
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

          <Link href="/login" className="pub-btn mt-6 h-11 px-5 text-sm">
            {PUBLIC_WISHLIST_COPY.createMineCta}
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl space-y-5 px-5 py-6 sm:px-8 lg:py-8">
        {result.items.length > 0 ? (
          result.items.map((item, index) => (
            <PublicWishCard key={item.id} index={index} item={item} />
          ))
        ) : (
          <div className="pub-card p-6">
            <h2 className="text-2xl font-black tracking-normal text-[var(--pub-headline-color)]">
              {PUBLIC_WISHLIST_COPY.emptyTitle}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
              {PUBLIC_WISHLIST_COPY.emptyDescription}
            </p>
          </div>
        )}

        {query.sent ? (
          <p className="border-2 border-[#0f766e] bg-[#ccfbf1] px-4 py-3 text-sm font-black text-[#0f766e]">
            {PUBLIC_WISHLIST_COPY.participationSuccess}
          </p>
        ) : null}

        {query.error ? (
          <p className="border-2 border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-black text-[#9a3412]">
            {getParticipationErrorMessage(query.error)}
          </p>
        ) : null}

        {result.items.length > 0 ? (
          <ParticipationForm slug={result.wishlist.slug} items={result.items} />
        ) : null}

        <AccountGuidance account={result.account} />
      </section>
    </main>
  );
}

function AccountGuidance({
  account,
}: {
  account: PublicBankAccountView | null;
}) {
  if (!account) {
    return null;
  }

  const accountBody = (
    <div className="mt-4 grid gap-3 text-sm font-black">
      <p className="text-[var(--pub-bank-ink)]">
        {account.bankName} {account.accountHolder}
      </p>
      <input
        type="text"
        readOnly
        value={account.accountNumber}
        aria-label="계좌번호"
        className="pub-field h-11 w-full px-3 text-sm font-black outline-none"
      />
    </div>
  );

  if (account.visibility === "reveal_on_click") {
    return (
      <details className="soft-bank-card pub-card pub-bank mt-6 p-5">
        <summary className="cursor-pointer text-lg font-black tracking-normal text-[var(--pub-bank-ink)]">
          마음을 보낸 뒤 계좌 확인하기
        </summary>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pub-bank-ink)]">
          준비된 안내를 열어 편하게 입금 정보를 확인하실 수 있어요.
        </p>
        {accountBody}
      </details>
    );
  }

  return (
    <section className="soft-bank-card pub-card pub-bank mt-6 p-5">
      <p className="pub-label text-xs">after sending</p>
      <p className="mt-2 text-lg font-black tracking-normal text-[var(--pub-bank-ink)]">
        {account.visibility === "copy_only"
          ? "계좌를 복사해 마음을 이어주세요"
          : "마음을 보낼 계좌 안내"}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pub-bank-ink)]">
        선물 마음이 정해지면 아래 정보로 부드럽게 마무리해 주세요.
      </p>
      {accountBody}
    </section>
  );
}

function ParticipationForm({
  slug,
  items,
}: {
  slug: string;
  items: PublicWishItemView[];
}) {
  return (
    <form
      action={`/api/public/wishlists/${slug}/participation`}
      method="post"
      className="send-heart-section pub-card mt-6 space-y-5 p-5 sm:p-6"
    >
      <div>
        <p className="pub-pill pub-pill-alt">gift note</p>
        <p className="mt-3 text-2xl font-black tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.participationTitle}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
          {PUBLIC_WISHLIST_COPY.participationDescription}
        </p>
      </div>

      <PublicField
        label={PUBLIC_WISHLIST_COPY.participationWishLabel}
        htmlFor="participation-wish"
      >
        <select
          id="participation-wish"
          name="wishItemId"
          required
          className={publicInputClassName}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </PublicField>

      <PublicField
        label={PUBLIC_WISHLIST_COPY.participationAmountLabel}
        htmlFor="participation-amount"
      >
        <input
          id="participation-amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="10000"
          className={publicInputClassName}
        />
      </PublicField>

      <PublicField
        label={PUBLIC_WISHLIST_COPY.participationSenderLabel}
        htmlFor="participation-sender"
      >
        <input
          id="participation-sender"
          name="senderName"
          type="text"
          maxLength={80}
          placeholder="이름"
          className={publicInputClassName}
        />
      </PublicField>

      <PublicField
        label={PUBLIC_WISHLIST_COPY.participationMessageLabel}
        htmlFor="participation-body"
      >
        <textarea
          id="participation-body"
          name="body"
          rows={4}
          maxLength={500}
          required
          className={publicTextareaClassName}
        />
      </PublicField>

      <button
        type="submit"
        className="pub-btn pub-btn-accent pub-btn-block h-12 text-sm"
      >
        {PUBLIC_WISHLIST_COPY.participationSubmitCta}
      </button>
    </form>
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
    <article className="gift-card-shell pub-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <div
          className="gift-image-stage pub-fallback grid aspect-[4/3] min-h-56 place-items-center border-b-2 border-[var(--pub-ink)] bg-cover bg-center p-5 lg:aspect-auto lg:border-r-2 lg:border-b-0"
          style={
            imageUrl
              ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` }
              : undefined
          }
        >
          {!imageUrl ? <PixelGift /> : null}
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_220px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="pub-pill">NO. {index + 1}</p>
              <p className="pub-label text-xs">
                {item.isComplete
                  ? PUBLIC_WISHLIST_COPY.completeLabel
                  : getWishStatusLabel(item.status)}
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-normal text-[var(--pub-headline-color)] sm:text-3xl">
              {item.title}
            </h2>

            {item.description ? (
              <p className="mt-4 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
                {item.description}
              </p>
            ) : null}
          </div>

          <div className="gift-progress-panel grid content-start gap-3 border-t-2 border-[var(--pub-ink)] pt-4 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-5">
            <p className="pub-label text-xs">gift progress</p>
            <div>
              <p className="text-2xl font-black tracking-normal text-[var(--pub-headline-color)]">
                {formatCurrency(item.fundedAmount)}
              </p>
              <p className="mt-1 text-xs font-black text-[var(--pub-sub)]">
                {item.targetAmount
                  ? `${formatCurrency(item.targetAmount)} 중`
                  : PUBLIC_WISHLIST_COPY.noTargetAmount}
              </p>
            </div>
            <div className="pub-progress mt-2">
              <i style={{ width: `${item.progress}%` }} />
            </div>
            <p className="text-xs font-black text-[var(--pub-sub)]">
              {item.progress}% {PUBLIC_WISHLIST_COPY.progressSuffix}
            </p>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="pub-btn pub-btn-primary mt-2 h-11 px-4 text-sm"
              >
                선물 링크 보기
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function PixelGift() {
  return (
    <div className="font-pixel grid h-28 w-28 grid-cols-4 grid-rows-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0_#111827]">
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
    <div className="pub-stat p-4">
      <dt className="pub-label text-xs">{label}</dt>
      <dd className="mt-1 text-lg font-black tracking-normal text-[var(--pub-headline-color)]">
        {value}
      </dd>
    </div>
  );
}

function PublicField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-black">
        {label}
      </label>
      {children}
    </div>
  );
}

function getParticipationErrorMessage(error: string): string {
  return (
    PUBLIC_WISHLIST_COPY.participationErrors[
      error as keyof typeof PUBLIC_WISHLIST_COPY.participationErrors
    ] ?? PUBLIC_WISHLIST_COPY.participationErrors.wishlist_not_found
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

const publicInputClassName =
  "pub-field h-10 w-full px-3 text-sm font-bold outline-none";

const publicTextareaClassName =
  "pub-field w-full resize-none px-3 py-2 text-sm font-bold outline-none";
