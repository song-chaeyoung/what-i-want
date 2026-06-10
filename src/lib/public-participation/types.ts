import type { WishStatus } from "@/src/lib/wish-item/status";

export type PublicParticipationWishlistRecord = {
  id: string;
  slug: string;
};

export type PublicParticipationWishItemRecord = {
  id: string;
  wishlistId: string;
  status: WishStatus;
};

export type PublicParticipationInput = {
  slug: string;
  wishItemId: string;
  senderName: string | null;
  body: string | null;
  amount: string | number | null;
};

export type PublicParticipationMessageRecord = {
  wishlistId: string;
  wishItemId: string | null;
  senderName: string | null;
  body: string;
};

export type PublicParticipationFundingRecord = {
  wishlistId: string;
  wishItemId: string;
  amount: number;
};

export type CreatePublicParticipationRecord = {
  message: PublicParticipationMessageRecord;
  funding: PublicParticipationFundingRecord | null;
};

export type PublicParticipationRepository = {
  findPublicWishlistBySlug(
    slug: string,
  ): Promise<PublicParticipationWishlistRecord | null>;
  findVisibleWishItem(
    wishlistId: string,
    wishItemId: string,
  ): Promise<PublicParticipationWishItemRecord | null>;
  createPublicParticipation(
    record: CreatePublicParticipationRecord,
  ): Promise<void>;
};
