import type {
  AdminMessageRecord,
  AdminMessagesRepository,
  AdminMessagesWishlistRecord,
} from "./types";

export type AdminMessagesResult =
  | {
      ok: true;
      wishlist: AdminMessagesWishlistRecord;
      messages: AdminMessageRecord[];
    }
  | {
      ok: false;
      error: "wishlist_not_found";
    };

export async function listAdminMessages(
  ownerId: string,
  repository: AdminMessagesRepository,
  options: { hidden?: boolean } = {},
): Promise<AdminMessagesResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  return {
    ok: true,
    wishlist,
    messages: await repository.listMessages(wishlist.id, options),
  };
}

export type HideAdminMessageResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "wishlist_not_found" | "message_not_found";
    };

export async function hideAdminMessage(
  ownerId: string,
  messageId: string,
  repository: AdminMessagesRepository,
): Promise<HideAdminMessageResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  const hidden = await repository.hideMessage(wishlist.id, messageId);

  if (!hidden) {
    return { ok: false, error: "message_not_found" };
  }

  return { ok: true };
}

export async function unhideAdminMessage(
  ownerId: string,
  messageId: string,
  repository: AdminMessagesRepository,
): Promise<HideAdminMessageResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  const restored = await repository.unhideMessage(wishlist.id, messageId);

  if (!restored) {
    return { ok: false, error: "message_not_found" };
  }

  return { ok: true };
}
