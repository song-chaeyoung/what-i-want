export type CompleteOnboardingError =
  | "display_name_required"
  | "display_name_too_long"
  | "invalid_birthday"
  | "age_confirmation_required"
  | "under_minimum_age"
  | "duplicate_slug"
  | "already_completed";
