export type WishlistSlugValidationError =
  | "too_short"
  | "too_long"
  | "invalid_format";

export type WishlistSlugParseResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: WishlistSlugValidationError;
    };

const MIN_WISHLIST_SLUG_LENGTH = 3;
const MAX_WISHLIST_SLUG_LENGTH = 32;
const WISHLIST_SLUG_PATTERN = /^[a-z0-9-]+$/;

export function normalizeWishlistSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function parseWishlistSlug(value: string): WishlistSlugParseResult {
  const normalized = normalizeWishlistSlug(value);

  if (normalized.length < MIN_WISHLIST_SLUG_LENGTH) {
    return { ok: false, error: "too_short" };
  }

  if (normalized.length > MAX_WISHLIST_SLUG_LENGTH) {
    return { ok: false, error: "too_long" };
  }

  if (!WISHLIST_SLUG_PATTERN.test(normalized)) {
    return { ok: false, error: "invalid_format" };
  }

  return { ok: true, value: normalized };
}

export function createRandomWishlistSlug(
  randomUuid: () => string = () => crypto.randomUUID(),
): string {
  return `w-${randomUuid().replaceAll("-", "").slice(0, 16)}`;
}
