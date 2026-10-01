/**
 * Data access for public pages.
 *
 * Today this reads the demo seed. When Supabase is configured, the same functions
 * will query it instead; pages only ever import from here, so the swap stays local.
 */
import { cache } from "react";
import { compare, matches, toIndexEntry, type Filters } from "../filters";
import type {
  DealershipSettings,
  Location,
  Vehicle,
  VehicleIndexEntry,
} from "../types";
import { seedLocations, seedSettings, seedVehicles } from "./seed";

export const PAGE_SIZE = 18;

export const getSettings = cache(
  async (): Promise<DealershipSettings> => seedSettings,
);

export const getLocations = cache(async (): Promise<Location[]> =>
  [...seedLocations].sort((a, b) => a.sortOrder - b.sortOrder),
);

/** Vehicles that may appear in listings: available and reserved. */
const getListedVehicles = cache(async (): Promise<Vehicle[]> =>
  seedVehicles.filter(
    (v) => v.status === "disponivel" || v.status === "reservado",
  ),
);

export async function getStockIndex(): Promise<VehicleIndexEntry[]> {
  return (await getListedVehicles()).map(toIndexEntry);
}

export async function listStock(filters: Filters) {
  const vehicles = await getListedVehicles();
  const sorter = compare(filters.ordem);
  const results = vehicles
    .map((v) => ({ v, e: toIndexEntry(v) }))
    .filter(({ e }) => matches(e, filters))
    .sort((a, b) => sorter(a.e, b.e))
    .map(({ v }) => v);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.pagina, pageCount);
  return {
    items: results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: results.length,
    page,
    pageCount,
  };
}

/** Any non-draft vehicle, including sold ones (their page stays live). */
export const getVehicleBySlug = cache(
  async (slug: string): Promise<Vehicle | null> =>
    seedVehicles.find((v) => v.slug === slug && v.status !== "rascunho") ??
    null,
);

export async function getPublicSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  return seedVehicles
    .filter((v) => v.status !== "rascunho")
    .map((v) => ({ slug: v.slug, updatedAt: v.createdAt }));
}

export async function getFeatured(limit = 6): Promise<Vehicle[]> {
  const listed = await getListedVehicles();
  return listed
    .filter((v) => v.featured && v.status === "disponivel")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getRecent(
  limit = 8,
  excludeIds: string[] = [],
): Promise<Vehicle[]> {
  const listed = await getListedVehicles();
  return listed
    .filter((v) => !excludeIds.includes(v.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Same body type first, then closest price. */
export async function getSimilar(
  vehicle: Vehicle,
  limit = 4,
): Promise<Vehicle[]> {
  const listed = await getListedVehicles();
  const price = vehicle.promoPrice ?? vehicle.price;
  return listed
    .filter((v) => v.id !== vehicle.id && v.status === "disponivel")
    .sort(
      (a, b) =>
        Number(b.bodyType === vehicle.bodyType) -
          Number(a.bodyType === vehicle.bodyType) ||
        Math.abs((a.promoPrice ?? a.price) - price) -
          Math.abs((b.promoPrice ?? b.price) - price),
    )
    .slice(0, limit);
}

export async function getVehicleByCode(
  code: string | undefined,
): Promise<Vehicle | null> {
  if (!code) return null;
  return (
    seedVehicles.find((v) => v.code === code && v.status !== "rascunho") ?? null
  );
}
