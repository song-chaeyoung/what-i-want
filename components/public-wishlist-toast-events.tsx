"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PublicBankAccountCard } from "@/components/public-bank-account-card";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import { buildCreateCtaHref } from "@/src/lib/share/share-url";
import type { PublicBankAccountView } from "@/src/lib/public-wishlist/types";

const POST_PARTICIPATION_CTA_HREF = buildCreateCtaHref("post_participation");

type PublicWishlistToastEventsProps = {
  account: PublicBankAccountView | null;
};

type PublicToastConfig = {
  type: "success" | "error";
  message: string;
  openAccountModal?: boolean;
  showCreateCta?: boolean;
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
      toast[toastConfig.type](
        toastConfig.message,
        toastConfig.showCreateCta
          ? {
              action: {
                label: PUBLIC_WISHLIST_COPY.postCreateCtaLabel,
                onClick: () => router.push(POST_PARTICIPATION_CTA_HREF),
              },
            }
          : undefined,
      );
      queueMicrotask(() => {
        setAccountModalOpen(toastConfig.openAccountModal === true);
      });
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
      showCreateCta: true,
    };
  }

  if (sent === "funding") {
    return {
      type: "success",
      message: hasAccount
        ? PUBLIC_WISHLIST_COPY.participationSuccess
        : PUBLIC_WISHLIST_COPY.participationSuccessNoAccount,
      openAccountModal: hasAccount,
      // 계좌 모달이 뜨는 경우엔 모달 안 CTA로 유도하므로 토스트 액션은 생략한다.
      showCreateCta: !hasAccount,
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
        <PublicBankAccountCard account={account} className="mt-5" />
        <p className="mt-3 text-xs font-semibold text-[var(--pub-sub)]">
          {PUBLIC_WISHLIST_COPY.fundingSuccessCorrectionNote}
        </p>
        <Link
          href={POST_PARTICIPATION_CTA_HREF}
          className="pub-btn pub-btn-accent pub-btn-block mt-5 h-11 text-sm"
        >
          {PUBLIC_WISHLIST_COPY.postCreateCtaLabel}
        </Link>
        <button
          type="button"
          className="pub-btn pub-btn-block mt-3 h-11 text-sm"
          onClick={onClose}
        >
          {PUBLIC_WISHLIST_COPY.accountModalClose}
        </button>
      </section>
    </div>
  );
}
