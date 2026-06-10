import Link from "next/link";
import { CopyAccountNumberButton } from "@/components/copy-account-number-button";
import { PUBLIC_WISHLIST_COPY, formatWishCount } from "@/src/lib/design/copy";
import type {
  PublicBankAccountView,
  PublicWishItemView,
  PublicWishlistRecord,
} from "@/src/lib/public-wishlist/types";
import { getWishStatusLabel } from "@/src/lib/wish-item/status";

type PublicWishlistViewProps = {
  wishlist: PublicWishlistRecord;
  items: PublicWishItemView[];
  account: PublicBankAccountView | null;
  sent?: boolean;
  errorMessage?: string | null;
  demo?: boolean;
};

export function PublicWishlistView({
  wishlist,
  items,
  account,
  sent = false,
  errorMessage = null,
  demo = false,
}: PublicWishlistViewProps) {
  const totalFundedAmount = items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );

  return (
    <main className="pub-page min-h-dvh" data-theme={wishlist.themeId}>
      <header className="pub-header">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="pub-pill">birthday wishlist</p>
            {demo ? <p className="pub-pill pub-pill-alt">SAMPLE</p> : null}
          </div>
          <h1 className="pub-headline mt-5 sm:text-5xl">{wishlist.title}</h1>
          <p className="mt-5 text-base font-semibold leading-7 text-[var(--pub-header-sub)]">
            {PUBLIC_WISHLIST_COPY.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <SummaryBox
              label={PUBLIC_WISHLIST_COPY.summaryWishLabel}
              value={formatWishCount(items.length)}
            />
            <SummaryBox
              label={PUBLIC_WISHLIST_COPY.summaryFundedLabel}
              value={formatCurrency(totalFundedAmount)}
            />
          </dl>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl space-y-5 px-5 py-6 sm:px-8 lg:py-8">
        {items.length > 0 ? (
          items.map((item, index) => (
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

        {sent ? (
          <p className="border-2 border-[#0f766e] bg-[#ccfbf1] px-4 py-3 text-sm font-black text-[#0f766e]">
            {PUBLIC_WISHLIST_COPY.participationSuccess}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="border-2 border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-black text-[#9a3412]">
            {errorMessage}
          </p>
        ) : null}

        {items.length > 0 ? (
          <ParticipationForm slug={wishlist.slug} items={items} demo={demo} />
        ) : null}

        <AccountGuidance account={account} />

        <div className="pub-cta mt-8 flex flex-col items-center gap-4 pt-8 pb-4 text-center">
          <p className="pub-label text-xs">make your own</p>
          <Link href="/login" className="pub-btn h-12 px-6 text-sm">
            {PUBLIC_WISHLIST_COPY.createMineCta}
          </Link>
        </div>
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

  return (
    <section className="soft-bank-card pub-card pub-bank mt-6 p-5">
      <p className="pub-label text-xs">after sending</p>
      <p className="mt-2 text-lg font-black tracking-normal text-[var(--pub-bank-ink)]">
        마음을 보낼 계좌 안내
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pub-bank-ink)]">
        계좌번호는 화면에 표시되지 않고 복사 버튼으로만 전달돼요.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-[var(--pub-bank-ink)]">
          {account.bankName} {account.accountHolder}
        </p>
        <CopyAccountNumberButton
          bankName={account.bankName}
          accountNumber={account.accountNumber}
        />
      </div>
    </section>
  );
}

function ParticipationForm({
  slug,
  items,
  demo,
}: {
  slug: string;
  items: PublicWishItemView[];
  demo: boolean;
}) {
  return (
    <form
      action={demo ? undefined : `/api/public/wishlists/${slug}/participation`}
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

      {demo ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled
            className="pub-btn pub-btn-accent pub-btn-block h-12 text-sm opacity-60"
          >
            {PUBLIC_WISHLIST_COPY.participationSubmitCta}
          </button>
          <p className="text-xs font-semibold text-[var(--pub-sub)]">
            샘플 페이지에서는 마음을 보낼 수 없어요.
          </p>
        </div>
      ) : (
        <button
          type="submit"
          className="pub-btn pub-btn-accent pub-btn-block h-12 text-sm"
        >
          {PUBLIC_WISHLIST_COPY.participationSubmitCta}
        </button>
      )}
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
          className={`gift-image-stage pub-fallback grid place-items-center border-b-2 border-[var(--pub-ink)] bg-cover bg-center p-5 lg:aspect-auto lg:border-r-2 lg:border-b-0 ${
            imageUrl ? "aspect-[4/3] min-h-56" : "min-h-24"
          }`}
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
    <div className="font-pixel grid h-16 w-16 grid-cols-4 grid-rows-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0_#111827] lg:h-28 lg:w-28">
      <div className="col-span-4 border-b-2 border-[#171717] bg-[#f97316]" />
      <div className="col-span-1 row-span-3 border-r-2 border-[#171717] bg-[#ffe4e6]" />
      <div className="col-span-2 row-span-3 grid place-items-center bg-[#ccfbf1] text-[10px] font-black text-[#4c1d95] lg:text-sm">
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
