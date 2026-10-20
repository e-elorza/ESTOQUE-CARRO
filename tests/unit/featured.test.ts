import { describe, expect, it } from "vitest";
import { seedVehicles } from "@/lib/data/seed";
import { isFeatureActive, pickFeatured } from "@/lib/featured";
import { compare, toIndexEntry } from "@/lib/filters";
import type { Vehicle, VehiclePhoto } from "@/lib/types";

const NOW = Date.parse("2026-10-20T12:00:00Z");
const DAY = 86_400_000;
const photo: VehiclePhoto = {
  id: "p",
  thumb: "t",
  card: "c",
  full: "f",
  width: 4,
  height: 3,
  alt: "",
};

let n = 0;
function car(patch: Partial<Vehicle> = {}): Vehicle {
  n += 1;
  return {
    ...seedVehicles[0],
    id: `car-${n}`,
    status: "disponivel",
    featuredPosition: null,
    featuredUntil: null,
    photos: [photo],
    createdAt: new Date(NOW - n * DAY).toISOString(),
    ...patch,
  };
}
const until = (days: number) => new Date(NOW + days * DAY).toISOString();
const ids = (entries: { vehicle: Vehicle }[]) =>
  entries.map((e) => e.vehicle.id);

describe("home page highlights", () => {
  it("treats a pick as active until its end date", () => {
    expect(
      isFeatureActive(
        car({ featuredPosition: 1, featuredUntil: until(1) }),
        NOW,
      ),
    ).toBe(true);
    expect(
      isFeatureActive(
        car({ featuredPosition: 1, featuredUntil: until(-1) }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isFeatureActive(car({ featuredPosition: 1, featuredUntil: null }), NOW),
    ).toBe(true);
    expect(isFeatureActive(car(), NOW)).toBe(false);
  });

  it("shows staff picks first, in their order, skipping expired and unavailable ones", () => {
    const second = car({ featuredPosition: 2, featuredUntil: until(3) });
    const first = car({ featuredPosition: 1, featuredUntil: until(3) });
    const expired = car({ featuredPosition: 3, featuredUntil: until(-1) });
    const reserved = car({
      featuredPosition: 4,
      featuredUntil: until(3),
      status: "reservado",
    });
    const picks = pickFeatured(
      [second, first, expired, reserved],
      {},
      { now: NOW },
    );
    expect(ids(picks).slice(0, 2)).toEqual([first.id, second.id]);
    expect(picks[0].source).toEqual({ kind: "manual" });
    expect(ids(picks)).not.toContain(reserved.id);
    // The expired pick can still come back as an automatic one (newest arrivals)
    expect(picks.find((p) => p.vehicle.id === expired.id)?.source.kind).toBe(
      "recent",
    );
  });

  it("fills free slots by WhatsApp clicks, then newest arrivals, preferring cars with photos", () => {
    const picked = car({ featuredPosition: 1, featuredUntil: until(5) });
    const newestNoPhoto = car({
      photos: [],
      createdAt: new Date(NOW).toISOString(),
    });
    const popular = car();
    const lessPopular = car();
    const recent = car();
    const older = car();
    const picks = pickFeatured(
      [older, recent, lessPopular, popular, newestNoPhoto, picked],
      { [popular.id]: 9, [lessPopular.id]: 2 },
      { now: NOW },
    );
    expect(ids(picks)).toEqual([
      picked.id,
      popular.id,
      lessPopular.id,
      recent.id,
      older.id,
    ]);
    expect(picks[1].source).toEqual({ kind: "clicks", clicks: 9 });
    expect(picks[3].source).toEqual({ kind: "recent" });
  });

  it("uses cars without photos only when nothing else is left", () => {
    const withPhoto = car();
    const noPhoto = car({ photos: [] });
    expect(ids(pickFeatured([noPhoto, withPhoto], {}, { now: NOW }))).toEqual([
      withPhoto.id,
      noPhoto.id,
    ]);
  });

  it("never returns more than the limit, even with more picks", () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      car({ featuredPosition: i + 1, featuredUntil: until(2) }),
    );
    const picks = pickFeatured(many, {}, { now: NOW });
    expect(ids(picks)).toEqual(
      ids(many.map((vehicle) => ({ vehicle }))).slice(0, 5),
    );
  });

  it("sorts the stock by active picks first when ordering by highlights", () => {
    const plain = car({ createdAt: new Date(NOW).toISOString() });
    const second = car({ featuredPosition: 2, featuredUntil: until(2) });
    const first = car({ featuredPosition: 1, featuredUntil: until(2) });
    const sorted = [plain, second, first]
      .map((v) => ({ v, e: toIndexEntry(v) }))
      .sort((a, b) => compare("destaques")(a.e, b.e))
      .map(({ v }) => v.id);
    expect(sorted).toEqual([first.id, second.id, plain.id]);
  });
});
