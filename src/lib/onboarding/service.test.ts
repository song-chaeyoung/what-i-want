import { describe, expect, test } from "vitest";
import { completeOnboarding } from "./service";
import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "./types";

class FakeOnboardingRepository implements OnboardingRepository {
  completed = false;
  slugAvailable = true;
  records: CompleteOnboardingRecord[] = [];

  async hasCompletedOnboarding(): Promise<boolean> {
    return this.completed;
  }

  async isWishlistSlugAvailable(): Promise<boolean> {
    return this.slugAvailable;
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
        slug: "birthday",
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

  test("normalizes and validates the wishlist slug", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        slug: "  Birthday-Wish  ",
        birthday: null,
        description: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: true, wishlistSlug: "birthday-wish" });
    expect(repository.records[0]?.wishlistSlug).toBe("birthday-wish");
  });

  test("returns a domain-specific error for duplicate slugs", async () => {
    const repository = new FakeOnboardingRepository();
    repository.slugAvailable = false;

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        slug: "birthday",
        birthday: null,
        description: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "duplicate_slug" });
    expect(repository.records).toEqual([]);
  });

  test("allows birthday to be null", async () => {
    const repository = new FakeOnboardingRepository();

    await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        slug: "birthday",
        birthday: null,
        description: null,
      },
      repository,
    );

    expect(repository.records[0]?.birthday).toBeNull();
  });

  test("creates a profile and default wishlist through the repository port", async () => {
    const repository = new FakeOnboardingRepository();

    const result = await completeOnboarding(
      {
        userId: "user-1",
        displayName: "민지",
        slug: "birthday",
        birthday: "2026-05-14",
        description: "생일 선물 목록",
      },
      repository,
    );

    expect(result).toEqual({ ok: true, wishlistSlug: "birthday" });
    expect(repository.records).toEqual([
      {
        userId: "user-1",
        displayName: "민지",
        description: "생일 선물 목록",
        birthday: "2026-05-14",
        wishlistSlug: "birthday",
        wishlistTitle: "민지님의 위시리스트",
        wishlistThemeId: "pixel_y2k",
        wishlistVisibility: "public",
      },
    ]);
  });
});
