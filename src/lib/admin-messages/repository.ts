import { and, desc, eq, sql } from "drizzle-orm";
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

  async listMessages(
    wishlistId: string,
    options: { hidden?: boolean } = {},
  ): Promise<AdminMessageRecord[]> {
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
      .where(
        and(
          eq(messages.wishlistId, wishlistId),
          eq(messages.isHidden, options.hidden === true),
        ),
      )
      .orderBy(desc(messages.createdAt));
  }

  // 숨김/해제 시 펀딩 로그는 보존하고 모인 금액만 가감한다.
  // 숨겨진 참여의 로그는 메시지의 isHidden으로 활성 여부를 판별한다.
  async hideMessage(wishlistId: string, messageId: string): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const [hidden] = await tx
        .update(messages)
        .set({ isHidden: true })
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.wishlistId, wishlistId),
            eq(messages.isHidden, false),
          ),
        )
        .returning({ id: messages.id });

      if (!hidden) {
        return false;
      }

      await this.applyFundingDelta(tx, messageId, "subtract");

      return true;
    });
  }

  async unhideMessage(wishlistId: string, messageId: string): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const [restored] = await tx
        .update(messages)
        .set({ isHidden: false })
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.wishlistId, wishlistId),
            eq(messages.isHidden, true),
          ),
        )
        .returning({ id: messages.id });

      if (!restored) {
        return false;
      }

      await this.applyFundingDelta(tx, messageId, "add");

      return true;
    });
  }

  private async applyFundingDelta(
    tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
    messageId: string,
    direction: "add" | "subtract",
  ): Promise<void> {
    const [funding] = await tx
      .select({
        wishItemId: fundingLogs.wishItemId,
        amount: fundingLogs.amount,
      })
      .from(fundingLogs)
      .where(eq(fundingLogs.messageId, messageId))
      .limit(1);

    if (!funding) {
      return;
    }

    await tx
      .update(wishItems)
      .set({
        fundedAmount:
          direction === "subtract"
            ? sql`GREATEST(0, ${wishItems.fundedAmount} - ${funding.amount})`
            : sql`${wishItems.fundedAmount} + ${funding.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wishItems.id, funding.wishItemId));
  }
}
