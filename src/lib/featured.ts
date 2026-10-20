/**
 * "Destaques da semana": up to FEATURED_SLOTS cars on the home page.
 *
 * Staff pick cars in the admin (ordered, each valid for a few days). Free slots are filled
 * automatically: first the cars most asked about on WhatsApp in the last 7 days, then the
 * newest arrivals. Automatic picks prefer cars with photos.
 */
import type { Vehicle } from "./types";

export const FEATURED_SLOTS = 5;
export const FEATURED_DURATIONS = [7, 14, 30] as const;
export const FEATURED_DEFAULT_DAYS = 7;
export const CLICK_WINDOW_DAYS = 7;

type FeaturedFields = Pick<Vehicle, "featuredPosition" | "featuredUntil">;

/** True when the pick has not ended yet. */
export function isFeatureActive(v: FeaturedFields, now = Date.now()): boolean {
  return (
    v.featuredPosition != null &&
    (v.featuredUntil == null || Date.parse(v.featuredUntil) > now)
  );
}

/** Position of an active pick, or null. */
export function activeFeatureRank(
  v: FeaturedFields,
  now = Date.now(),
): number | null {
  return isFeatureActive(v, now) ? v.featuredPosition : null;
}

export type FeaturedSource =
  { kind: "manual" } | { kind: "clicks"; clicks: number } | { kind: "recent" };

export type FeaturedEntry<V> = { vehicle: V; source: FeaturedSource };

export function pickFeatured<V extends Vehicle>(
  vehicles: V[],
  clicks: Record<string, number>,
  { now = Date.now(), limit = FEATURED_SLOTS } = {},
): FeaturedEntry<V>[] {
  const newestFirst = (a: V, b: V) => b.createdAt.localeCompare(a.createdAt);
  const available = vehicles.filter((v) => v.status === "disponivel");

  const manual = available
    .filter((v) => isFeatureActive(v, now))
    .sort(
      (a, b) => a.featuredPosition! - b.featuredPosition! || newestFirst(a, b),
    )
    .slice(0, limit);

  const taken = new Set(manual.map((v) => v.id));
  const rest = available.filter((v) => !taken.has(v.id));
  const withPhotos = rest.filter((v) => v.photos.length > 0);
  const byClicks = withPhotos
    .filter((v) => (clicks[v.id] ?? 0) > 0)
    .sort((a, b) => clicks[b.id] - clicks[a.id] || newestFirst(a, b));
  const clicked = new Set(byClicks.map((v) => v.id));
  const byRecent = [
    ...withPhotos.filter((v) => !clicked.has(v.id)).sort(newestFirst),
    ...rest.filter((v) => v.photos.length === 0).sort(newestFirst),
  ];

  return [
    ...manual.map((vehicle) => ({
      vehicle,
      source: { kind: "manual" } as const,
    })),
    ...byClicks.map((vehicle) => ({
      vehicle,
      source: { kind: "clicks", clicks: clicks[vehicle.id] } as const,
    })),
    ...byRecent.map((vehicle) => ({
      vehicle,
      source: { kind: "recent" } as const,
    })),
  ].slice(0, limit);
}
