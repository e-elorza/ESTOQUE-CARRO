import { describe, expect, it } from "vitest";
import { seedVehicles } from "@/lib/data/seed";
import {
  compare,
  filtersToQuery,
  matches,
  parseFilters,
  toIndexEntry,
} from "@/lib/filters";

const index = seedVehicles.map(toIndexEntry);

describe("filters", () => {
  it("round-trips through the URL", () => {
    const q =
      "marca=toyota&preco_max=150000&cambio=cvt,automatico&ordem=menor-preco";
    const f = parseFilters(new URLSearchParams(q));
    expect(f.marca).toBe("toyota");
    expect(f.cambio).toEqual(["cvt", "automatico"]);
    expect(new URLSearchParams(filtersToQuery(f)).get("preco_max")).toBe(
      "150000",
    );
  });

  it("ignores invalid sort values and pages", () => {
    const f = parseFilters({ ordem: "hack", pagina: "-3" });
    expect(f.ordem).toBe("recentes");
    expect(f.pagina).toBe(1);
  });

  it("filters by brand and price using the promotional price", () => {
    const f = parseFilters({ marca: "honda", preco_max: "130000" });
    const result = index.filter((e) => matches(e, f));
    // HR-V costs 134.900 but is on offer for 129.900
    expect(result.map((e) => e.model)).toEqual(["HR-V"]);
  });

  it("requires every selected option (equipment)", () => {
    const f = parseFilters({ opcionais: "Tração 4x4,Teto solar panorâmico" });
    const result = index.filter((e) => matches(e, f));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.equipment.includes("Tração 4x4"))).toBe(true);
  });

  it("sorts by lowest price", () => {
    const sorted = [...index].sort(compare("menor-preco"));
    expect(sorted[0].price).toBeLessThanOrEqual(sorted[1].price);
  });
});
