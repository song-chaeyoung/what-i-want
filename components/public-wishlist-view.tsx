import Link from "next/link";
import { CopyAccountNumberButton } from "@/components/copy-account-number-button";
import { PublicParticipationSubmitButton } from "@/components/public-participation-submit-button";
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
  sent?: string | null;
  errorMessage?: string | null;
  demo?: boolean;
};

export function PublicWishlistView({
  wishlist,
  items,
  account,
  sent = null,
  errorMessage = null,
  demo = false,
}: PublicWishlistViewProps) {
  const totalFundedAmount = items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );
  const sentKind = sent === "message" ? "message" : sent ? "funding" : null;
  const showAccountModal = sentKind === "funding" && account !== null;
  const pagePath = demo ? "/sample" : `/wishlist/${wishlist.slug}`;

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
        {sentKind === "message" ? (
          <p className="border-2 border-[#0f766e] bg-[#ccfbf1] px-4 py-3 text-sm font-black text-[#0f766e]">
            {PUBLIC_WISHLIST_COPY.messageSuccess}
          </p>
        ) : null}

        {sentKind === "funding" && !showAccountModal ? (
          <p className="border-2 border-[#0f766e] bg-[#ccfbf1] px-4 py-3 text-sm font-black text-[#0f766e]">
            {PUBLIC_WISHLIST_COPY.participationSuccess}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="border-2 border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-black text-[#9a3412]">
            {errorMessage}
          </p>
        ) : null}

        <MessageOnlyForm slug={wishlist.slug} demo={demo} />

        {items.length > 0 ? (
          items.map((item, index) => (
            <PublicWishCard
              key={item.id}
              index={index}
              item={item}
              slug={wishlist.slug}
              demo={demo}
            />
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

        <div className="pub-cta mt-8 flex flex-col items-center gap-4 pt-8 pb-4 text-center">
          <p className="pub-label text-xs">make your own</p>
          <Link href="/login" className="pub-btn h-12 px-6 text-sm">
            {PUBLIC_WISHLIST_COPY.createMineCta}
          </Link>
        </div>
      </section>

      {showAccountModal && account ? (
        <AccountRevealModal account={account} closeHref={pagePath} />
      ) : null}
    </main>
  );
}

function AccountRevealModal({
  account,
  closeHref,
}: {
  account: PublicBankAccountView;
  closeHref: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={PUBLIC_WISHLIST_COPY.fundingSuccessTitle}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5"
    >
      <section className="pub-card w-full max-w-sm p-6">
        <p className="pub-pill pub-pill-alt">thank you</p>
        <h2 className="mt-4 text-2xl font-black tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.fundingSuccessTitle}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--pub-sub)]">
          {PUBLIC_WISHLIST_COPY.fundingSuccessDescription}
        </p>
        <div className="soft-bank-card pub-bank mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--pub-radius)] p-4">
          <div>
            <p className="pub-label text-xs">예금주</p>
            <p className="mt-1 text-sm font-black text-[var(--pub-bank-ink)]">
              {account.accountHolder}
            </p>
          </div>
          <CopyAccountNumberButton
            bankName={account.bankName}
            accountNumber={account.accountNumber}
          />
        </div>
        <Link href={closeHref} className="pub-btn pub-btn-block mt-5 h-11 text-sm">
          {PUBLIC_WISHLIST_COPY.accountModalClose}
        </Link>
      </section>
    </div>
  );
}

function MessageOnlyForm({ slug, demo }: { slug: string; demo: boolean }) {
  return (
    <details className="send-heart-section pub-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
        <span className="pub-pill pub-pill-alt">gift note</span>
        <span className="text-lg font-black tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.messageFormTitle}
        </span>
        <span className="w-full text-sm font-semibold text-[var(--pub-sub)] sm:w-auto">
          {PUBLIC_WISHLIST_COPY.messageFormNote}
        </span>
      </summary>
      <form
        action={demo ? undefined : `/api/public/wishlists/${slug}/participation`}
        method="post"
        className="space-y-4 px-5 pb-5"
      >
        <PublicField
          label={PUBLIC_WISHLIST_COPY.participationSenderLabel}
          htmlFor="message-sender"
        >
          <input
            id="message-sender"
            name="senderName"
            type="text"
            maxLength={80}
            placeholder="이름"
            className={publicInputClassName}
          />
        </PublicField>

        <PublicField
          label={PUBLIC_WISHLIST_COPY.participationMessageLabel}
          htmlFor="message-body"
        >
          <textarea
            id="message-body"
            name="body"
            rows={4}
            maxLength={500}
            required
            className={publicTextareaClassName}
          />
        </PublicField>

        <ParticipationSubmit demo={demo} />
      </form>
    </details>
  );
}

function ParticipationSubmit({ demo }: { demo: boolean }) {
  if (demo) {
    return (
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
    );
  }

  return (
    <PublicParticipationSubmitButton
      label={PUBLIC_WISHLIST_COPY.participationSubmitCta}
    />
  );
}

function PublicWishCard({
  index,
  item,
  slug,
  demo,
}: {
  index: number;
  item: PublicWishItemView;
  slug: string;
  demo: boolean;
}) {
  const productUrl = getHttpUrl(item.productUrl);
  const imageUrl = getHttpUrl(item.imageUrl);
  const canFund = item.status === "open" && !item.isComplete;

  return (
    <article className="gift-card-shell pub-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <div
          className={`gift-image-stage pub-fallback grid place-items-center border-b-2 border-[var(--pub-divider-color)] bg-cover bg-center p-5 lg:aspect-auto lg:border-r-2 lg:border-b-0 ${
            imageUrl ? "aspect-[4/3] min-h-56" : "min-h-24"
          }`}
          style={
            imageUrl
              ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` }
              : undefined
          }
        >
          {!imageUrl ? <GiftFallback /> : null}
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

          <div className="gift-progress-panel grid content-start gap-3 border-t-2 border-[var(--pub-divider-color)] pt-4 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-5">
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

      {canFund ? (
        <details className="send-heart-section border-t-2 border-[var(--pub-divider-color)]">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 p-4 text-sm font-black text-[var(--pub-accent)] [&::-webkit-details-marker]:hidden">
            {PUBLIC_WISHLIST_COPY.fundCta}
          </summary>
          <form
            action={
              demo ? undefined : `/api/public/wishlists/${slug}/participation`
            }
            method="post"
            className="space-y-4 border-t-2 border-[var(--pub-divider-color)] p-5"
          >
            <p className="text-lg font-black tracking-normal text-[var(--pub-headline-color)]">
              {PUBLIC_WISHLIST_COPY.participationTitle}
            </p>
            <input type="hidden" name="wishItemId" value={item.id} />

            <PublicField
              label={PUBLIC_WISHLIST_COPY.participationAmountLabel}
              htmlFor={`participation-amount-${item.id}`}
            >
              <input
                id={`participation-amount-${item.id}`}
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
              htmlFor={`participation-sender-${item.id}`}
            >
              <input
                id={`participation-sender-${item.id}`}
                name="senderName"
                type="text"
                maxLength={80}
                placeholder="이름"
                className={publicInputClassName}
              />
            </PublicField>

            <PublicField
              label={PUBLIC_WISHLIST_COPY.participationMessageLabel}
              htmlFor={`participation-body-${item.id}`}
            >
              <textarea
                id={`participation-body-${item.id}`}
                name="body"
                rows={3}
                maxLength={500}
                required
                className={publicTextareaClassName}
              />
            </PublicField>

            <ParticipationSubmit demo={demo} />
          </form>
        </details>
      ) : null}
    </article>
  );
}

function GiftFallback() {
  return (
    <>
      <div className="gm gm-pixel">
        <div className="font-pixel grid h-16 w-16 grid-cols-4 grid-rows-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0_#111827] lg:h-28 lg:w-28">
          <div className="col-span-4 border-b-2 border-[#171717] bg-[#f97316]" />
          <div className="col-span-1 row-span-3 border-r-2 border-[#171717] bg-[#ffe4e6]" />
          <div className="col-span-2 row-span-3 grid place-items-center bg-[#ccfbf1] text-[10px] font-black text-[#4c1d95] lg:text-sm">
            GIFT
          </div>
          <div className="col-span-1 row-span-3 border-l-2 border-[#171717] bg-[#fef3c7]" />
        </div>
      </div>
      <div className="gm gm-line">
        <div className="grid h-16 w-16 grid-cols-4 grid-rows-4 border-[1.5px] border-[#111] bg-white lg:h-28 lg:w-28">
          <div className="col-span-4 border-b-[1.5px] border-[#111]" />
          <div className="col-span-1 row-span-3 border-r-[1.5px] border-[#111]" />
          <div className="col-span-2 row-span-3 grid place-items-center text-[10px] font-black tracking-[1.6px] text-[#111] lg:text-sm">
            GIFT
          </div>
          <div className="col-span-1 row-span-3 border-l-[1.5px] border-[#111]" />
        </div>
      </div>
      <div className="gm gm-soft">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#ffe1ec] lg:h-28 lg:w-28">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-[10px] font-black text-[#bd6595] lg:h-16 lg:w-16 lg:text-sm">
            GIFT
          </span>
        </div>
      </div>
    </>
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
