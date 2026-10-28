import type {
  CompleteOnboardingRecord,
  OnboardingRepository,
} from "./types";
import type { CompleteOnboardingError } from "./errors";
import { getSignupBirthdayError } from "./age";
import { createRandomWishlistSlug } from "@/src/lib/wishlist/slug";
import { DEFAULT_PUBLIC_THEME_ID } from "@/src/lib/wishlist/theme";

const MAX_DISPLAY_NAME_LENGTH = 80;

export type CompleteOnboardingInput = {
  userId: string;
  displayName: string;
  birthday: string | null;
  description: string | null;
  ageConfirmed: boolean;
};

type CompleteOnboardingOptions = {
  createWishlistSlug?: () => string;
  now?: Date;
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

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false, error: "display_name_too_long" };
  }

  const birthdayError =
    birthday.ok && birthday.value
      ? getSignupBirthdayError(birthday.value, options.now)
      : null;

  if (!birthday.ok || birthdayError === "invalid_birthday") {
    return { ok: false, error: "invalid_birthday" };
  }

  // 아래 삭제가 기존 회원에게 닿지 않도록 완료 여부를 먼저 확인한다.
  if (await repository.hasCompletedOnboarding(input.userId)) {
    return { ok: false, error: "already_completed" };
  }

  // 만 14세 미만은 받지 않으므로 소셜 로그인 때 저장된 정보를 바로 지운다.
  if (birthdayError === "under_minimum_age") {
    // 그사이 다른 요청이 온보딩을 마쳤다면 지우지 않았으므로 삭제 안내를 하지 않는다.
    if (!(await repository.deleteIncompleteUser(input.userId))) {
      return { ok: false, error: "already_completed" };
    }

    return { ok: false, error: "under_minimum_age" };
  }

  // 14세 미만임을 알게 된 경우는 확인 누락과 관계없이 위에서 삭제한다.
  if (!input.ageConfirmed) {
    return { ok: false, error: "age_confirmation_required" };
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

  const persisted = await repository.completeOnboarding(record);

  if (!persisted.ok) {
    return { ok: false, error: persisted.error };
  }

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
