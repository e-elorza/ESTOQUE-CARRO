import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSettings();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
