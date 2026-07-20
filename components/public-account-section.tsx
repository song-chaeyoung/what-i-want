import { PublicBankAccountCard } from "@/components/public-bank-account-card";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import type { PublicBankAccountView } from "@/src/lib/public-wishlist/types";

export function PublicAccountSection({
  account,
}: {
  account: PublicBankAccountView;
}) {
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
        <PublicBankAccountCard account={account} />
      </div>
    </details>
  );
}
