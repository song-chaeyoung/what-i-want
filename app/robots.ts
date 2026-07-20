import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";

const OPERATIONAL_PATHS = ["/admin/", "/api/", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: OPERATIONAL_PATHS,
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        allow: ["/$", "/sample$"],
        disallow: "/",
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).href,
    host: siteUrl.origin,
  };
}
