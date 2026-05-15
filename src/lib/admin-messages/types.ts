export type AdminMessagesWishlistRecord = {
  id: string;
  slug: string;
  title: string;
};

export type AdminMessageRecord = {
  id: string;
  wishlistId: string;
  wishItemId: string | null;
  wishTitle: string | null;
  senderName: string | null;
  body: string;
  amount: number | null;
  createdAt: Date;
};

export type AdminMessagesRepository = {
  findWishlistByOwnerId(
    ownerId: string,
  ): Promise<AdminMessagesWishlistRecord | null>;
  listMessages(wishlistId: string): Promise<AdminMessageRecord[]>;
};
