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
  const birthday = normalizeBirthday(input.birthday);

  if (!displayName) {
    return { ok: false, error: "display_name_required" };
  }

  if (!birthday.ok) {
    return { ok: false, error: "invalid_birthday" };
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
    birthday: birthday.value,
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

function normalizeBirthday(
  value: string | null,
): { ok: true; value: string | null } | { ok: false } {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return { ok: true, value: null };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return { ok: false };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return { ok: false };
  }

  return { ok: true, value: normalized };
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
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
