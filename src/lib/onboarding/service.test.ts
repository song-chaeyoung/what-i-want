import { describe, expect, test } from "vitest";
import { completeOnboarding } from "./service";
import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "./types";

class FakeOnboardingRepository implements OnboardingRepository {
  completed = false;
  slugAvailability: boolean[] = [true];
  requestedSlugs: string[] = [];
  records: CompleteOnboardingRecord[] = [];

  async hasCompletedOnboarding(): Promise<boolean> {
    return this.completed;
  }

  async isWishlistSlugAvailable(slug: string): Promise<boolean> {
    this.requestedSlugs.push(slug);
    return this.slugAvailability.shift() ?? true;
  }

  async completeOnboarding(record: CompleteOnboardingRecord): Promise<void> {
    this.records.push(record);
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

  test("allows birthday to be null", async () => {
    const repository = new FakeOnboardingRepository();

    await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        birthday: null,
        description: null,
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
        birthday: "2026-05-14",
        description: "생일 선물 목록",
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
        birthday: "2026-05-14",
        wishlistSlug: "w-a3f91c0e7b42d8aa",
        wishlistTitle: "민지님의 위시리스트",
        wishlistThemeId: "pixel_y2k",
        wishlistVisibility: "public",
      },
    ]);
  });
});
