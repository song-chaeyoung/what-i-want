import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();

  return [
    {
      url: new URL("/", siteUrl).href,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/sample", siteUrl).href,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/terms", siteUrl).href,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: new URL("/privacy", siteUrl).href,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
