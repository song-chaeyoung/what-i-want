import {
  unlinkKakaoUser,
  type KakaoUnlinkResult,
} from "@/src/lib/kakao/unlink";
import type { DeletedAccount } from "./repository";

export type AccountWithdrawalRepository = {
  findKakaoProviderAccountId(userId: string): Promise<string | null>;
  deleteAccount(userId: string): Promise<DeletedAccount | null>;
};

export type WithdrawAccountResult =
  | {
      ok: true;
      wishlistSlug: string | null;
    }
  | {
      ok: false;
      error: "account_not_found" | "kakao_unlink_failed";
    };

type WithdrawAccountDependencies = {
  unlinkKakaoUser?: (kakaoUserId: string) => Promise<KakaoUnlinkResult>;
};

export async function withdrawAccount(
  userId: string,
  repository: AccountWithdrawalRepository,
  dependencies: WithdrawAccountDependencies = {},
): Promise<WithdrawAccountResult> {
  const kakaoUserId = await repository.findKakaoProviderAccountId(userId);

  if (kakaoUserId) {
    const unlink = dependencies.unlinkKakaoUser ?? unlinkKakaoUser;
    const unlinked = await unlink(kakaoUserId);

    if (!unlinked.ok) {
      return { ok: false, error: "kakao_unlink_failed" };
    }
  }

  const deleted = await repository.deleteAccount(userId);

  if (!deleted) {
    return { ok: false, error: "account_not_found" };
  }

  return { ok: true, wishlistSlug: deleted.wishlistSlug };
}
