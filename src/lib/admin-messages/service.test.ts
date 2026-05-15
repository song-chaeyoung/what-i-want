import { describe, expect, test } from "vitest";
import { listAdminMessages } from "./service";
import type {
  AdminMessageRecord,
  AdminMessagesRepository,
  AdminMessagesWishlistRecord,
} from "./types";

class FakeAdminMessagesRepository implements AdminMessagesRepository {
  wishlist: AdminMessagesWishlistRecord | null = {
    id: "wishlist-1",
    slug: "birthday",
    title: "민지님의 위시리스트",
  };
  messages: AdminMessageRecord[] = [];
  requestedOwnerIds: string[] = [];
  requestedWishlistIds: string[] = [];

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<AdminMessagesWishlistRecord | null> {
    this.requestedOwnerIds.push(ownerId);
    return this.wishlist;
  }

  async listMessages(wishlistId: string): Promise<AdminMessageRecord[]> {
    this.requestedWishlistIds.push(wishlistId);
    return this.messages;
  }
}

describe("admin messages service", () => {
  test("lists messages for the owner wishlist", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.messages = [
      makeMessage({ id: "message-1", senderName: "아리", amount: 5000 }),
      makeMessage({ id: "message-2", senderName: null, amount: null }),
    ];

    const result = await listAdminMessages("user-1", repository);

    expect(result).toEqual({
      ok: true,
      wishlist: repository.wishlist,
      messages: repository.messages,
    });
    expect(repository.requestedOwnerIds).toEqual(["user-1"]);
    expect(repository.requestedWishlistIds).toEqual(["wishlist-1"]);
  });

  test("returns wishlist_not_found without listing messages when onboarding is incomplete", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.wishlist = null;

    const result = await listAdminMessages("user-1", repository);

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.requestedWishlistIds).toEqual([]);
  });
});

function makeMessage(
  overrides: Partial<AdminMessageRecord> & { id?: string },
): AdminMessageRecord {
  return {
    id: overrides.id ?? "message-1",
    wishlistId: overrides.wishlistId ?? "wishlist-1",
    wishItemId: overrides.wishItemId ?? "wish-1",
    wishTitle: overrides.wishTitle ?? "무선 키보드",
    senderName: overrides.senderName ?? "아리",
    body: overrides.body ?? "생일 축하해!",
    amount: overrides.amount ?? 1000,
    createdAt: overrides.createdAt ?? new Date("2026-05-15T00:00:00.000Z"),
  };
}
