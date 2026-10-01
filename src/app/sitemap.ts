import type { MetadataRoute } from "next";
import { getPublicSlugs, getSettings } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ siteUrl }, vehicles] = await Promise.all([
    getSettings(),
    getPublicSlugs(),
  ]);
  const pages = [
    "",
    "/estoque",
    "/financiamento",
    "/venda-seu-carro",
    "/sobre",
    "/contato",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency:
      path === "/estoque" || path === ""
        ? ("daily" as const)
        : ("monthly" as const),
  }));
  return [
    ...pages,
    ...vehicles.map((v) => ({
      url: `${siteUrl}/estoque/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
