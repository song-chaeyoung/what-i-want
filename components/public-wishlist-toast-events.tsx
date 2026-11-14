"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PublicBankAccountCard } from "@/components/public-bank-account-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";
import {
  accountRevealTabTarget,
  listDialogTabStops,
  restoreAccountRevealTriggerFocus,
} from "@/src/lib/public-wishlist/account-reveal-focus";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.querySelector<HTMLButtonElement>("[data-account-copy]")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAccountReveal(() => onCloseRef.current());
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const next = accountRevealTabTarget(
        listDialogTabStops(dialog),
        document.activeElement,
        event.shiftKey,
      );

      if (!next) {
        return;
      }

      event.preventDefault();
      next.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={PUBLIC_WISHLIST_COPY.fundingSuccessTitle}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5"
    >
      <Card asChild variant="theme" className="w-full max-w-sm p-6">
        <section>
          <p className="pub-pill pub-pill-alt">thank you</p>
          <h2 className="mt-4 text-2xl font-black tracking-normal text-[var(--headline)]">
            {PUBLIC_WISHLIST_COPY.fundingSuccessTitle}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-muted)]">
            {PUBLIC_WISHLIST_COPY.fundingSuccessDescription}
          </p>
          <PublicBankAccountCard account={account} className="mt-5" />
          <p className="mt-3 text-xs font-semibold text-[var(--ink-muted)]">
            {PUBLIC_WISHLIST_COPY.fundingSuccessCorrectionNote}
          </p>
          <Button
            asChild
            variant="theme-accent"
            size="block"
            className="mt-5 h-11 text-sm"
          >
            <Link href={POST_PARTICIPATION_CTA_HREF}>
              {PUBLIC_WISHLIST_COPY.postCreateCtaLabel}
            </Link>
          </Button>
          <Button
            type="button"
            variant="theme"
            size="block"
            className="mt-3 h-11 text-sm"
            onClick={() => closeAccountReveal(onClose)}
          >
            {PUBLIC_WISHLIST_COPY.accountModalClose}
          </Button>
        </section>
      </Card>
    </div>
  );
}

function closeAccountReveal(onClose: () => void): void {
  onClose();
  window.setTimeout(() => {
    restoreAccountRevealTriggerFocus();
  }, 0);
}
