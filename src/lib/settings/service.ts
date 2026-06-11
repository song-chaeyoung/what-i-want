import {
  DEFAULT_PUBLIC_THEME_ID,
  isPublicThemeId,
} from "@/src/lib/wishlist/theme";
import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import {
  encryptAccountNumber,
  getAccountEncryptionSecret,
} from "./account-crypto";
import {
  type SettingsBankAccountRecord,
  type SettingsRecord,
  type SettingsRepository,
  type UpdateSettingsRecord,
} from "./types";

const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_WISHLIST_TITLE_LENGTH = 120;
const MAX_ACCOUNT_FIELD_LENGTH = 80;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type UpdateSettingsInput = {
  ownerId: string;
  displayName: string | null;
  description: string | null;
  birthday: string | null;
  wishlistSlug: string | null;
  wishlistTitle: string | null;
  themeId: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  accountVisibility?: string | null;
};

export type SettingsError =
  | "settings_not_found"
  | "display_name_required"
  | "display_name_too_long"
  | "wishlist_title_required"
  | "wishlist_title_too_long"
  | "invalid_slug"
  | "duplicate_slug"
  | "invalid_birthday"
  | "invalid_theme"
  | "bank_name_required"
  | "account_holder_required"
  | "account_number_required"
  | "account_field_too_long"
  | "account_encryption_unavailable";

export type GetSettingsResult =
  | {
      ok: true;
      settings: SettingsRecord;
    }
  | {
      ok: false;
      error: "settings_not_found";
    };

export type UpdateSettingsResult =
  | {
      ok: true;
      settings: SettingsRecord;
    }
  | {
      ok: false;
      error: SettingsError;
    };

export async function getSettings(
  ownerId: string,
  repository: SettingsRepository,
): Promise<GetSettingsResult> {
  const settings = await repository.getSettingsByOwnerId(ownerId);

  if (!settings) {
    return { ok: false, error: "settings_not_found" };
  }

  return { ok: true, settings };
}

export async function updateSettings(
  input: UpdateSettingsInput,
  repository: SettingsRepository,
  encryptionSecret: string | undefined = getAccountEncryptionSecret(),
): Promise<UpdateSettingsResult> {
  const current = await repository.getSettingsByOwnerId(input.ownerId);

  if (!current) {
    return { ok: false, error: "settings_not_found" };
  }

  const record = await normalizeSettingsInput(input, current, encryptionSecret);

  if (!record.ok) {
    return record;
  }

  if (
    record.value.wishlist.slug !== current.wishlist.slug &&
    !(await repository.isWishlistSlugAvailable(
      record.value.wishlist.slug,
      input.ownerId,
    ))
  ) {
    return { ok: false, error: "duplicate_slug" };
  }

  return {
    ok: true,
    settings: await repository.updateSettings(input.ownerId, record.value),
  };
}

async function normalizeSettingsInput(
  input: UpdateSettingsInput,
  current: SettingsRecord,
  encryptionSecret: string | undefined,
): Promise<
  | {
      ok: true;
      value: UpdateSettingsRecord;
    }
  | {
      ok: false;
      error: SettingsError;
    }
> {
  const displayName = normalizeRequiredText(input.displayName);

  if (!displayName) {
    return { ok: false, error: "display_name_required" };
  }

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false, error: "display_name_too_long" };
  }

  const wishlistTitle = normalizeRequiredText(input.wishlistTitle);

  if (!wishlistTitle) {
    return { ok: false, error: "wishlist_title_required" };
  }

  if (wishlistTitle.length > MAX_WISHLIST_TITLE_LENGTH) {
    return { ok: false, error: "wishlist_title_too_long" };
  }

  const slug = parseWishlistSlug(input.wishlistSlug ?? "");

  if (!slug.ok) {
    return { ok: false, error: "invalid_slug" };
  }

  const birthday = normalizeBirthday(input.birthday);

  if (birthday.error) {
    return { ok: false, error: birthday.error };
  }

  const themeId = normalizeTheme(input.themeId);

  if (themeId.error) {
    return { ok: false, error: themeId.error };
  }

  const bankAccount = normalizeBankAccount(
    input,
    current.bankAccount,
    encryptionSecret,
  );

  if (!bankAccount.ok) {
    return bankAccount;
  }

  return {
    ok: true,
    value: {
      profile: {
        displayName,
        birthday: birthday.value,
        description: normalizeOptionalText(input.description),
      },
      wishlist: {
        slug: slug.value,
        title: wishlistTitle,
        themeId: themeId.value,
      },
      bankAccount: bankAccount.value,
    },
  };
}

function normalizeBankAccount(
  input: UpdateSettingsInput,
  current: SettingsBankAccountRecord | null,
  encryptionSecret: string | undefined,
):
  | {
      ok: true;
      value: SettingsBankAccountRecord | null;
    }
  | {
      ok: false;
      error: SettingsError;
    } {
  const bankName = normalizeOptionalText(input.bankName);
  const accountHolder = normalizeOptionalText(input.accountHolder);
  const accountNumber = normalizeOptionalText(input.accountNumber);
  const hasAnyAccountInput =
    Boolean(bankName) ||
    Boolean(accountHolder) ||
    Boolean(accountNumber) ||
    Boolean(current);

  if (!hasAnyAccountInput) {
    return { ok: true, value: null };
  }

  if (!bankName) {
    return { ok: false, error: "bank_name_required" };
  }

  if (!accountHolder) {
    return { ok: false, error: "account_holder_required" };
  }

  if (
    bankName.length > MAX_ACCOUNT_FIELD_LENGTH ||
    accountHolder.length > MAX_ACCOUNT_FIELD_LENGTH
  ) {
    return { ok: false, error: "account_field_too_long" };
  }

  const encryptedAccountNumber = accountNumber
    ? encryptAccountNumber(accountNumber, encryptionSecret)
    : current
      ? { ok: true as const, value: current.accountNumberEncrypted }
      : { ok: false as const, error: "missing_secret" as const };

  if (!accountNumber && !current) {
    return { ok: false, error: "account_number_required" };
  }

  if (!encryptedAccountNumber.ok) {
    return { ok: false, error: "account_encryption_unavailable" };
  }

  return {
    ok: true,
    value: {
      bankName,
      accountHolder,
      accountNumberEncrypted: encryptedAccountNumber.value,
      visibility: "copy_only",
    },
  };
}

function normalizeTheme(value: string | null):
  | {
      value: typeof DEFAULT_PUBLIC_THEME_ID;
      error?: never;
    }
  | {
      value?: never;
      error: "invalid_theme";
    } {
  if (!value) {
    return { value: DEFAULT_PUBLIC_THEME_ID };
  }

  if (!isPublicThemeId(value)) {
    return { error: "invalid_theme" };
  }

  return { value };
}

function normalizeBirthday(value: string | null):
  | {
      value: string | null;
      error?: never;
    }
  | {
      value?: never;
      error: "invalid_birthday";
    } {
  const birthday = normalizeOptionalText(value);

  if (!birthday) {
    return { value: null };
  }

  if (!DATE_PATTERN.test(birthday)) {
    return { error: "invalid_birthday" };
  }

  const date = new Date(`${birthday}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthday) {
    return { error: "invalid_birthday" };
  }

  return { value: birthday };
}

function normalizeRequiredText(value: string | null): string {
  return value?.trim() ?? "";
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
