const PRODUCTION_SITE_URL = "https://iwantbirthdaygift.com";

export function resolveSiteUrl(raw = process.env.AUTH_URL): URL {
  const normalized = raw?.trim().replace(/^["']|["']$/g, "");

  if (normalized) {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(normalized)
      ? normalized
      : `https://${normalized}`;

    try {
      const url = new URL(candidate);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return new URL(url.origin);
      }
    } catch {
      // Invalid environment values fall back to the canonical production origin.
    }
  }

  return new URL(PRODUCTION_SITE_URL);
}
