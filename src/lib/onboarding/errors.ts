import type { WishlistSlugValidationError } from "@/src/lib/wishlist/slug";

export type CompleteOnboardingError =
  | "display_name_required"
  | "duplicate_slug"
  | "already_completed"
  | WishlistSlugValidationError;
