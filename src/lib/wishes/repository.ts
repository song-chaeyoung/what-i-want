import { and, asc, desc, eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { wishItems, wishlists } from "@/src/lib/db/schema";
import type {
  CreateWishRecord,
  UpdateWishRecord,
  WishItemRecord,
  WishRepository,
  WishlistRecord,
} from "./types";

export class DrizzleWishRepository implements WishRepository {
  constructor(private readonly database: Database = db) {}

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<WishlistRecord | null> {
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

  async listWishItems(wishlistId: string): Promise<WishItemRecord[]> {
    const rows = await this.database
      .select()
      .from(wishItems)
      .where(eq(wishItems.wishlistId, wishlistId))
      .orderBy(asc(wishItems.sortOrder), desc(wishItems.createdAt));

    return rows.map(toWishItemRecord);
  }

  async createWishItem(record: CreateWishRecord): Promise<WishItemRecord> {
    const now = new Date();
    const [item] = await this.database
      .insert(wishItems)
      .values({
        wishlistId: record.wishlistId,
        title: record.title,
        description: record.description,
        targetAmount: record.targetAmount,
        productUrl: record.productUrl,
        imageUrl: record.imageUrl,
        status: record.status,
        updatedAt: now,
      })
      .returning();

    return toWishItemRecord(item);
  }

  async updateWishItem(
    ownerId: string,
    wishItemId: string,
    record: UpdateWishRecord,
  ): Promise<WishItemRecord | null> {
    const item = await this.findOwnedWishItem(ownerId, wishItemId);

    if (!item) {
      return null;
    }

    const [updated] = await this.database
      .update(wishItems)
      .set({
        title: record.title,
        description: record.description,
        targetAmount: record.targetAmount,
        productUrl: record.productUrl,
        imageUrl: record.imageUrl,
        status: record.status,
        updatedAt: new Date(),
      })
      .where(eq(wishItems.id, wishItemId))
      .returning();

    return toWishItemRecord(updated);
  }

  async deleteWishItem(ownerId: string, wishItemId: string): Promise<boolean> {
    const item = await this.findOwnedWishItem(ownerId, wishItemId);

    if (!item) {
      return false;
    }

    await this.database.delete(wishItems).where(eq(wishItems.id, wishItemId));
    return true;
  }

  private async findOwnedWishItem(
    ownerId: string,
    wishItemId: string,
  ): Promise<{ id: string } | null> {
    const [item] = await this.database
      .select({ id: wishItems.id })
      .from(wishItems)
      .innerJoin(wishlists, eq(wishlists.id, wishItems.wishlistId))
      .where(and(eq(wishItems.id, wishItemId), eq(wishlists.ownerId, ownerId)))
      .limit(1);

    return item ?? null;
  }
}

function toWishItemRecord(
  row: typeof wishItems.$inferSelect,
): WishItemRecord {
  return {
    id: row.id,
    wishlistId: row.wishlistId,
    title: row.title,
    description: row.description,
    targetAmount: row.targetAmount,
    fundedAmount: row.fundedAmount,
    productUrl: row.productUrl,
    imageUrl: row.imageUrl,
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
