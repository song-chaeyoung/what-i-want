const PRODUCTION_SITE_URL = "https://iwantbirthdaygift.com";

export function resolveSiteUrl(raw = process.env.AUTH_URL): URL {
  const normalized = raw?.trim().replace(/^["']|["']$/g, "");

  if (normalized) {
    const candidate = /^https?:\/\//.test(normalized)
      ? normalized
      : `https://${normalized}`;

    try {
      return new URL(new URL(candidate).origin);
    } catch {
      // Invalid environment values fall back to the canonical production origin.
    }
  }

  return new URL(PRODUCTION_SITE_URL);
}
