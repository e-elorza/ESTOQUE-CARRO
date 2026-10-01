import { slugify } from "./format";
import type { VehicleIndexEntry } from "./types";

export type BrandOption = {
  slug: string;
  name: string;
  count: number;
  models: { slug: string; name: string; count: number }[];
};

export function brandOptions(index: VehicleIndexEntry[]): BrandOption[] {
  const brands = new Map<string, BrandOption>();
  for (const e of index) {
    const slug = slugify(e.brand);
    const brand = brands.get(slug) ?? {
      slug,
      name: e.brand,
      count: 0,
      models: [],
    };
    brand.count++;
    const modelSlug = slugify(e.model);
    const model = brand.models.find((m) => m.slug === modelSlug);
    if (model) model.count++;
    else brand.models.push({ slug: modelSlug, name: e.model, count: 1 });
    brands.set(slug, brand);
  }
  return [...brands.values()]
    .map((b) => ({
      ...b,
      models: b.models.sort((x, y) => x.name.localeCompare(y.name, "pt-BR")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
