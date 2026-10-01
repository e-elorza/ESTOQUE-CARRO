/**
 * Stock filters: URL (de)serialisation and pure matching/sorting.
 * Shared by the server (results) and the client (live counts in the filter panel).
 */
import { effectivePrice, slugify } from "./format";
import type {
  BodyType,
  Fuel,
  Transmission,
  Vehicle,
  VehicleIndexEntry,
} from "./types";

export const sortOptions = [
  { value: "recentes", label: "Mais recentes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "menor-km", label: "Menor quilometragem" },
  { value: "maior-ano", label: "Maior ano" },
  { value: "destaques", label: "Destaques" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export type Filters = {
  marca?: string;
  modelo?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  anoMax?: number;
  kmMax?: number;
  cambio: Transmission[];
  combustivel: Fuel[];
  carroceria: BodyType[];
  cor: string[];
  unidade: string[];
  opcionais: string[];
  ordem: SortValue;
  pagina: number;
};

export const emptyFilters: Filters = {
  cambio: [],
  combustivel: [],
  carroceria: [],
  cor: [],
  unidade: [],
  opcionais: [],
  ordem: "recentes",
  pagina: 1,
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function num(params: Params, key: string): number | undefined {
  const raw = get(params, key);
  if (!raw) return undefined;
  const n = Number(raw.replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function list<T extends string>(params: Params, key: string): T[] {
  const raw = get(params, key);
  return raw ? (raw.split(",").filter(Boolean) as T[]) : [];
}

export function parseFilters(params: Params): Filters {
  const ordem = get(params, "ordem");
  return {
    marca: get(params, "marca") || undefined,
    modelo: get(params, "modelo") || undefined,
    precoMin: num(params, "preco_min"),
    precoMax: num(params, "preco_max"),
    anoMin: num(params, "ano_min"),
    anoMax: num(params, "ano_max"),
    kmMax: num(params, "km_max"),
    cambio: list(params, "cambio"),
    combustivel: list(params, "combustivel"),
    carroceria: list(params, "carroceria"),
    cor: list(params, "cor"),
    unidade: list(params, "unidade"),
    opcionais: list(params, "opcionais"),
    ordem: sortOptions.some((o) => o.value === ordem)
      ? (ordem as SortValue)
      : "recentes",
    pagina: Math.max(1, Number.parseInt(get(params, "pagina") ?? "1", 10) || 1),
  };
}

/** Serialise to a query string. Page and default sort are omitted. */
export function filtersToQuery(f: Filters, { keepPage = false } = {}): string {
  const q = new URLSearchParams();
  if (f.marca) q.set("marca", f.marca);
  if (f.modelo) q.set("modelo", f.modelo);
  if (f.precoMin) q.set("preco_min", String(f.precoMin));
  if (f.precoMax) q.set("preco_max", String(f.precoMax));
  if (f.anoMin) q.set("ano_min", String(f.anoMin));
  if (f.anoMax) q.set("ano_max", String(f.anoMax));
  if (f.kmMax) q.set("km_max", String(f.kmMax));
  for (const key of [
    "cambio",
    "combustivel",
    "carroceria",
    "cor",
    "unidade",
    "opcionais",
  ] as const) {
    if (f[key].length) q.set(key, f[key].join(","));
  }
  if (f.ordem !== "recentes") q.set("ordem", f.ordem);
  if (keepPage && f.pagina > 1) q.set("pagina", String(f.pagina));
  return q.toString();
}

export function countActiveFilters(f: Filters): number {
  return (
    [
      f.marca,
      f.modelo,
      f.precoMin || f.precoMax,
      f.anoMin || f.anoMax,
      f.kmMax,
    ].filter(Boolean).length +
    f.cambio.length +
    f.combustivel.length +
    f.carroceria.length +
    f.cor.length +
    f.unidade.length +
    f.opcionais.length
  );
}

export function toIndexEntry(v: Vehicle): VehicleIndexEntry {
  return {
    brand: v.brand,
    model: v.model,
    price: effectivePrice(v),
    yearModel: v.yearModel,
    mileageKm: v.mileageKm,
    transmission: v.transmission,
    fuel: v.fuel,
    bodyType: v.bodyType,
    color: v.color,
    locationId: v.locationId,
    equipment: v.equipment,
    featured: v.featured,
    createdAt: v.createdAt,
  };
}

/** Normalise a colour name to its base colour ("Cinza Platinum" -> "Cinza"). */
export function baseColor(color: string): string {
  return color.split(" ")[0];
}

export function matches(e: VehicleIndexEntry, f: Filters): boolean {
  if (f.marca && slugify(e.brand) !== f.marca) return false;
  if (f.modelo && slugify(e.model) !== f.modelo) return false;
  if (f.precoMin && e.price < f.precoMin) return false;
  if (f.precoMax && e.price > f.precoMax) return false;
  if (f.anoMin && e.yearModel < f.anoMin) return false;
  if (f.anoMax && e.yearModel > f.anoMax) return false;
  if (f.kmMax && e.mileageKm > f.kmMax) return false;
  if (f.cambio.length && !f.cambio.includes(e.transmission)) return false;
  if (f.combustivel.length && !f.combustivel.includes(e.fuel)) return false;
  if (f.carroceria.length && !f.carroceria.includes(e.bodyType)) return false;
  if (f.cor.length && !f.cor.includes(slugify(baseColor(e.color))))
    return false;
  if (f.unidade.length && (!e.locationId || !f.unidade.includes(e.locationId)))
    return false;
  if (f.opcionais.length && !f.opcionais.every((o) => e.equipment.includes(o)))
    return false;
  return true;
}

export function compare(sort: SortValue) {
  return (a: VehicleIndexEntry, b: VehicleIndexEntry): number => {
    switch (sort) {
      case "menor-preco":
        return a.price - b.price;
      case "maior-preco":
        return b.price - a.price;
      case "menor-km":
        return a.mileageKm - b.mileageKm;
      case "maior-ano":
        return (
          b.yearModel - a.yearModel || b.createdAt.localeCompare(a.createdAt)
        );
      case "destaques":
        return (
          Number(b.featured) - Number(a.featured) ||
          b.createdAt.localeCompare(a.createdAt)
        );
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  };
}

export const priceRanges = [
  { label: "Até R$ 100 mil", max: 100000 },
  { label: "R$ 100 a 150 mil", min: 100000, max: 150000 },
  { label: "R$ 150 a 250 mil", min: 150000, max: 250000 },
  { label: "Acima de R$ 250 mil", min: 250000 },
] as const;

export const NEW_ARRIVAL_DAYS = 7;

export function isNewArrival(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < NEW_ARRIVAL_DAYS * 86_400_000;
}
