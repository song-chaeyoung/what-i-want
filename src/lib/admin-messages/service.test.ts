import { describe, expect, test } from "vitest";
import {
  hideAdminMessage,
  listAdminMessages,
  unhideAdminMessage,
} from "./service";
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
  requestedListOptions: Array<{ hidden?: boolean }> = [];
  hideRequests: Array<{ wishlistId: string; messageId: string }> = [];
  unhideRequests: Array<{ wishlistId: string; messageId: string }> = [];

  async findWishlistByOwnerId(
    ownerId: string,
  ): Promise<AdminMessagesWishlistRecord | null> {
    this.requestedOwnerIds.push(ownerId);
    return this.wishlist;
  }

  async listMessages(
    wishlistId: string,
    options: { hidden?: boolean } = {},
  ): Promise<AdminMessageRecord[]> {
    this.requestedWishlistIds.push(wishlistId);
    this.requestedListOptions.push(options);
    return this.messages;
  }

  async hideMessage(wishlistId: string, messageId: string): Promise<boolean> {
    this.hideRequests.push({ wishlistId, messageId });
    return this.messages.some((message) => message.id === messageId);
  }

  async unhideMessage(
    wishlistId: string,
    messageId: string,
  ): Promise<boolean> {
    this.unhideRequests.push({ wishlistId, messageId });
    return this.messages.some((message) => message.id === messageId);
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

  test("hides a message that belongs to the owner wishlist", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.messages = [makeMessage({ id: "message-1" })];

    const result = await hideAdminMessage("user-1", "message-1", repository);

    expect(result).toEqual({ ok: true });
    expect(repository.hideRequests).toEqual([
      { wishlistId: "wishlist-1", messageId: "message-1" },
    ]);
  });

  test("returns message_not_found when the message is missing or already hidden", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.messages = [];

    const result = await hideAdminMessage("user-1", "message-9", repository);

    expect(result).toEqual({ ok: false, error: "message_not_found" });
  });

  test("returns wishlist_not_found without hiding when onboarding is incomplete", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.wishlist = null;

    const result = await hideAdminMessage("user-1", "message-1", repository);

    expect(result).toEqual({ ok: false, error: "wishlist_not_found" });
    expect(repository.hideRequests).toEqual([]);
  });

  test("lists hidden messages when the hidden filter is requested", async () => {
    const repository = new FakeAdminMessagesRepository();

    await listAdminMessages("user-1", repository, { hidden: true });

    expect(repository.requestedListOptions).toEqual([{ hidden: true }]);
  });

  test("restores a hidden message that belongs to the owner wishlist", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.messages = [makeMessage({ id: "message-1" })];

    const result = await unhideAdminMessage("user-1", "message-1", repository);

    expect(result).toEqual({ ok: true });
    expect(repository.unhideRequests).toEqual([
      { wishlistId: "wishlist-1", messageId: "message-1" },
    ]);
  });

  test("returns message_not_found when restoring a missing message", async () => {
    const repository = new FakeAdminMessagesRepository();
    repository.messages = [];

    const result = await unhideAdminMessage("user-1", "message-9", repository);

    expect(result).toEqual({ ok: false, error: "message_not_found" });
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
