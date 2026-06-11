import { and, eq, ne, sql } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import {
  fundingLogs,
  messages,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import type {
  CreatePublicParticipationRecord,
  PublicParticipationRepository,
  PublicParticipationWishlistRecord,
  PublicParticipationWishItemRecord,
} from "./types";

export class DrizzlePublicParticipationRepository
  implements PublicParticipationRepository
{
  constructor(private readonly database: Database = db) {}

  async findPublicWishlistBySlug(
    slug: string,
  ): Promise<PublicParticipationWishlistRecord | null> {
    const [wishlist] = await this.database
      .select({
        id: wishlists.id,
        slug: wishlists.slug,
      })
      .from(wishlists)
      .where(and(eq(wishlists.slug, slug), eq(wishlists.visibility, "public")))
      .limit(1);

    return wishlist ?? null;
  }

  async findVisibleWishItem(
    wishlistId: string,
    wishItemId: string,
  ): Promise<PublicParticipationWishItemRecord | null> {
    const [item] = await this.database
      .select({
        id: wishItems.id,
        wishlistId: wishItems.wishlistId,
        status: wishItems.status,
      })
      .from(wishItems)
      .where(
        and(
          eq(wishItems.id, wishItemId),
          eq(wishItems.wishlistId, wishlistId),
          ne(wishItems.status, "hidden"),
        ),
      )
      .limit(1);

    return item ?? null;
  }

  async createPublicParticipation(
    record: CreatePublicParticipationRecord,
  ): Promise<void> {
    const funding = record.funding;

    if (!funding) {
      await this.database
        .insert(messages)
        .values({
          wishlistId: record.message.wishlistId,
          wishItemId: record.message.wishItemId,
          senderName: record.message.senderName,
          body: record.message.body,
          clientRequestId: record.message.clientRequestId,
        })
        .onConflictDoNothing({ target: messages.clientRequestId });
      return;
    }

    await this.database.transaction(async (tx) => {
      const [message] = await tx
        .insert(messages)
        .values({
          wishlistId: record.message.wishlistId,
          wishItemId: record.message.wishItemId,
          senderName: record.message.senderName,
          body: record.message.body,
          clientRequestId: record.message.clientRequestId,
        })
        .onConflictDoNothing({ target: messages.clientRequestId })
        .returning({ id: messages.id });

      // Duplicate client request id: the participation is already recorded,
      // so skip the funding insert and amount update.
      if (!message) {
        return;
      }

      await tx.insert(fundingLogs).values({
        wishItemId: funding.wishItemId,
        messageId: message.id,
        amount: funding.amount,
      });

      const [updatedWishItem] = await tx
        .update(wishItems)
        .set({
          fundedAmount: sql`${wishItems.fundedAmount} + ${funding.amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(wishItems.id, funding.wishItemId),
            eq(wishItems.wishlistId, funding.wishlistId),
          ),
        )
        .returning({ id: wishItems.id });

      if (!updatedWishItem) {
        throw new Error("Wish item was not updated for public participation.");
      }
    });
  }
}
