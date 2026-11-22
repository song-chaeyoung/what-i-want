import { eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { users, wishlists, withdrawnSlugBlocks } from "@/src/lib/db/schema";
import {
  getSlugBlockSecret,
  hashWithdrawnSlug,
  withdrawnSlugBlockedUntil,
} from "@/src/lib/wishlist/slug-block";

export type DeletedAccount = {
  wishlistSlug: string | null;
};

export class DrizzleAccountWithdrawalRepository {
  constructor(private readonly database: Database = db) {}

  // users 행을 지우면 스키마의 onDelete cascade로 함께 사라지는 테이블:
  // accounts, sessions, authenticators, profiles, bank_accounts, wishlists,
  // wishlists 아래 wish_items·messages, wish_items 아래 funding_logs.
  // messages.wish_item_id와 funding_logs.message_id는 set null이지만,
  // 그 부모 행도 같은 삭제에서 cascade로 지워져 남는 행이 없다.
  // verification_tokens는 사용자 FK가 없고, 이 서비스는 이메일 매직링크를 쓰지 않는다.
  // 선물 이미지와 프로필 이미지는 외부 URL 문자열이라 별도 저장소가 없다.
  // withdrawn_slug_blocks는 사용자 FK가 없다. 평문 slug 대신 HMAC과 해제 시각만 남긴다.
  async deleteAccount(
    userId: string,
    withdrawnAt: Date = new Date(),
  ): Promise<DeletedAccount | null> {
    return this.database.transaction(async (tx) => {
      const [user] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .for("update");

      if (!user) {
        return null;
      }

      const [wishlist] = await tx
        .select({ slug: wishlists.slug })
        .from(wishlists)
        .where(eq(wishlists.ownerId, userId))
        .limit(1);

      if (wishlist?.slug) {
        const secret = getSlugBlockSecret();

        if (!secret) {
          throw new Error(
            "SLUG_BLOCK_SECRET or AUTH_SECRET is required to withdraw an account.",
          );
        }

        const slugHash = hashWithdrawnSlug(wishlist.slug, secret);
        const blockedUntil = withdrawnSlugBlockedUntil(withdrawnAt);

        await tx
          .insert(withdrawnSlugBlocks)
          .values({ slugHash, blockedUntil })
          .onConflictDoUpdate({
            target: withdrawnSlugBlocks.slugHash,
            set: { blockedUntil },
          });
      }

      await tx.delete(users).where(eq(users.id, userId));

      return { wishlistSlug: wishlist?.slug ?? null };
    });
  }
}
