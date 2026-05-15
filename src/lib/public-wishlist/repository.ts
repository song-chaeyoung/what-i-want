import { and, asc, desc, eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { bankAccounts, wishItems, wishlists } from "@/src/lib/db/schema";
import type {
  PublicBankAccountRecord,
  PublicWishItemRecord,
  PublicWishlistRecord,
  PublicWishlistRepository,
} from "./types";

export class DrizzlePublicWishlistRepository
  implements PublicWishlistRepository
{
  constructor(private readonly database: Database = db) {}

  async findPublicWishlistBySlug(
    slug: string,
  ): Promise<PublicWishlistRecord | null> {
    const [wishlist] = await this.database
      .select({
        id: wishlists.id,
        slug: wishlists.slug,
        title: wishlists.title,
        themeId: wishlists.themeId,
      })
      .from(wishlists)
      .where(and(eq(wishlists.slug, slug), eq(wishlists.visibility, "public")))
      .limit(1);

    return wishlist ?? null;
  }

  async listWishItems(wishlistId: string): Promise<PublicWishItemRecord[]> {
    const rows = await this.database
      .select()
      .from(wishItems)
      .where(eq(wishItems.wishlistId, wishlistId))
      .orderBy(asc(wishItems.sortOrder), desc(wishItems.createdAt));

    return rows.map(toPublicWishItemRecord);
  }

  async findBankAccountByWishlistId(
    wishlistId: string,
  ): Promise<PublicBankAccountRecord | null> {
    const [row] = await this.database
      .select({
        bankName: bankAccounts.bankName,
        accountHolder: bankAccounts.accountHolder,
        accountNumberEncrypted: bankAccounts.accountNumberEncrypted,
        visibility: bankAccounts.visibility,
      })
      .from(wishlists)
      .innerJoin(bankAccounts, eq(bankAccounts.userId, wishlists.ownerId))
      .where(eq(wishlists.id, wishlistId))
      .limit(1);

    return row ?? null;
  }
}

function toPublicWishItemRecord(
  row: typeof wishItems.$inferSelect,
): PublicWishItemRecord {
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
