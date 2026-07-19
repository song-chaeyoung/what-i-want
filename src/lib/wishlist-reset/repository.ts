import { eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { messages, wishItems, wishlists } from "@/src/lib/db/schema";
import type {
  WishlistResetRepository,
  WishlistResetWishlistRecord,
} from "./types";

export class DrizzleWishlistResetRepository implements WishlistResetRepository {
  constructor(private readonly database: Database = db) {}

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<WishlistResetWishlistRecord | null> {
    const [wishlist] = await this.database
      .select({
        id: wishlists.id,
        slug: wishlists.slug,
      })
      .from(wishlists)
      .where(eq(wishlists.ownerId, ownerId))
      .limit(1);

    return wishlist ?? null;
  }

  // 선물을 먼저 지워 펀딩 로그를 cascade로 정리한 뒤 메시지를 지운다.
  // 프로필, 공개 주소, 테마, 계좌 안내는 그대로 유지한다.
  async resetWishlistContent(wishlistId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.delete(wishItems).where(eq(wishItems.wishlistId, wishlistId));
      await tx.delete(messages).where(eq(messages.wishlistId, wishlistId));
      await tx
        .update(wishlists)
        .set({ messagesReadAt: null, updatedAt: new Date() })
        .where(eq(wishlists.id, wishlistId));
    });
  }
}
