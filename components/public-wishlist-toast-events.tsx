"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CopyAccountNumberButton } from "@/components/copy-account-number-button";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import type { PublicBankAccountView } from "@/src/lib/public-wishlist/types";

type PublicWishlistToastEventsProps = {
  account: PublicBankAccountView | null;
};

type PublicToastConfig = {
  type: "success" | "error";
  message: string;
  openAccountModal?: boolean;
};

export function PublicWishlistToastEvents({
  account,
}: PublicWishlistToastEventsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastToastKeyRef = useRef<string | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  useEffect(() => {
    const sent = searchParams.get("sent");
    const error = searchParams.get("error");
    const shouldCleanUrl = searchParams.has("sent") || searchParams.has("error");

    if (!shouldCleanUrl) {
      return;
    }

    const toastKey = `${pathname}?${searchParams.toString()}`;

    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    lastToastKeyRef.current = toastKey;

    const toastConfig = getPublicToastConfig(sent, error, account !== null);

    if (toastConfig) {
      toast[toastConfig.type](toastConfig.message);
      setAccountModalOpen(toastConfig.openAccountModal === true);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("sent");
    nextParams.delete("error");

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [account, pathname, router, searchParams]);

  if (!accountModalOpen || !account) {
    return null;
  }

  return (
    <AccountRevealModal
      account={account}
      onClose={() => setAccountModalOpen(false)}
    />
  );
}

function getPublicToastConfig(
  sent: string | null,
  error: string | null,
  hasAccount: boolean,
): PublicToastConfig | null {
  if (error) {
    return {
      type: "error",
      message: getParticipationErrorMessage(error),
    };
  }

  if (sent === "message") {
    return {
      type: "success",
      message: PUBLIC_WISHLIST_COPY.messageSuccess,
    };
  }

  if (sent === "funding") {
    return {
      type: "success",
      message: PUBLIC_WISHLIST_COPY.participationSuccess,
      openAccountModal: hasAccount,
    };
  }

  return null;
}

function getParticipationErrorMessage(error: string): string {
  return (
    PUBLIC_WISHLIST_COPY.participationErrors[
      error as keyof typeof PUBLIC_WISHLIST_COPY.participationErrors
    ] ?? PUBLIC_WISHLIST_COPY.participationErrors.wishlist_not_found
  );
}

function AccountRevealModal({
  account,
  onClose,
}: {
  account: PublicBankAccountView;
  onClose: () => void;
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
        <button
          type="button"
          className="pub-btn pub-btn-block mt-5 h-11 text-sm"
          onClick={onClose}
        >
          {PUBLIC_WISHLIST_COPY.accountModalClose}
        </button>
      </section>
    </div>
  );
}
