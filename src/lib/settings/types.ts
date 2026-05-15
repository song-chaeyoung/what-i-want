import type { PublicThemeId } from "@/src/lib/wishlist/theme";

export const ACCOUNT_VISIBILITIES = [
  "always_visible",
  "reveal_on_click",
  "copy_only",
  "hidden",
] as const;

export type AccountVisibility = (typeof ACCOUNT_VISIBILITIES)[number];

export type SettingsProfileRecord = {
  displayName: string;
  birthday: string | null;
  description: string | null;
};

export type SettingsWishlistRecord = {
  id: string;
  slug: string;
  title: string;
  themeId: PublicThemeId;
};

export type SettingsBankAccountRecord = {
  bankName: string;
  accountHolder: string;
  accountNumberEncrypted: string;
  visibility: AccountVisibility;
};

export type SettingsRecord = {
  profile: SettingsProfileRecord;
  wishlist: SettingsWishlistRecord;
  bankAccount: SettingsBankAccountRecord | null;
};

export type UpdateSettingsRecord = {
  profile: SettingsProfileRecord;
  wishlist: Omit<SettingsWishlistRecord, "id">;
  bankAccount: SettingsBankAccountRecord | null;
};

export interface SettingsRepository {
  getSettingsByOwnerId(ownerId: string): Promise<SettingsRecord | null>;
  isWishlistSlugAvailable(slug: string, ownerId: string): Promise<boolean>;
  updateSettings(
    ownerId: string,
    record: UpdateSettingsRecord,
  ): Promise<SettingsRecord>;
}
