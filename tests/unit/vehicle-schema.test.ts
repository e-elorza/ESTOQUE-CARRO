import { describe, expect, it } from "vitest";
import { vehicleFormToObject, vehicleSchema } from "@/lib/admin/vehicle-schema";

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

const base: [string, string][] = [
  ["brand", "Toyota"],
  ["model", "Corolla"],
  ["yearManufacture", "2022"],
  ["yearModel", "2023"],
  ["mileageKm", "38.700"],
  ["transmission", "cvt"],
  ["fuel", "flex"],
  ["bodyType", "seda"],
  ["color", "Prata"],
  ["doors", "4"],
  ["price", "R$ 149.900"],
  ["status", "disponivel"],
];

describe("vehicle form", () => {
  it("parses masked numbers, checkboxes and extra equipment", () => {
    const fd = form([
      ...base,
      ["featured", "on"],
      ["badges", "unico_dono"],
      ["equipment", "ABS"],
      ["equipmentExtra", "Volante com aletas, ABS"],
    ]);
    const r = vehicleSchema.parse(vehicleFormToObject(fd));
    expect(r.price).toBe(149900);
    expect(r.mileageKm).toBe(38700);
    expect(r.featured).toBe(true);
    expect(r.badges).toEqual(["unico_dono"]);
    expect(r.equipment).toEqual(["ABS", "Volante com aletas"]);
    expect(r.promoPrice).toBeNull();
    expect(r.plateFinal).toBeNull();
  });

  it("rejects inconsistent years and a promo price above the price", () => {
    const fd = form([
      ...base.filter(([k]) => k !== "yearModel"),
      ["yearModel", "2025"],
      ["promoPrice", "R$ 160.000"],
    ]);
    const r = vehicleSchema.safeParse(vehicleFormToObject(fd));
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message).join(" ");
    expect(msgs).toContain("ano do modelo");
    expect(msgs).toContain("preço promocional deve ser menor");
  });
});
