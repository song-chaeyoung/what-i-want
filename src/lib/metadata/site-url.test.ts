import { afterEach, describe, expect, test, vi } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("uses the production domain when AUTH_URL is missing", () => {
    vi.stubEnv("AUTH_URL", "");

    expect(resolveSiteUrl().href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });

  test("reads AUTH_URL when the argument is omitted", () => {
    vi.stubEnv("AUTH_URL", "https://preview.example.com");

    expect(resolveSiteUrl().href).toBe("https://preview.example.com/");
  });

  test("adds https when the protocol is omitted", () => {
    expect(resolveSiteUrl("iwantbirthdaygift.com").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });

  test("strips quotes, whitespace, and paths down to the origin", () => {
    expect(
      resolveSiteUrl('  "https://preview.example.com/base/path"  ').href,
    ).toBe("https://preview.example.com/");
  });

  test("preserves an explicit local development origin", () => {
    expect(resolveSiteUrl("http://localhost:3000").href).toBe(
      "http://localhost:3000/",
    );
  });

  test("accepts an uppercase HTTP protocol", () => {
    expect(resolveSiteUrl("HTTP://example.com/base/path").href).toBe(
      "http://example.com/",
    );
  });

  test("falls back for non-HTTP protocols", () => {
    expect(resolveSiteUrl("ftp://example.com").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });

  test("falls back when the value is malformed", () => {
    expect(resolveSiteUrl("https://[").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });
});
