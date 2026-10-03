/**
 * Data access for public pages. Pages only import from here.
 *
 * With DATABASE_URL set, data comes from Postgres (cached, invalidated by the admin through
 * the "catalog" tag). Without it, the site runs on the demo seed.
 */
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { sql } from "../db";
import { compare, matches, toIndexEntry, type Filters } from "../filters";
import type {
  DealershipSettings,
  Location,
  Vehicle,
  VehicleIndexEntry,
} from "../types";
import {
  toLocation,
  toSettings,
  toVehicle,
  VEHICLE_SELECT,
  type LocationRow,
  type SettingsRow,
  type VehicleRow,
} from "./rows";
import { seedLocations, seedSettings, seedVehicles } from "./seed";

export const PAGE_SIZE = 18;
export const CATALOG_TAG = "catalog";

type PublicVehicle = Vehicle & { updatedAt: string };
type Catalog = {
  settings: DealershipSettings;
  locations: Location[];
  vehicles: PublicVehicle[];
};

async function loadFromDb(): Promise<Catalog> {
  const db = sql!;
  const [settingsRows, locationRows, vehicleRows] = await Promise.all([
    db<SettingsRow[]>`select * from dealership_settings limit 1`,
    db<LocationRow[]>`select * from locations order by sort_order, name`,
    db.unsafe<VehicleRow[]>(
      `${VEHICLE_SELECT} where v.status <> 'rascunho' order by v.created_at desc`,
    ),
  ]);
  return {
    // Fall back to the demo identity until settings are saved in the admin.
    settings: settingsRows[0] ? toSettings(settingsRows[0]) : seedSettings,
    locations: locationRows.map(toLocation),
    vehicles: vehicleRows.map(toVehicle),
  };
}

const loadCachedFromDb = unstable_cache(loadFromDb, ["catalog-v1"], {
  tags: [CATALOG_TAG],
  revalidate: 300,
});

const loadCatalog = cache(async (): Promise<Catalog> => {
  if (sql) return loadCachedFromDb();
  return {
    settings: seedSettings,
    locations: [...seedLocations].sort((a, b) => a.sortOrder - b.sortOrder),
    vehicles: seedVehicles
      .filter((v) => v.status !== "rascunho")
      .map((v) => ({ ...v, updatedAt: v.createdAt })),
  };
});

export async function getSettings(): Promise<DealershipSettings> {
  return (await loadCatalog()).settings;
}

export async function getLocations(): Promise<Location[]> {
  return (await loadCatalog()).locations;
}

/** Vehicles that may appear in listings: available and reserved. */
async function getListedVehicles(): Promise<PublicVehicle[]> {
  return (await loadCatalog()).vehicles.filter(
    (v) => v.status === "disponivel" || v.status === "reservado",
  );
}

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
export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  return (await loadCatalog()).vehicles.find((v) => v.slug === slug) ?? null;
}

export async function getVehicleByCode(
  code: string | undefined,
): Promise<Vehicle | null> {
  if (!code) return null;
  return (await loadCatalog()).vehicles.find((v) => v.code === code) ?? null;
}

export async function getPublicSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  return (await loadCatalog()).vehicles.map((v) => ({
    slug: v.slug,
    updatedAt: v.updatedAt,
  }));
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
