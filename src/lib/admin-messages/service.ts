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
): Promise<AdminMessagesResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  return {
    ok: true,
    wishlist,
    messages: await repository.listMessages(wishlist.id),
  };
}
