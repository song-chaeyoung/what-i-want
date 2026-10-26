import { and, eq, ne, sql, TransactionRollbackError } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import {
  fundingLogs,
  messages,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import type {
  CreatePublicParticipationRecord,
  CreatePublicParticipationResult,
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
  ): Promise<CreatePublicParticipationResult> {
    const funding = record.funding;

    if (!funding) {
      const [message] = await this.database
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

      return message
        ? { status: "created" }
        : this.findDuplicateParticipation(record.message.clientRequestId);
    }

    let created: boolean;

    try {
      created = await this.database.transaction(async (tx) => {
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
          return false;
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
              eq(wishItems.status, "open"),
            ),
          )
          .returning({ id: wishItems.id });

        // The wish is no longer open: undo the inserts above. A deleted wish
        // never gets here; the message insert fails its foreign key first.
        if (!updatedWishItem) {
          tx.rollback();
        }

        return true;
      });
    } catch (error) {
      if (error instanceof TransactionRollbackError) {
        return { status: "not_open" };
      }

      throw error;
    }

    return created
      ? { status: "created" }
      : this.findDuplicateParticipation(record.message.clientRequestId);
  }

  private async findDuplicateParticipation(
    clientRequestId: string | null,
  ): Promise<CreatePublicParticipationResult> {
    // A null client request id never conflicts on the unique index.
    if (!clientRequestId) {
      throw new Error("Public participation conflicted without a request id.");
    }

    const [existing] = await this.database
      .select({
        wishlistId: messages.wishlistId,
        wishItemId: messages.wishItemId,
        senderName: messages.senderName,
        body: messages.body,
        amount: fundingLogs.amount,
      })
      .from(messages)
      .leftJoin(fundingLogs, eq(fundingLogs.messageId, messages.id))
      .where(eq(messages.clientRequestId, clientRequestId))
      .limit(1);

    if (!existing) {
      throw new Error("Duplicate public participation was not found.");
    }

    return { status: "duplicate", existing };
  }
}
