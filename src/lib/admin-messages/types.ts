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
  listMessages(
    wishlistId: string,
    options?: { hidden?: boolean },
  ): Promise<AdminMessageRecord[]>;
  hideMessage(wishlistId: string, messageId: string): Promise<boolean>;
  unhideMessage(wishlistId: string, messageId: string): Promise<boolean>;
  countUnreadMessages(wishlistId: string): Promise<number>;
  markMessagesRead(wishlistId: string): Promise<void>;
};
