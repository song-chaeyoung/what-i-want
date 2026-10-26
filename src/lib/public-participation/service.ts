import { parseWishlistSlug } from "@/src/lib/wishlist/slug";
import type {
  CreatePublicParticipationRecord,
  CreatePublicParticipationResult,
  PublicParticipationInput,
  PublicParticipationRepository,
} from "./types";

const MAX_MESSAGE_LENGTH = 500;
const MAX_SENDER_NAME_LENGTH = 80;
const MAX_AMOUNT = 100_000_000;
const MAX_CLIENT_REQUEST_ID_LENGTH = 64;

export type PublicParticipationError =
  | "wishlist_not_found"
  | "wish_not_found"
  | "wish_not_open"
  | "message_required"
  | "message_too_long"
  | "invalid_amount"
  | "client_request_conflict";

export type PublicParticipationKind = "funding" | "message";

export type PublicParticipationResult =
  | {
      ok: true;
      kind: PublicParticipationKind;
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

  const clientRequestId = normalizeClientRequestId(input.clientRequestId);
  const wishItemId = input.wishItemId.trim();

  if (!wishItemId) {
    const wishlist = await repository.findPublicWishlistBySlug(
      parsedSlug.value,
    );

    if (!wishlist) {
      return { ok: false, error: "wishlist_not_found" };
    }

    const record: CreatePublicParticipationRecord = {
      message: {
        wishlistId: wishlist.id,
        wishItemId: null,
        senderName: normalizeSenderName(input.senderName),
        body: body.value,
        clientRequestId,
      },
      funding: null,
    };
    const stored = await repository.createPublicParticipation(record);

    if (isConflictingDuplicate(stored, record)) {
      return { ok: false, error: "client_request_conflict" };
    }

    return { ok: true, kind: "message" };
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
    wishItemId,
  );

  if (!wishItem) {
    return { ok: false, error: "wish_not_found" };
  }

  if (wishItem.status !== "open") {
    return { ok: false, error: "wish_not_open" };
  }

  const record: CreatePublicParticipationRecord = {
    message: {
      wishlistId: wishlist.id,
      wishItemId: wishItem.id,
      senderName: normalizeSenderName(input.senderName),
      body: body.value,
      clientRequestId,
    },
    funding: {
      wishlistId: wishlist.id,
      wishItemId: wishItem.id,
      amount: amount.value,
    },
  };
  const stored = await repository.createPublicParticipation(record);

  if (isConflictingDuplicate(stored, record)) {
    return { ok: false, error: "client_request_conflict" };
  }

  return { ok: true, kind: "funding" };
}

// A reused client request id is only an idempotent retry when it targets the
// same wishlist, wish, and amount as the participation already stored.
function isConflictingDuplicate(
  stored: CreatePublicParticipationResult,
  record: CreatePublicParticipationRecord,
): boolean {
  if (stored.status === "created") {
    return false;
  }

  return (
    stored.existing.wishlistId !== record.message.wishlistId ||
    stored.existing.wishItemId !== record.message.wishItemId ||
    stored.existing.amount !== (record.funding?.amount ?? null)
  );
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

function normalizeClientRequestId(value: string | null): string | null {
  const clientRequestId = value?.trim() ?? "";

  if (!clientRequestId) {
    return null;
  }

  return clientRequestId.slice(0, MAX_CLIENT_REQUEST_ID_LENGTH);
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
