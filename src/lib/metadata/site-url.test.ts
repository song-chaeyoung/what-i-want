import { describe, expect, test } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  test("uses the production domain when AUTH_URL is missing", () => {
    expect(resolveSiteUrl(undefined).href).toBe(
      "https://iwantbirthdaygift.com/",
    );
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

  test("falls back when the value is malformed", () => {
    expect(resolveSiteUrl("https://[").href).toBe(
      "https://iwantbirthdaygift.com/",
    );
  });
});
