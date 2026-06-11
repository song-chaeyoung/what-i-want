import { isWishComplete } from "@/src/lib/wish-item/status";
import {
  decryptAccountNumber,
  getAccountEncryptionSecret,
} from "@/src/lib/settings/account-crypto";
import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import type {
  PublicBankAccountRecord,
  PublicBankAccountView,
  PublicWishlistRecord,
  PublicWishlistRepository,
  PublicWishItemRecord,
  PublicWishItemView,
} from "./types";

export type PublicWishlistResult =
  | {
    ok: true;
    wishlist: PublicWishlistRecord;
    items: PublicWishItemView[];
    account: PublicBankAccountView | null;
  }
  | {
      ok: false;
      error: "not_found";
    };

export async function getPublicWishlist(
  slug: string,
  repository: PublicWishlistRepository,
  encryptionSecret: string | undefined = getAccountEncryptionSecret(),
): Promise<PublicWishlistResult> {
  const parsedSlug = parseWishlistSlug(slug);

  if (!parsedSlug.ok) {
    return { ok: false, error: "not_found" };
  }

  const wishlist = await repository.findPublicWishlistBySlug(parsedSlug.value);

  if (!wishlist) {
    return { ok: false, error: "not_found" };
  }

  const items = await repository.listWishItems(wishlist.id);
  const account = await repository.findBankAccountByWishlistId(wishlist.id);

  return {
    ok: true,
    wishlist,
    items: items.filter(isPublicWish).map(toPublicWishItemView),
    account: toPublicBankAccountView(account, encryptionSecret),
  };
}

function isPublicWish(item: PublicWishItemRecord): boolean {
  return item.status !== "hidden";
}

function toPublicWishItemView(item: PublicWishItemRecord): PublicWishItemView {
  const progress = calculateProgress(item);

  return {
    ...item,
    progress,
    isComplete: isWishComplete(item.status, progress),
  };
}

function toPublicBankAccountView(
  account: PublicBankAccountRecord | null,
  encryptionSecret: string | undefined,
): PublicBankAccountView | null {
  if (!account) {
    return null;
  }

  const accountNumber = decryptAccountNumber(
    account.accountNumberEncrypted,
    encryptionSecret,
  );

  if (!accountNumber) {
    return null;
  }

  return {
    bankName: account.bankName,
    accountHolder: account.accountHolder,
    accountNumber,
    visibility: "copy_only",
  };
}

function calculateProgress(item: PublicWishItemRecord): number {
  if (!item.targetAmount || item.targetAmount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.floor((item.fundedAmount / item.targetAmount) * 100),
  );
}
