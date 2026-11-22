import type { DeletedAccount } from "./repository";

export type AccountWithdrawalRepository = {
  deleteAccount(userId: string): Promise<DeletedAccount | null>;
};

export type WithdrawAccountResult =
  | {
      ok: true;
      wishlistSlug: string | null;
    }
  | {
      ok: false;
      error: "account_not_found";
    };

export async function withdrawAccount(
  userId: string,
  repository: AccountWithdrawalRepository,
): Promise<WithdrawAccountResult> {
  const deleted = await repository.deleteAccount(userId);

  if (!deleted) {
    return { ok: false, error: "account_not_found" };
  }

  return { ok: true, wishlistSlug: deleted.wishlistSlug };
}
