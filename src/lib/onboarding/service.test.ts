import { describe, expect, test } from "vitest";
import { completeOnboarding } from "./service";
import type {
  CompleteOnboardingPersistResult,
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "./types";

class FakeOnboardingRepository implements OnboardingRepository {
  completed = false;
  slugAvailability: boolean[] = [true];
  requestedSlugs: string[] = [];
  records: CompleteOnboardingRecord[] = [];
  deletedUserIds: string[] = [];
  // 삭제 직전에 다른 요청이 온보딩을 마친 경우를 흉내 낸다.
  completedBeforeDelete = false;
  persistResult: CompleteOnboardingPersistResult = { ok: true };

  async hasCompletedOnboarding(): Promise<boolean> {
    return this.completed;
  }

  async isWishlistSlugAvailable(slug: string): Promise<boolean> {
    this.requestedSlugs.push(slug);
    return this.slugAvailability.shift() ?? true;
  }

  async completeOnboarding(
    record: CompleteOnboardingRecord,
  ): Promise<CompleteOnboardingPersistResult> {
    this.records.push(record);
    return this.persistResult;
  }

  async deleteIncompleteUser(userId: string): Promise<boolean> {
    if (this.completed || this.completedBeforeDelete) {
      return false;
    }

    this.deletedUserIds.push(userId);
    return true;
  }
}

describe("completeOnboarding", () => {
  test("requires a display name", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "   ",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
    );

    expect(result).toEqual({
      ok: false,
      error: "display_name_required",
    });
    expect(repository.records).toEqual([]);
  });

  test("generates and stores a random wishlist slug", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(result).toEqual({ ok: true, wishlistSlug: "w-a3f91c0e7b42d8aa" });
    expect(repository.requestedSlugs).toEqual(["w-a3f91c0e7b42d8aa"]);
    expect(repository.records[0]?.wishlistSlug).toBe("w-a3f91c0e7b42d8aa");
  });

  test("retries when a generated wishlist slug is unavailable", async () => {
    const repository = new FakeOnboardingRepository();
    repository.slugAvailability = [false, true];
    const generatedSlugs = ["w-1111111111111111", "w-2222222222222222"];

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => generatedSlugs.shift() ?? "w-fallback",
      },
    );

    expect(result).toEqual({ ok: true, wishlistSlug: "w-2222222222222222" });
    expect(repository.requestedSlugs).toEqual([
      "w-1111111111111111",
      "w-2222222222222222",
    ]);
    expect(repository.records[0]?.wishlistSlug).toBe("w-2222222222222222");
  });

  test("returns a domain-specific error after exhausting generated slugs", async () => {
    const repository = new FakeOnboardingRepository();
    repository.slugAvailability = Array.from({ length: 5 }, () => false);

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-1111111111111111",
      },
    );

    expect(result).toEqual({ ok: false, error: "duplicate_slug" });
    expect(repository.requestedSlugs).toHaveLength(5);
    expect(repository.records).toEqual([]);
  });

  test("propagates persistence conflicts from concurrent submissions", async () => {
    const repository = new FakeOnboardingRepository();
    repository.persistResult = { ok: false, error: "already_completed" };

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(result).toEqual({ ok: false, error: "already_completed" });
  });

  test("allows birthday to be null", async () => {
    const repository = new FakeOnboardingRepository();

    await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(repository.records[0]?.birthday).toBeNull();
  });

  test("rejects birthday values that are not yyyy-mm-dd", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: "2026-5-14",
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(result).toEqual({ ok: false, error: "invalid_birthday" });
    expect(repository.records).toEqual([]);
  });

  test("rejects impossible calendar dates", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: "2026-02-30",
        description: null,
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(result).toEqual({ ok: false, error: "invalid_birthday" });
    expect(repository.records).toEqual([]);
  });

  test("creates a profile and default wishlist through the repository port", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: "2000-05-14",
        description: "생일 선물 목록",
        ageConfirmed: true,
      },
      repository,
      {
        createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
      },
    );

    expect(result).toEqual({ ok: true, wishlistSlug: "w-a3f91c0e7b42d8aa" });
    expect(repository.records).toEqual([
      {
        userId: "user-1",
        displayName: "민지",
        description: "생일 선물 목록",
        birthday: "2000-05-14",
        wishlistSlug: "w-a3f91c0e7b42d8aa",
        wishlistTitle: "민지님의 위시리스트",
        wishlistThemeId: "pixel_y2k",
        wishlistVisibility: "public",
      },
    ]);
  });

  describe("minimum signup age", () => {
    async function submit(
      input: { birthday: string | null; ageConfirmed: boolean },
      now: Date,
      {
        completed = false,
        completedBeforeDelete = false,
      }: { completed?: boolean; completedBeforeDelete?: boolean } = {},
    ) {
      const repository = new FakeOnboardingRepository();
      repository.completed = completed;
      repository.completedBeforeDelete = completedBeforeDelete;
      const result = await completeOnboarding(
        {
          userId: "user-1",
          displayName: "민지",
          description: null,
          ...input,
        },
        repository,
        {
          createWishlistSlug: () => "w-a3f91c0e7b42d8aa",
          now,
        },
      );

      return {
        result,
        records: repository.records,
        deletedUserIds: repository.deletedUserIds,
      };
    }

    const kstMidnight = new Date("2026-10-24T00:00:00+09:00");

    test("requires the 14-or-older confirmation", async () => {
      const { result, records } = await submit(
        { birthday: null, ageConfirmed: false },
        kstMidnight,
      );

      expect(result).toEqual({ ok: false, error: "age_confirmation_required" });
      expect(records).toEqual([]);
    });

    test("rejects a birthday under 14 and deletes the signed-in user", async () => {
      const { result, records, deletedUserIds } = await submit(
        { birthday: "2012-10-25", ageConfirmed: true },
        kstMidnight,
      );

      expect(result).toEqual({ ok: false, error: "under_minimum_age" });
      expect(records).toEqual([]);
      expect(deletedUserIds).toEqual(["user-1"]);
    });

    test("deletes an under-14 signup even without the confirmation", async () => {
      const { result, deletedUserIds } = await submit(
        { birthday: "2015-06-01", ageConfirmed: false },
        kstMidnight,
      );

      expect(result).toEqual({ ok: false, error: "under_minimum_age" });
      expect(deletedUserIds).toEqual(["user-1"]);
    });

    test("never deletes a user who already completed onboarding", async () => {
      const { result, deletedUserIds } = await submit(
        { birthday: "2012-10-25", ageConfirmed: true },
        kstMidnight,
        { completed: true },
      );

      expect(result).toEqual({ ok: false, error: "already_completed" });
      expect(deletedUserIds).toEqual([]);
    });

    test("does not report a deletion when onboarding completed concurrently", async () => {
      const { result, records, deletedUserIds } = await submit(
        { birthday: "2012-10-25", ageConfirmed: true },
        kstMidnight,
        { completedBeforeDelete: true },
      );

      expect(result).toEqual({ ok: false, error: "already_completed" });
      expect(records).toEqual([]);
      expect(deletedUserIds).toEqual([]);
    });

    test("rejects a future birthday as invalid without deleting the user", async () => {
      const { result, records, deletedUserIds } = await submit(
        { birthday: "2026-10-25", ageConfirmed: true },
        kstMidnight,
      );

      expect(result).toEqual({ ok: false, error: "invalid_birthday" });
      expect(records).toEqual([]);
      expect(deletedUserIds).toEqual([]);
    });

    test("treats today's date in KST as a real (not future) birthday", async () => {
      const { result, deletedUserIds } = await submit(
        { birthday: "2026-10-24", ageConfirmed: true },
        kstMidnight,
      );

      expect(result).toEqual({ ok: false, error: "under_minimum_age" });
      expect(deletedUserIds).toEqual(["user-1"]);
    });

    test("allows signup on the 14th birthday in KST", async () => {
      const { result } = await submit(
        { birthday: "2012-10-24", ageConfirmed: true },
        kstMidnight,
      );

      expect(result).toEqual({ ok: true, wishlistSlug: "w-a3f91c0e7b42d8aa" });
    });

    test("treats Feb 29 birthdays as turning 14 on Mar 1 in common years", async () => {
      const birthday = "2012-02-29";

      const beforeBirthday = await submit(
        { birthday, ageConfirmed: true },
        new Date("2026-02-28T12:00:00+09:00"),
      );
      const afterBirthday = await submit(
        { birthday, ageConfirmed: true },
        new Date("2026-03-01T00:00:00+09:00"),
      );

      expect(beforeBirthday.result).toEqual({
        ok: false,
        error: "under_minimum_age",
      });
      expect(afterBirthday.result.ok).toBe(true);
    });

    test("uses Feb 28 as the cutoff when today is Feb 29", async () => {
      const leapDay = new Date("2028-02-29T12:00:00+09:00");

      const turnedFourteen = await submit(
        { birthday: "2014-02-28", ageConfirmed: true },
        leapDay,
      );
      const notYetFourteen = await submit(
        { birthday: "2014-03-01", ageConfirmed: true },
        leapDay,
      );

      expect(turnedFourteen.result.ok).toBe(true);
      expect(notYetFourteen.result).toEqual({
        ok: false,
        error: "under_minimum_age",
      });
    });
  });
});
