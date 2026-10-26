import { describe, expect, test } from "vitest";
import { submitPublicParticipation } from "./service";
import type {
  CreatePublicParticipationRecord,
  CreatePublicParticipationResult,
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
  ): Promise<CreatePublicParticipationResult> {
    // Mirrors the global unique index on messages.client_request_id.
    const existing = this.created.find(
      (created) =>
        record.message.clientRequestId !== null &&
        created.message.clientRequestId === record.message.clientRequestId,
    );

    if (existing) {
      return {
        status: "duplicate",
        existing: {
          wishlistId: existing.message.wishlistId,
          wishItemId: existing.message.wishItemId,
          senderName: existing.message.senderName,
          body: existing.message.body,
          amount: existing.funding?.amount ?? null,
        },
      };
    }

    // Mirrors the transactional funded-amount update, which only matches open wishes.
    const funding = record.funding;

    if (
      funding &&
      !this.items.some(
        (item) => item.id === funding.wishItemId && item.status === "open",
      )
    ) {
      return { status: "not_open" };
    }

    this.created.push(record);
    return { status: "created" };
  }
}

describe("public participation service", () => {
  test("rejects invalid slugs before querying the repository", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "NO SPACE",
        clientRequestId: null,
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
        clientRequestId: null,
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
        clientRequestId: null,
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
        clientRequestId: null,
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
            clientRequestId: null,
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

  test("rejects amounts above the maximum and accepts the boundary value", async () => {
    for (const amount of [100_000_001, "100000001"]) {
      const repository = new FakePublicParticipationRepository();

      await expect(
        submitPublicParticipation(
          {
            slug: "birthday",
            clientRequestId: null,
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

    const repository = new FakePublicParticipationRepository();

    await expect(
      submitPublicParticipation(
        {
          slug: "birthday",
          clientRequestId: null,
          wishItemId: "wish-1",
          senderName: "Ari",
          body: "Happy birthday",
          amount: 100_000_000,
        },
        repository,
      ),
    ).resolves.toEqual({ ok: true, kind: "funding" });
    expect(repository.created[0]?.funding?.amount).toBe(100_000_000);
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
          clientRequestId: null,
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
          clientRequestId: null,
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

  test("rejects funding for wishes that are paused or fulfilled", async () => {
    for (const status of ["paused", "fulfilled"] as const) {
      const repository = new FakePublicParticipationRepository();
      repository.items = [makeWishItem({ id: "wish-1", status })];

      await expect(
        submitPublicParticipation(
          {
            slug: "birthday",
            clientRequestId: null,
            wishItemId: "wish-1",
            senderName: "Ari",
            body: "Happy birthday",
            amount: "1000",
          },
          repository,
        ),
      ).resolves.toEqual({ ok: false, error: "wish_not_open" });
      expect(repository.created).toEqual([]);
    }
  });

  test("returns success again for a repeated client request id with the same payload", async () => {
    const repository = new FakePublicParticipationRepository();
    const input = {
      slug: "birthday",
      clientRequestId: "request-1",
      wishItemId: "wish-1",
      senderName: "Ari",
      body: "Happy birthday",
      amount: "1000",
    };

    await expect(submitPublicParticipation(input, repository)).resolves.toEqual(
      { ok: true, kind: "funding" },
    );
    await expect(submitPublicParticipation(input, repository)).resolves.toEqual(
      { ok: true, kind: "funding" },
    );
    expect(repository.created).toHaveLength(1);
  });

  test("returns success for a retried client request id after the wish stops being open", async () => {
    const repository = new FakePublicParticipationRepository();
    const input = {
      slug: "birthday",
      clientRequestId: "request-1",
      wishItemId: "wish-1",
      senderName: "Ari",
      body: "Happy birthday",
      amount: "1000",
    };

    await submitPublicParticipation(input, repository);
    repository.items = [makeWishItem({ id: "wish-1", status: "paused" })];

    await expect(submitPublicParticipation(input, repository)).resolves.toEqual(
      { ok: true, kind: "funding" },
    );
    expect(repository.created).toHaveLength(1);
  });

  test("rejects a repeated client request id with a different payload", async () => {
    const firstInput = {
      slug: "birthday",
      clientRequestId: "request-1",
      wishItemId: "wish-1",
      senderName: "Ari",
      body: "Happy birthday",
      amount: "1000",
    };
    const changedInputs = [
      { ...firstInput, wishItemId: "wish-2" },
      { ...firstInput, amount: "2000" },
      { ...firstInput, wishItemId: "", amount: null },
      { ...firstInput, slug: "anniversary", wishItemId: "wish-3" },
      { ...firstInput, body: "Happy birthday!!" },
      { ...firstInput, senderName: "Bo" },
    ];

    for (const changedInput of changedInputs) {
      const repository = new FakePublicParticipationRepository();
      repository.items = [
        makeWishItem({ id: "wish-1" }),
        makeWishItem({ id: "wish-2" }),
        makeWishItem({ id: "wish-3", wishlistId: "wishlist-2" }),
      ];

      await submitPublicParticipation(firstInput, repository);

      if (changedInput.slug === "anniversary") {
        repository.wishlist = { id: "wishlist-2", slug: "anniversary" };
      }

      await expect(
        submitPublicParticipation(changedInput, repository),
      ).resolves.toEqual({ ok: false, error: "client_request_conflict" });
      expect(repository.created).toHaveLength(1);
    }
  });

  test("stores normalized message and funding records for valid input", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "  BIRTHDAY  ",
        clientRequestId: null,
        wishItemId: "wish-1",
        senderName: ` ${"Sender Name".repeat(10)} `,
        body: "  Happy birthday  ",
        amount: "2500",
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "funding" });
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
          clientRequestId: null,
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
        clientRequestId: null,
        wishItemId: "wish-1",
        senderName: "   ",
        body: "Happy birthday",
        amount: 1000,
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "funding" });
    expect(repository.created[0]?.message.senderName).toBeNull();
  });

  test("stores a message-only record when no wish item is selected", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: null,
        wishItemId: "  ",
        senderName: "Ari",
        body: "Happy birthday",
        amount: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "message" });
    expect(repository.requestedWishItems).toEqual([]);
    expect(repository.created).toEqual([
      {
        message: {
          wishlistId: "wishlist-1",
          wishItemId: null,
          senderName: "Ari",
          body: "Happy birthday",
          clientRequestId: null,
        },
        funding: null,
      },
    ]);
  });

  test("ignores the amount for message-only submissions", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: null,
        wishItemId: "",
        senderName: null,
        body: "Happy birthday",
        amount: "not-a-number",
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "message" });
    expect(repository.created[0]?.funding).toBeNull();
  });

  test("requires a message body for message-only submissions", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: null,
        wishItemId: "",
        senderName: "Ari",
        body: "   ",
        amount: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "message_required" });
    expect(repository.created).toEqual([]);
  });

  test("passes a trimmed, length-capped client request id to the repository", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: `  ${"a".repeat(70)}  `,
        wishItemId: "",
        senderName: "Ari",
        body: "Happy birthday",
        amount: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "message" });
    expect(repository.created[0]?.message.clientRequestId).toBe(
      "a".repeat(64),
    );
  });

  test("stores a null client request id when the trimmed value is empty", async () => {
    const repository = new FakePublicParticipationRepository();

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: "   ",
        wishItemId: "",
        senderName: "Ari",
        body: "Happy birthday",
        amount: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: true, kind: "message" });
    expect(repository.created[0]?.message.clientRequestId).toBeNull();
  });

  test("returns wishlist_not_found for message-only submissions to unknown slugs", async () => {
    const repository = new FakePublicParticipationRepository();
    repository.wishlist = null;

    const result = await submitPublicParticipation(
      {
        slug: "birthday",
        clientRequestId: null,
        wishItemId: "",
        senderName: null,
        body: "Happy birthday",
        amount: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.created).toEqual([]);
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
