import { describe, expect, test } from "vitest";
import {
  createWish,
  deleteWish,
  listWishes,
  updateWish,
} from "./service";
import type {
  CreateWishRecord,
  UpdateWishRecord,
  WishItemRecord,
  WishRepository,
  WishlistRecord,
} from "./types";

class FakeWishRepository implements WishRepository {
  wishlist: WishlistRecord | null = {
    id: "wishlist-1",
    slug: "birthday",
    title: "민지님의 위시리스트",
  };
  items: WishItemRecord[] = [];
  created: CreateWishRecord[] = [];
  updated: UpdateWishRecord[] = [];
  deletedIds: string[] = [];

  async findWishlistByOwnerId(): Promise<WishlistRecord | null> {
    return this.wishlist;
  }

  async listWishItems(): Promise<WishItemRecord[]> {
    return this.items;
  }

  async createWishItem(record: CreateWishRecord): Promise<WishItemRecord> {
    this.created.push(record);
    const item = makeWishItem({
      id: `wish-${this.created.length}`,
      ...record,
    });
    this.items.push(item);
    return item;
  }

  async updateWishItem(
    ownerId: string,
    wishItemId: string,
    record: UpdateWishRecord,
  ): Promise<WishItemRecord | null> {
    this.updated.push(record);
    const current = this.items.find((item) => item.id === wishItemId);
    if (!current || ownerId !== "user-1") {
      return null;
    }

    const updated = makeWishItem({
      ...current,
      ...record,
      id: wishItemId,
      wishlistId: current.wishlistId,
    });
    this.items = this.items.map((item) =>
      item.id === wishItemId ? updated : item,
    );
    return updated;
  }

  async deleteWishItem(ownerId: string, wishItemId: string): Promise<boolean> {
    const exists = this.items.some((item) => item.id === wishItemId);
    if (!exists || ownerId !== "user-1") {
      return false;
    }

    this.deletedIds.push(wishItemId);
    this.items = this.items.filter((item) => item.id !== wishItemId);
    return true;
  }
}

describe("admin wishes service", () => {
  test("lists the owner's wishlist and wish items", async () => {
    const repository = new FakeWishRepository();
    repository.items = [
      makeWishItem({ id: "wish-1", title: "키보드" }),
      makeWishItem({ id: "wish-2", title: "케이크" }),
    ];

    const result = await listWishes("user-1", repository);

    expect(result).toEqual({
      ok: true,
      wishlist: repository.wishlist,
      items: repository.items,
    });
  });

  test("requires a title before creating a wish", async () => {
    const repository = new FakeWishRepository();

    const result = await createWish(
      {
        ownerId: "user-1",
        title: "   ",
        description: null,
        targetAmount: "30000",
        productUrl: null,
        imageUrl: null,
      },
      repository,
    );

    expect(result).toEqual({ ok: false, error: "title_required" });
    expect(repository.created).toEqual([]);
  });

  test("normalizes create input and stores the wish under the owner's wishlist", async () => {
    const repository = new FakeWishRepository();

    const result = await createWish(
      {
        ownerId: "user-1",
        title: "  무선 키보드  ",
        description: "   ",
        targetAmount: "45000",
        productUrl: "https://example.com/item",
        imageUrl: "",
      },
      repository,
    );

    expect(result).toEqual({
      ok: true,
      item: makeWishItem({
        id: "wish-1",
        wishlistId: "wishlist-1",
        title: "무선 키보드",
        description: null,
        targetAmount: 45000,
        productUrl: "https://example.com/item",
        imageUrl: null,
        status: "open",
      }),
    });
    expect(repository.created).toEqual([
      {
        wishlistId: "wishlist-1",
        title: "무선 키보드",
        description: null,
        targetAmount: 45000,
        productUrl: "https://example.com/item",
        imageUrl: null,
        status: "open",
      },
    ]);
  });

  test("rejects invalid target amounts and urls", async () => {
    const repository = new FakeWishRepository();

    await expect(
      createWish(
        {
          ownerId: "user-1",
          title: "무선 키보드",
          description: null,
          targetAmount: "-1",
          productUrl: null,
          imageUrl: null,
        },
        repository,
      ),
    ).resolves.toEqual({ ok: false, error: "invalid_target_amount" });

    await expect(
      createWish(
        {
          ownerId: "user-1",
          title: "무선 키보드",
          description: null,
          targetAmount: "30000",
          productUrl: "ftp://example.com/item",
          imageUrl: null,
        },
        repository,
      ),
    ).resolves.toEqual({ ok: false, error: "invalid_product_url" });
  });

  test("updates an owned wish and rejects invalid status values", async () => {
    const repository = new FakeWishRepository();
    repository.items = [makeWishItem({ id: "wish-1", title: "키보드" })];

    const result = await updateWish(
      {
        ownerId: "user-1",
        wishItemId: "wish-1",
        title: "키보드 세트",
        description: "키캡 포함",
        targetAmount: "80000",
        productUrl: null,
        imageUrl: null,
        status: "paused",
      },
      repository,
    );

    expect(result).toEqual({
      ok: true,
      item: makeWishItem({
        id: "wish-1",
        title: "키보드 세트",
        description: "키캡 포함",
        targetAmount: 80000,
        status: "paused",
      }),
    });

    await expect(
      updateWish(
        {
          ownerId: "user-1",
          wishItemId: "wish-1",
          title: "키보드 세트",
          description: null,
          targetAmount: "80000",
          productUrl: null,
          imageUrl: null,
          status: "archived",
        },
        repository,
      ),
    ).resolves.toEqual({ ok: false, error: "invalid_status" });
  });

  test("returns not found when updating or deleting a wish outside the owner scope", async () => {
    const repository = new FakeWishRepository();
    repository.items = [makeWishItem({ id: "wish-1", title: "키보드" })];

    await expect(
      updateWish(
        {
          ownerId: "other-user",
          wishItemId: "wish-1",
          title: "키보드 세트",
          description: null,
          targetAmount: null,
          productUrl: null,
          imageUrl: null,
          status: "open",
        },
        repository,
      ),
    ).resolves.toEqual({ ok: false, error: "wish_not_found" });

    await expect(
      deleteWish("other-user", "wish-1", repository),
    ).resolves.toEqual({ ok: false, error: "wish_not_found" });
    expect(repository.deletedIds).toEqual([]);
  });
});

function makeWishItem(
  overrides: Partial<WishItemRecord> & { id?: string; wishlistId?: string },
): WishItemRecord {
  return {
    id: overrides.id ?? "wish-1",
    wishlistId: overrides.wishlistId ?? "wishlist-1",
    title: overrides.title ?? "무선 키보드",
    description: overrides.description ?? null,
    targetAmount: overrides.targetAmount ?? null,
    fundedAmount: overrides.fundedAmount ?? 0,
    productUrl: overrides.productUrl ?? null,
    imageUrl: overrides.imageUrl ?? null,
    status: overrides.status ?? "open",
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? new Date("2026-05-14T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-05-14T00:00:00.000Z"),
  };
}
