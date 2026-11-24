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
  wishlistThemeId: PublicThemeId | null;
};

export type CompleteOnboardingPersistResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "duplicate_slug" | "already_completed" | "under_minimum_age";
    };

export type DeleteIncompleteUserResult = {
  deleted: boolean;
  kakaoProviderAccountId: string | null;
};

export interface OnboardingRepository {
  hasCompletedOnboarding(userId: string): Promise<boolean>;
  isWishlistSlugAvailable(slug: string): Promise<boolean>;
  completeOnboarding(
    record: CompleteOnboardingRecord,
  ): Promise<CompleteOnboardingPersistResult>;
  // 계정이 없어졌으면(이번에 삭제했거나 이미 삭제됐으면) deleted. 그사이 온보딩을 마쳤으면 false.
  // 카카오 회원번호는 이번에 실제로 지운 경우에만 돌려준다.
  deleteIncompleteUser(userId: string): Promise<DeleteIncompleteUserResult>;
}
