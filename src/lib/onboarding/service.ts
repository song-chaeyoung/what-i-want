import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "./types";
import type { CompleteOnboardingError } from "./errors";
import { createRandomWishlistSlug } from "@/src/lib/wishlist/slug";
import { DEFAULT_PUBLIC_THEME_ID } from "@/src/lib/wishlist/theme";

export type CompleteOnboardingInput = {
  userId: string;
  displayName: string;
  birthday: string | null;
  description: string | null;
};

type CompleteOnboardingOptions = {
  createWishlistSlug?: () => string;
};

export type CompleteOnboardingResult =
  | {
      ok: true;
      wishlistSlug: string;
    }
  | {
      ok: false;
      error: CompleteOnboardingError;
    };

export async function completeOnboarding(
  input: CompleteOnboardingInput,
  repository: OnboardingRepository,
  options: CompleteOnboardingOptions = {},
): Promise<CompleteOnboardingResult> {
  const displayName = input.displayName.trim();

  if (!displayName) {
    return { ok: false, error: "display_name_required" };
  }

  if (await repository.hasCompletedOnboarding(input.userId)) {
    return { ok: false, error: "already_completed" };
  }

  const slug = await createAvailableWishlistSlug(
    repository,
    options.createWishlistSlug ?? createRandomWishlistSlug,
  );

  if (!slug) {
    return { ok: false, error: "duplicate_slug" };
  }

  const record: CompleteOnboardingRecord = {
    userId: input.userId,
    displayName,
    description: normalizeOptionalText(input.description),
    birthday: input.birthday,
    wishlistSlug: slug,
    wishlistTitle: `${displayName}님의 위시리스트`,
    wishlistThemeId: DEFAULT_PUBLIC_THEME_ID,
    wishlistVisibility: "public",
  };

  await repository.completeOnboarding(record);

  return {
    ok: true,
    wishlistSlug: slug,
  };
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

async function createAvailableWishlistSlug(
  repository: OnboardingRepository,
  createWishlistSlug: () => string,
): Promise<string | null> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = createWishlistSlug();

    if (await repository.isWishlistSlugAvailable(slug)) {
      return slug;
    }
  }

  return null;
}
