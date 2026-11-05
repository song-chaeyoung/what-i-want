import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { decryptAccountNumber } from "./account-crypto";
import { INVALID_ACCOUNT_NUMBER_MESSAGE } from "./account-number";
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
        visibility: record.wishlist.visibility,
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
        birthday: "2000-05-15",
        wishlistSlug: "  CHA-BIRTHDAY  ",
        wishlistTitle: "  차차의 갖고 싶은 것  ",
        themeId: "mono_bw",
        bankName: "  카카오뱅크  ",
        accountHolder: "  차차  ",
        accountNumber: "  3333-12-1234567  ",
        accountVisibility: null,
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: {
        profile: {
          displayName: "차차",
          birthday: "2000-05-15",
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
          visibility: "copy_only",
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
        visibility: "hidden",
      }),
    });

    const result = await updateSettings(
      makeInput({
        accountNumber: "",
        bankName: "국민은행",
        accountHolder: "차차",
        accountVisibility: null,
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
          visibility: "hidden",
        },
      },
    });
    expect(repository.updated[0].bankAccount?.accountNumberEncrypted).toBe(
      "v1:existing-ciphertext",
    );
  });

  test("hides a saved account without dropping its details and shows it again", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({
      bankAccount: makeBankAccount({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumberEncrypted: "v1:existing-ciphertext",
        visibility: "copy_only",
      }),
    });

    const hidden = await updateSettings(
      makeInput({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumber: "",
        accountVisibility: "hidden",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(hidden).toMatchObject({
      ok: true,
      settings: {
        bankAccount: {
          bankName: "국민은행",
          accountHolder: "차차",
          accountNumberEncrypted: "v1:existing-ciphertext",
          visibility: "hidden",
        },
      },
    });

    const shown = await updateSettings(
      makeInput({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumber: "",
        accountVisibility: "copy_only",
      }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(shown).toMatchObject({
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
  });

  test("keeps a legacy account visibility when the update omits it", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({
      bankAccount: makeBankAccount({ visibility: "always_visible" }),
    });

    const result = await updateSettings(
      makeInput({
        bankName: "신한은행",
        accountHolder: "차차",
        accountVisibility: null,
      }),
      repository,
      "secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: { bankAccount: { visibility: "always_visible" } },
    });
  });

  test("saves a newly entered account number made of digits and hyphens", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });
    const secret = "test-secret-test-secret-test-secret-test-secret";

    const result = await updateSettings(
      makeInput({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumber: "3333-12-1234567",
      }),
      repository,
      secret,
    );

    expect(result).toMatchObject({ ok: true });
    expect(
      decryptAccountNumber(
        repository.updated[0].bankAccount?.accountNumberEncrypted ?? "",
        secret,
      ),
    ).toBe("3333-12-1234567");
    expect(INVALID_ACCOUNT_NUMBER_MESSAGE).toBe(
      "계좌번호는 숫자와 하이픈(-)만 입력해 주세요.",
    );
  });

  test("strips whitespace from a new account number before validating and saving", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });
    const secret = "test-secret-test-secret-test-secret-test-secret";

    const result = await updateSettings(
      makeInput({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumber: "  3333 12-\n1234567\t",
      }),
      repository,
      secret,
    );

    expect(result).toMatchObject({ ok: true });
    expect(
      decryptAccountNumber(
        repository.updated[0].bankAccount?.accountNumberEncrypted ?? "",
        secret,
      ),
    ).toBe("333312-1234567");
  });

  test.each(["12345678", "1".repeat(30), "1234-5678"])(
    "accepts account number length boundary %j",
    async (accountNumber) => {
      const repository = new FakeSettingsRepository();
      repository.settings = makeSettings({ bankAccount: null });

      const result = await updateSettings(
        makeInput({
          bankName: "국민은행",
          accountHolder: "차차",
          accountNumber,
        }),
        repository,
        "test-secret-test-secret-test-secret-test-secret",
      );

      expect(result).toMatchObject({ ok: true });
    },
  );

  test.each([
    "3333-12-AB1234",
    "3333/12/1234567",
    "1234567",
    "1".repeat(31),
    "--------",
    "-".repeat(30),
  ])("rejects account number %j", async (accountNumber) => {
    const repository = new FakeSettingsRepository();

    await expect(
      updateSettings(
        makeInput({
          bankName: "국민은행",
          accountHolder: "차차",
          accountNumber,
        }),
        repository,
        "secret",
      ),
    ).resolves.toEqual({ ok: false, error: "invalid_account_number" });
    expect(repository.updated).toEqual([]);
  });

  test("keeps the saved account number when the field is blank or only whitespace", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({
      bankAccount: makeBankAccount({
        accountNumberEncrypted: "v1:existing-ciphertext",
      }),
    });

    const blank = await updateSettings(
      makeInput({
        bankName: "국민은행",
        accountHolder: "차차",
        accountNumber: "   \n\t",
      }),
      repository,
      "secret",
    );

    expect(blank).toMatchObject({
      ok: true,
      settings: {
        bankAccount: { accountNumberEncrypted: "v1:existing-ciphertext" },
      },
    });
    expect(repository.updated).toHaveLength(1);
  });

  test.each(["always_visible", "reveal_on_click", "secret"])(
    "rejects account visibility %j",
    async (accountVisibility) => {
      const repository = new FakeSettingsRepository();

      await expect(
        updateSettings(
          makeInput({
            bankName: "국민은행",
            accountHolder: "차차",
            accountVisibility,
          }),
          repository,
          "secret",
        ),
      ).resolves.toEqual({ ok: false, error: "invalid_account_visibility" });
      expect(repository.updated).toEqual([]);
    },
  );

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

  describe("birthday age checks", () => {
    // 나이 판정은 KST 날짜 기준이므로, 실행 환경의 시간대·날짜와 무관하게 오늘을 고정한다.
    beforeEach(() => {
      vi.setSystemTime(new Date("2026-10-24T09:00:00+09:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("rejects a future birthday as invalid without saving", async () => {
      const repository = new FakeSettingsRepository();

      await expect(
        updateSettings(
          makeInput({ birthday: "2026-10-25" }),
          repository,
          "secret",
        ),
      ).resolves.toEqual({ ok: false, error: "invalid_birthday" });
      expect(repository.updated).toEqual([]);
    });

    test("rejects a birthday under the minimum signup age without saving", async () => {
      const repository = new FakeSettingsRepository();

      await expect(
        updateSettings(
          makeInput({ birthday: "2012-10-25" }),
          repository,
          "secret",
        ),
      ).resolves.toEqual({ ok: false, error: "under_minimum_age" });
      expect(repository.updated).toEqual([]);
    });
  });

  test("updates wishlist visibility and keeps it when the input omits it", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const hidden = await updateSettings(
      makeInput({ wishlistVisibility: "private" }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(hidden).toMatchObject({
      ok: true,
      settings: { wishlist: { visibility: "private" } },
    });

    const kept = await updateSettings(
      makeInput({ wishlistVisibility: null }),
      repository,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(kept).toMatchObject({
      ok: true,
      settings: { wishlist: { visibility: "private" } },
    });
  });

  test("rejects unsupported wishlist visibility values", async () => {
    const repository = new FakeSettingsRepository();

    await expect(
      updateSettings(
        makeInput({ wishlistVisibility: "secret" }),
        repository,
        "secret",
      ),
    ).resolves.toEqual({ ok: false, error: "invalid_wishlist_visibility" });
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

  test.each(["sample", "SAMPLE", "  SaMpLe  "])(
    "rejects the reserved wishlist slug %j before checking or saving it",
    async (wishlistSlug) => {
      const repository = new FakeSettingsRepository();
      repository.settings = makeSettings({ bankAccount: null });

      const result = await updateSettings(
        makeInput({ wishlistSlug }),
        repository,
        "secret",
      );

      expect(result).toEqual({ ok: false, error: "reserved_slug" });
      expect(repository.requestedSlugChecks).toEqual([]);
      expect(repository.updated).toEqual([]);
    },
  );

  test("allows a wishlist slug that starts with the reserved word", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const result = await updateSettings(
      makeInput({ wishlistSlug: "sample-gift" }),
      repository,
      "secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: { wishlist: { slug: "sample-gift" } },
    });
    expect(repository.requestedSlugChecks).toEqual([
      { slug: "sample-gift", ownerId: "user-1" },
    ]);
    expect(repository.updated).toHaveLength(1);
  });

  test("allows the reserved word as a display name with a different slug", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const result = await updateSettings(
      makeInput({ displayName: "sample", wishlistSlug: "my-birthday" }),
      repository,
      "secret",
    );

    expect(result).toMatchObject({
      ok: true,
      settings: {
        profile: { displayName: "sample" },
        wishlist: { slug: "my-birthday" },
      },
    });
    expect(repository.updated).toHaveLength(1);
  });

  test("requires complete bank account fields before creating a public account", async () => {
    const repository = new FakeSettingsRepository();
    repository.settings = makeSettings({ bankAccount: null });

    const result = await updateSettings(
      makeInput({
        bankName: "카카오뱅크",
        accountHolder: "차차",
        accountNumber: "",
        accountVisibility: null,
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
    wishlistVisibility: null,
    themeId: "pixel_y2k",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    accountVisibility: null,
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
      visibility: "public",
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
