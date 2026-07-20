import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import robots from "../../../app/robots";
import sitemap from "../../../app/sitemap";

describe("metadata routes", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("publishes only home and sample in the sitemap", () => {
    expect(sitemap()).toEqual([
      {
        url: "https://iwantbirthdaygift.com/",
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: "https://iwantbirthdaygift.com/sample",
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ]);
  });

  test("allows search and answer crawlers while protecting operations", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules).toContainEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/auth/"],
    });
    expect(JSON.stringify(result)).not.toContain("OAI-SearchBot");
    expect(JSON.stringify(result)).not.toContain("Claude-SearchBot");
    expect(JSON.stringify(result)).not.toContain("PerplexityBot");
  });

  test("limits training crawlers to home and sample", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules).toContainEqual({
      userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
      allow: ["/$", "/sample$"],
      disallow: "/",
    });
    expect(result.sitemap).toBe(
      "https://iwantbirthdaygift.com/sitemap.xml",
    );
    expect(result.host).toBe("https://iwantbirthdaygift.com");
  });
});
