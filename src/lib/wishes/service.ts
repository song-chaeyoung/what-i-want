import type { WishStatus } from "@/src/lib/wish-item/status";
import type {
  CreateWishRecord,
  UpdateWishRecord,
  WishItemRecord,
  WishRepository,
  WishlistRecord,
} from "./types";

const WISH_STATUSES = ["open", "fulfilled", "hidden", "paused"] as const;
const MAX_TITLE_LENGTH = 120;

export type WishMutationError =
  | "wishlist_not_found"
  | "wish_not_found"
  | "title_required"
  | "title_too_long"
  | "invalid_target_amount"
  | "invalid_product_url"
  | "invalid_image_url"
  | "invalid_status";

export type WishFormInput = {
  ownerId: string;
  title: string | null;
  description: string | null;
  targetAmount: string | number | null;
  productUrl: string | null;
  imageUrl: string | null;
};

export type UpdateWishFormInput = WishFormInput & {
  wishItemId: string;
  status: string | null;
};

export type ListWishesResult =
  | {
      ok: true;
      wishlist: WishlistRecord;
      items: WishItemRecord[];
    }
  | {
      ok: false;
      error: "wishlist_not_found";
    };

export type WishMutationResult =
  | {
      ok: true;
      item: WishItemRecord;
    }
  | {
      ok: false;
      error: WishMutationError;
    };

export type DeleteWishResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "wish_not_found";
    };

export async function listWishes(
  ownerId: string,
  repository: WishRepository,
): Promise<ListWishesResult> {
  const wishlist = await repository.findWishlistByOwnerId(ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  return {
    ok: true,
    wishlist,
    items: await repository.listWishItems(wishlist.id),
  };
}

export async function createWish(
  input: WishFormInput,
  repository: WishRepository,
): Promise<WishMutationResult> {
  const wishlist = await repository.findWishlistByOwnerId(input.ownerId);

  if (!wishlist) {
    return { ok: false, error: "wishlist_not_found" };
  }

  const normalized = normalizeWishInput(input, "open");

  if (!normalized.ok) {
    return normalized;
  }

  return {
    ok: true,
    item: await repository.createWishItem({
      ...normalized.record,
      wishlistId: wishlist.id,
    }),
  };
}

export async function updateWish(
  input: UpdateWishFormInput,
  repository: WishRepository,
): Promise<WishMutationResult> {
  const status = parseWishStatus(input.status);

  if (!status) {
    return { ok: false, error: "invalid_status" };
  }

  const normalized = normalizeWishInput(input, status);

  if (!normalized.ok) {
    return normalized;
  }

  const item = await repository.updateWishItem(
    input.ownerId,
    input.wishItemId,
    normalized.record,
  );

  if (!item) {
    return { ok: false, error: "wish_not_found" };
  }

  return { ok: true, item };
}

export async function deleteWish(
  ownerId: string,
  wishItemId: string,
  repository: WishRepository,
): Promise<DeleteWishResult> {
  if (!(await repository.deleteWishItem(ownerId, wishItemId))) {
    return { ok: false, error: "wish_not_found" };
  }

  return { ok: true };
}

function normalizeWishInput(
  input: WishFormInput,
  status: WishStatus,
):
  | {
      ok: true;
      record: Omit<CreateWishRecord, "wishlistId"> | UpdateWishRecord;
    }
  | {
      ok: false;
      error: WishMutationError;
    } {
  const title = normalizeRequiredTitle(input.title);

  if (title.error) {
    return { ok: false, error: title.error };
  }

  const targetAmount = normalizeTargetAmount(input.targetAmount);

  if (targetAmount.error) {
    return { ok: false, error: targetAmount.error };
  }

  const productUrl = normalizeOptionalUrl(input.productUrl);

  if (productUrl.error) {
    return { ok: false, error: "invalid_product_url" };
  }

  const imageUrl = normalizeOptionalUrl(input.imageUrl);

  if (imageUrl.error) {
    return { ok: false, error: "invalid_image_url" };
  }

  return {
    ok: true,
    record: {
      title: title.value,
      description: normalizeOptionalText(input.description),
      targetAmount: targetAmount.value,
      productUrl: productUrl.value,
      imageUrl: imageUrl.value,
      status,
    },
  };
}

function normalizeRequiredTitle(
  value: string | null,
):
  | {
      value: string;
      error?: never;
    }
  | {
      value?: never;
      error: "title_required" | "title_too_long";
    } {
  const title = value?.trim() ?? "";

  if (!title) {
    return { error: "title_required" };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return { error: "title_too_long" };
  }

  return { value: title };
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeTargetAmount(
  value: string | number | null,
):
  | {
      value: number | null;
      error?: never;
    }
  | {
      value?: never;
      error: "invalid_target_amount";
    } {
  if (value === null || value === "") {
    return { value: null };
  }

  const amount = typeof value === "number" ? value : Number(value.trim());

  if (!Number.isInteger(amount) || amount < 0) {
    return { error: "invalid_target_amount" };
  }

  return { value: amount };
}

function normalizeOptionalUrl(
  value: string | null,
):
  | {
      value: string | null;
      error?: never;
    }
  | {
      value?: never;
      error: "invalid_url";
    } {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return { value: null };
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "invalid_url" };
    }
    return { value: url.toString() };
  } catch {
    return { error: "invalid_url" };
  }
}

function parseWishStatus(value: string | null): WishStatus | null {
  return WISH_STATUSES.find((status) => status === value) ?? null;
}
