import { describe, expect, test } from "vitest";
import { submitPublicParticipation } from "./service";
import type {
  CreatePublicParticipationRecord,
  PublicParticipationRepository,
  PublicParticipationWishItemRecord,
  PublicParticipationWishlistRecord,
} from "./types";

class FakePublicParticipationRepository
  implements PublicParticipationRepository
{
  wishlist: PublicParticipationWishlistRecord | null = {
    id: "wishlist-1",
    slug: "birthday",
  };
  items: PublicParticipationWishItemRecord[] = [
    makeWishItem({ id: "wish-1" }),
  ];
  requestedSlugs: string[] = [];
  requestedWishItems: Array<{ wishlistId: string; wishItemId: string }> = [];
  created: CreatePublicParticipationRecord[] = [];

  async findPublicWishlistBySlug(
    slug: string,
  ): Promise<PublicParticipationWishlistRecord | null> {
    this.requestedSlugs.push(slug);
    return this.wishlist?.slug === slug ? this.wishlist : null;
  }

  async findVisibleWishItem(
    wishlistId: string,
    wishItemId: string,
  ): Promise<PublicParticipationWishItemRecord | null> {
    this.requestedWishItems.push({ wishlistId, wishItemId });
    return (
      this.items.find(
        (item) =>
          item.id === wishItemId &&
          item.wishlistId === wishlistId &&
          item.status !== "hidden",
      ) ?? null
    );
  }

  async createPublicParticipation(
    record: CreatePublicParticipationRecord,
  ): Promise<void> {
    this.created.push(record);
  }
}

describe("public participation service", () => {
  test("rejects invalid slugs before querying the repository", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "NO SPACE",
        wishItemId: "wish-1",
        senderName: "Ari",
        body: "Happy birthday",
        amount: "1000",
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.requestedSlugs).toEqual([]);
    expect(repository.requestedWishItems).toEqual([]);
    expect(repository.created).toEqual([]);
  });

  test("returns wishlist_not_found when the normalized slug is not public", async () => {
    const repository = new FakePublicParticipationRepository();
    repository.wishlist = null;

    const result = await submitPublicParticipation(
      {
        slug: "  BIRTHDAY  ",
        wishItemId: "wish-1",
        senderName: null,
        body: "Happy birthday",
        amount: "1000",
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.requestedSlugs).toEqual(["birthday"]);
    expect(repository.requestedWishItems).toEqual([]);
    expect(repository.created).toEqual([]);
  });

  test("requires a non-empty message body after trimming", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        wishItemId: "wish-1",
        senderName: "Ari",
        body: "   ",
        amount: "1000",
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "message_required" });
    expect(repository.created).toEqual([]);
  });

  test("rejects message bodies longer than 500 characters after trimming", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        wishItemId: "wish-1",
        senderName: "Ari",
        body: ` ${"a".repeat(501)} `,
        amount: "1000",
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "message_too_long" });
    expect(repository.created).toEqual([]);
  });

  test("requires amount to be a positive integer", async () => {
    const invalidAmounts = ["", "0", "-1", "12.5", 0, -1, 12.5, null];

    for (const amount of invalidAmounts) {
      const repository = new FakePublicParticipationRepository();

      await expect(
        submitPublicParticipation(
          {
            slug: "birthday",
            wishItemId: "wish-1",
            senderName: "Ari",
            body: "Happy birthday",
            amount,
          },
          repository,
        ),
      ).resolves.toEqual({ ok: false, error: "invalid_amount" });
      expect(repository.created).toEqual([]);
    }
  });

  test("returns wish_not_found when the wish is not in the public wishlist or is hidden", async () => {
    const outsideWishlistRepository = new FakePublicParticipationRepository();
    outsideWishlistRepository.items = [
      makeWishItem({ id: "wish-1", wishlistId: "other-wishlist" }),
    ];

    await expect(
      submitPublicParticipation(
        {
          slug: "birthday",
          wishItemId: "wish-1",
          senderName: "Ari",
          body: "Happy birthday",
          amount: "1000",
        },
        outsideWishlistRepository,
      ),
    ).resolves.toEqual({ ok: false, error: "wish_not_found" });
    expect(outsideWishlistRepository.created).toEqual([]);

    const hiddenWishRepository = new FakePublicParticipationRepository();
    hiddenWishRepository.items = [
      makeWishItem({ id: "wish-1", status: "hidden" }),
    ];

    await expect(
      submitPublicParticipation(
        {
          slug: "birthday",
          wishItemId: "wish-1",
          senderName: "Ari",
          body: "Happy birthday",
          amount: "1000",
        },
        hiddenWishRepository,
      ),
    ).resolves.toEqual({ ok: false, error: "wish_not_found" });
    expect(hiddenWishRepository.created).toEqual([]);
  });

  test("stores normalized message and funding records for valid input", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "  BIRTHDAY  ",
        wishItemId: "wish-1",
        senderName: ` ${"Sender Name".repeat(10)} `,
        body: "  Happy birthday  ",
        amount: "2500",
      },
      repository,
    );

    expect(result).toEqual({ ok: true });
    expect(repository.requestedSlugs).toEqual(["birthday"]);
    expect(repository.requestedWishItems).toEqual([
      { wishlistId: "wishlist-1", wishItemId: "wish-1" },
    ]);
    expect(repository.created).toEqual([
      {
        message: {
          wishlistId: "wishlist-1",
          wishItemId: "wish-1",
          senderName: "Sender Name".repeat(10).slice(0, 80),
          body: "Happy birthday",
        },
        funding: {
          wishlistId: "wishlist-1",
          wishItemId: "wish-1",
          amount: 2500,
        },
      },
    ]);
  });

  test("stores a null sender name when the trimmed value is empty", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        wishItemId: "wish-1",
        senderName: "   ",
        body: "Happy birthday",
        amount: 1000,
      },
      repository,
    );

    expect(result).toEqual({ ok: true });
    expect(repository.created[0]?.message.senderName).toBeNull();
  });
});

function makeWishItem(
  overrides: Partial<PublicParticipationWishItemRecord> & { id?: string },
): PublicParticipationWishItemRecord {
  return {
    id: overrides.id ?? "wish-1",
    wishlistId: overrides.wishlistId ?? "wishlist-1",
    status: overrides.status ?? "open",
  };
}
