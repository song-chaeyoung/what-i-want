import { eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import {
  bankAccounts,
  profiles,
  wishlists,
} from "@/src/lib/db/schema";
import type {
  AccountVisibility,
  SettingsBankAccountRecord,
  SettingsRecord,
  SettingsRepository,
  UpdateSettingsRecord,
} from "./types";

export class DrizzleSettingsRepository implements SettingsRepository {
  constructor(private readonly database: Database = db) {}

  async getSettingsByOwnerId(ownerId: string): Promise<SettingsRecord | null> {
    const [row] = await this.database
      .select({
        displayName: profiles.displayName,
        birthday: profiles.birthday,
        description: profiles.description,
        wishlistId: wishlists.id,
        wishlistSlug: wishlists.slug,
        wishlistTitle: wishlists.title,
        wishlistThemeId: wishlists.themeId,
        bankName: bankAccounts.bankName,
        accountHolder: bankAccounts.accountHolder,
        accountNumberEncrypted: bankAccounts.accountNumberEncrypted,
        accountVisibility: bankAccounts.visibility,
      })
      .from(profiles)
      .innerJoin(wishlists, eq(wishlists.ownerId, profiles.userId))
      .leftJoin(bankAccounts, eq(bankAccounts.userId, profiles.userId))
      .where(eq(profiles.userId, ownerId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      profile: {
        displayName: row.displayName,
        birthday: row.birthday,
        description: row.description,
      },
      wishlist: {
        id: row.wishlistId,
        slug: row.wishlistSlug,
        title: row.wishlistTitle,
        themeId: row.wishlistThemeId,
      },
      bankAccount: toBankAccountRecord(row),
    };
  }

  async isWishlistSlugAvailable(
    slug: string,
    ownerId: string,
  ): Promise<boolean> {
    const [wishlist] = await this.database
      .select({ ownerId: wishlists.ownerId })
      .from(wishlists)
      .where(eq(wishlists.slug, slug))
      .limit(1);

    return !wishlist || wishlist.ownerId === ownerId;
  }

  async updateSettings(
    ownerId: string,
    record: UpdateSettingsRecord,
  ): Promise<SettingsRecord> {
    const now = new Date();

    await this.database.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          displayName: record.profile.displayName,
          birthday: record.profile.birthday,
          description: record.profile.description,
          updatedAt: now,
        })
        .where(eq(profiles.userId, ownerId));

      await tx
        .update(wishlists)
        .set({
          slug: record.wishlist.slug,
          title: record.wishlist.title,
          themeId: record.wishlist.themeId,
          updatedAt: now,
        })
        .where(eq(wishlists.ownerId, ownerId));

      if (!record.bankAccount) {
        return;
      }

      const [existingAccount] = await tx
        .select({ id: bankAccounts.id })
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, ownerId))
        .limit(1);

      if (existingAccount) {
        await tx
          .update(bankAccounts)
          .set({
            bankName: record.bankAccount.bankName,
            accountHolder: record.bankAccount.accountHolder,
            accountNumberEncrypted: record.bankAccount.accountNumberEncrypted,
            visibility: record.bankAccount.visibility,
            updatedAt: now,
          })
          .where(eq(bankAccounts.id, existingAccount.id));
        return;
      }

      await tx.insert(bankAccounts).values({
        userId: ownerId,
        bankName: record.bankAccount.bankName,
        accountHolder: record.bankAccount.accountHolder,
        accountNumberEncrypted: record.bankAccount.accountNumberEncrypted,
        visibility: record.bankAccount.visibility,
        updatedAt: now,
      });
    });

    const settings = await this.getSettingsByOwnerId(ownerId);

    if (!settings) {
      throw new Error("Settings update succeeded but settings were not found.");
    }

    return settings;
  }
}

function toBankAccountRecord(row: {
  bankName: string | null;
  accountHolder: string | null;
  accountNumberEncrypted: string | null;
  accountVisibility: AccountVisibility | null;
}): SettingsBankAccountRecord | null {
  if (
    !row.bankName ||
    !row.accountHolder ||
    !row.accountNumberEncrypted ||
    !row.accountVisibility
  ) {
    return null;
  }

  return {
    bankName: row.bankName,
    accountHolder: row.accountHolder,
    accountNumberEncrypted: row.accountNumberEncrypted,
    visibility: row.accountVisibility,
  };
}
