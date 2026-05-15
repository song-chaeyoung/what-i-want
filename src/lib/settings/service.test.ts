import { describe, expect, test } from "vitest";
import {
  getSettings,
  updateSettings,
  type UpdateSettingsInput,
} from "./service";
import type {
  SettingsBankAccountRecord,
  SettingsRecord,
  SettingsRepository,
  UpdateSettingsRecord,
} from "./types";

class FakeSettingsRepository implements SettingsRepository {
  settings: SettingsRecord | null = makeSettings();
  slugAvailable = true;
  requestedSlugChecks: Array<{ slug: string; ownerId: string }> = [];
  updated: UpdateSettingsRecord[] = [];

  async getSettingsByOwnerId(): Promise<SettingsRecord | null> {
    return this.settings;
  }

  async isWishlistSlugAvailable(
    slug: string,
    ownerId: string,
  ): Promise<boolean> {
    this.requestedSlugChecks.push({ slug, ownerId });
    return this.slugAvailable;
  }

  async updateSettings(
    ownerId: string,
    record: UpdateSettingsRecord,
  ): Promise<SettingsRecord> {
    this.updated.push(record);
    const updated = makeSettings({
      profile: {
        displayName: record.profile.displayName,
        birthday: record.profile.birthday,
        description: record.profile.description,
      },
      wishlist: {
        id: this.settings?.wishlist.id ?? "wishlist-1",
        slug: record.wishlist.slug,
        title: record.wishlist.title,
        themeId: record.wishlist.themeId,
      },
      bankAccount: record.bankAccount
        ? {
            bankName: record.bankAccount.bankName,
            accountHolder: record.bankAccount.accountHolder,
            accountNumberEncrypted: record.bankAccount.accountNumberEncrypted,
            visibility: record.bankAccount.visibility,
          }
        : null,
    });

    this.settings = updated;
    expect(ownerId).toBe("user-1");
    return updated;
  }
}

describe("admin settings service", () => {
  test("loads the owner's settings", async () => {
    const repository = new FakeSettingsRepository();

    const result = await getSettings("user-1", repository);

    expect(result).toEqual({ ok: true, settings: repository.settings });
  });

  test("normalizes profile, wishlist, and new bank account settings", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const result = await updateSettings(
      makeInput({
        displayName: "  차차  ",
        description: "  생일 선물만 받습니다  ",
        birthday: "2026-05-15",
        wishlistSlug: "  CHA-BIRTHDAY  ",
        wishlistTitle: "  차차의 갖고 싶은 것  ",
        themeId: "mono_bw",
        bankName: "  카카오뱅크  ",
        accountHolder: "  차차  ",
        accountNumber: "  3333-12-1234567  ",
        accountVisibility: "reveal_on_click",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: {
        profile: {
          displayName: "차차",
          birthday: "2026-05-15",
          description: "생일 선물만 받습니다",
        },
        wishlist: {
          slug: "cha-birthday",
          title: "차차의 갖고 싶은 것",
          themeId: "mono_bw",
        },
        bankAccount: {
          bankName: "카카오뱅크",
          accountHolder: "차차",
          visibility: "reveal_on_click",
        },
      },
    });
    expect(repository.requestedSlugChecks).toEqual([
      { slug: "cha-birthday", ownerId: "user-1" },
    ]);
    expect(repository.updated[0].bankAccount?.accountNumberEncrypted).not.toContain(
      "3333-12-1234567",
    );
  });

  test("keeps an existing encrypted account number when the update omits it", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({
      bankAccount: makeBankAccount({
        accountNumberEncrypted: "v1:existing-ciphertext",
      }),
    });

    const result = await updateSettings(
      makeInput({
        accountNumber: "",
        bankName: "국민은행",
        accountHolder: "차차",
        accountVisibility: "copy_only",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: {
        bankAccount: {
          bankName: "국민은행",
          accountHolder: "차차",
          accountNumberEncrypted: "v1:existing-ciphertext",
          visibility: "copy_only",
        },
      },
    });
    expect(repository.updated[0].bankAccount?.accountNumberEncrypted).toBe(
      "v1:existing-ciphertext",
    );
  });

  test("rejects invalid identity and wishlist input", async () => {
    const repository = new FakeSettingsRepository();

    await expect(
      updateSettings(makeInput({ displayName: "   " }), repository, "secret"),
    ).resolves.toEqual({ ok: false, error: "display_name_required" });

    await expect(
      updateSettings(makeInput({ wishlistSlug: "NO SPACE" }), repository, "secret"),
    ).resolves.toEqual({ ok: false, error: "invalid_slug" });

    await expect(
      updateSettings(makeInput({ birthday: "2026-15-01" }), repository, "secret"),
    ).resolves.toEqual({ ok: false, error: "invalid_birthday" });
  });

  test("rejects duplicate slugs when the slug changes", async () => {
    const repository = new FakeSettingsRepository();
    repository.slugAvailable = false;

    const result = await updateSettings(
      makeInput({
        wishlistSlug: "taken-slug",
        bankName: "신한은행",
        accountHolder: "차차",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result).toEqual({ ok: false, error: "duplicate_slug" });
  });

  test("requires complete bank account fields before creating a public account", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const result = await updateSettings(
      makeInput({
        bankName: "카카오뱅크",
        accountHolder: "차차",
        accountNumber: "",
        accountVisibility: "always_visible",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result).toEqual({ ok: false, error: "account_number_required" });
    expect(repository.updated).toEqual([]);
  });
});

function makeInput(
  overrides: Partial<UpdateSettingsInput> = {},
): UpdateSettingsInput {
  return {
    ownerId: "user-1",
    displayName: "차차",
    description: null,
    birthday: null,
    wishlistSlug: "birthday",
    wishlistTitle: "차차님의 위시리스트",
    themeId: "pixel_y2k",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    accountVisibility: "hidden",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<SettingsRecord> = {}): SettingsRecord {
  return {
    profile: {
      displayName: "차차",
      birthday: null,
      description: null,
    },
    wishlist: {
      id: "wishlist-1",
      slug: "birthday",
      title: "차차님의 위시리스트",
      themeId: "pixel_y2k",
    },
    bankAccount: makeBankAccount(),
    ...overrides,
  };
}

function makeBankAccount(
  overrides: Partial<SettingsBankAccountRecord> = {},
): SettingsBankAccountRecord {
  return {
    bankName: "신한은행",
    accountHolder: "차차",
    accountNumberEncrypted: "v1:ciphertext",
    visibility: "hidden",
    ...overrides,
  };
}
