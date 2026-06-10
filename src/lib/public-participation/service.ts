import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import type {
  PublicParticipationInput,
  PublicParticipationRepository,
} from "./types";

const MAX_MESSAGE_LENGTH = 500;
const MAX_SENDER_NAME_LENGTH = 80;
const MAX_AMOUNT = 100_000_000;

export type PublicParticipationError =
  | "wishlist_not_found"
  | "wish_not_found"
  | "message_required"
  | "message_too_long"
  | "invalid_amount";

export type PublicParticipationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: PublicParticipationError;
    };

export async function submitPublicParticipation(
  input: PublicParticipationInput,
  repository: PublicParticipationRepository,
): Promise<PublicParticipationResult> {
  const parsedSlug = parseWishlistSlug(input.slug);

  if (!parsedSlug.ok) {
    return { ok: false, error: "wishlist_not_found" };
  }

  const body = normalizeMessageBody(input.body);

  if (body.error) {
    return { ok: false, error: body.error };
  }

  const amount = normalizeAmount(input.amount);

  if (amount.error) {
    return { ok: false, error: amount.error };
  }

  const wishlist = await repository.findPublicWishlistBySlug(parsedSlug.value);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  const wishItem = await repository.findVisibleWishItem(
    wishlist.id,
    input.wishItemId,
  );

  if (!wishItem) {
    return { ok: false, error: "wish_not_found" };
  }

  await repository.createPublicParticipation({
    message: {
      wishlistId: wishlist.id,
      wishItemId: wishItem.id,
      senderName: normalizeSenderName(input.senderName),
      body: body.value,
    },
    funding: {
      wishlistId: wishlist.id,
      wishItemId: wishItem.id,
      amount: amount.value,
    },
  });

  return { ok: true };
}

function normalizeMessageBody(value: string | null):
  | {
      value: string;
      error?: never;
    }
  | {
      value?: never;
      error: "message_required" | "message_too_long";
    } {
  const body = value?.trim() ?? "";

  if (!body) {
    return { error: "message_required" };
  }

  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: "message_too_long" };
  }

  return { value: body };
}

function normalizeSenderName(value: string | null): string | null {
  const senderName = value?.trim() ?? "";

  if (!senderName) {
    return null;
  }

  return senderName.slice(0, MAX_SENDER_NAME_LENGTH);
}

function normalizeAmount(value: string | number | null):
  | {
      value: number;
      error?: never;
    }
  | {
      value?: never;
      error: "invalid_amount";
    } {
  if (value === null || value === "") {
    return { error: "invalid_amount" };
  }

  const amount = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return { error: "invalid_amount" };
  }

  return { value: amount };
}
