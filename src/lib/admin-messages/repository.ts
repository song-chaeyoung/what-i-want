import { desc, eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import {
  fundingLogs,
  messages,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import type {
  AdminMessageRecord,
  AdminMessagesRepository,
  AdminMessagesWishlistRecord,
} from "./types";

export class DrizzleAdminMessagesRepository
  implements AdminMessagesRepository
{
  constructor(private readonly database: Database = db) {}

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<AdminMessagesWishlistRecord | null> {
    const [wishlist] = await this.database
      .select({
        id: wishlists.id,
        slug: wishlists.slug,
        title: wishlists.title,
      })
      .from(wishlists)
      .where(eq(wishlists.ownerId, ownerId))
      .limit(1);

    return wishlist ?? null;
  }

  async listMessages(wishlistId: string): Promise<AdminMessageRecord[]> {
    return this.database
      .select({
        id: messages.id,
        wishlistId: messages.wishlistId,
        wishItemId: messages.wishItemId,
        wishTitle: wishItems.title,
        senderName: messages.senderName,
        body: messages.body,
        amount: fundingLogs.amount,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(wishItems, eq(messages.wishItemId, wishItems.id))
      .leftJoin(fundingLogs, eq(fundingLogs.messageId, messages.id))
      .where(eq(messages.wishlistId, wishlistId))
      .orderBy(desc(messages.createdAt));
  }
}
