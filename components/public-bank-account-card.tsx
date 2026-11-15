import { CopyAccountNumberButton } from "@/components/copy-account-number-button";
import type { PublicBankAccountView } from "@/src/lib/public-wishlist/types";

export function PublicBankAccountCard({
  account,
  className,
}: {
  account: PublicBankAccountView;
  className?: string;
}) {
  const showAccountNumber = account.visibility !== "copy_only";

  return (
    <div
      className={`soft-bank-card theme-bank flex flex-wrap items-center justify-between gap-3 rounded-(--card-radius) p-4${
        className ? ` ${className}` : ""
      }`}
    >
      <div>
        <p className="theme-label text-xs">예금주</p>
        <p className="mt-1 text-sm font-black text-(--bank-ink)">
          {account.accountHolder}
        </p>
        {showAccountNumber ? (
          <p className="mt-1 text-sm font-black text-(--bank-ink)">
            {account.bankName} {account.accountNumber}
          </p>
        ) : null}
      </div>
      <CopyAccountNumberButton
        bankName={account.bankName}
        accountNumber={account.accountNumber}
      />
    </div>
  );
}
