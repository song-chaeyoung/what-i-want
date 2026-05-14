export const PUBLIC_THEME_IDS = [
  "pixel_y2k",
  "mono_bw",
  "soft_pastel",
] as const;

export type PublicThemeId = (typeof PUBLIC_THEME_IDS)[number];

export const DEFAULT_PUBLIC_THEME_ID: PublicThemeId = "pixel_y2k";

export function isPublicThemeId(value: string): value is PublicThemeId {
  return PUBLIC_THEME_IDS.includes(value as PublicThemeId);
}

export function parsePublicThemeId(value: string | null | undefined): PublicThemeId {
  if (!value || !isPublicThemeId(value)) {
    return DEFAULT_PUBLIC_THEME_ID;
  }

  return value;
}
