import { CopyAccountNumberButton } from "@/components/copy-account-number-button";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import type { PublicBankAccountView } from "@/src/lib/public-wishlist/types";

export function PublicAccountSection({
  account,
}: {
  account: PublicBankAccountView;
}) {
  const showAccountNumber = account.visibility !== "copy_only";

  return (
    <details
      className="send-heart-section pub-card"
      open={account.visibility === "always_visible"}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
        <span className="pub-pill pub-pill-alt">gift account</span>
        <span className="text-lg font-black tracking-normal text-[var(--pub-headline-color)]">
          {PUBLIC_WISHLIST_COPY.accountSectionTitle}
        </span>
        <span className="w-full text-sm font-semibold text-[var(--pub-sub)] sm:w-auto">
          {PUBLIC_WISHLIST_COPY.accountSectionNote}
        </span>
      </summary>

      <div className="px-5 pb-5">
        <div className="soft-bank-card pub-bank flex flex-wrap items-center justify-between gap-3 rounded-[var(--pub-radius)] p-4">
          <div>
            <p className="pub-label text-xs">예금주</p>
            <p className="mt-1 text-sm font-black text-[var(--pub-bank-ink)]">
              {account.accountHolder}
            </p>
            {showAccountNumber ? (
              <p className="mt-1 text-sm font-black text-[var(--pub-bank-ink)]">
                {account.bankName} {account.accountNumber}
              </p>
            ) : null}
          </div>
          <CopyAccountNumberButton
            bankName={account.bankName}
            accountNumber={account.accountNumber}
          />
        </div>
      </div>
    </details>
  );
}
