import type { PublicThemeId } from "@/src/lib/wishlist/theme";

export type WishlistVisibility = "public";

export type CompleteOnboardingRecord = {
  userId: string;
  displayName: string;
  description: string | null;
  birthday: string | null;
  wishlistSlug: string;
  wishlistTitle: string;
  wishlistThemeId: PublicThemeId;
  wishlistVisibility: WishlistVisibility;
};

export type OnboardingState = {
  isComplete: boolean;
  wishlistSlug: string | null;
};

export interface OnboardingRepository {
  hasCompletedOnboarding(userId: string): Promise<boolean>;
  isWishlistSlugAvailable(slug: string): Promise<boolean>;
  completeOnboarding(record: CompleteOnboardingRecord): Promise<void>;
}
