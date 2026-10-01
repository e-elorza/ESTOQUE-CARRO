import { describe, expect, it } from "vitest";
import { leadSchemas } from "@/lib/leads";

const base = {
  nome: "Ana Paula Ribeiro",
  telefone: "(11) 98765-4321",
  consentimento: "on",
};

describe("lead validation", () => {
  it("accepts a valid financing request and normalises fields", () => {
    const r = leadSchemas.financiamento.parse({
      ...base,
      entrada: "R$ 30.000",
      prazo: "48",
      email: "",
    });
    expect(r.telefone).toBe("11987654321");
    expect(r.entrada).toBe(30000);
    expect(r.email).toBeUndefined();
  });

  it("rejects missing consent and bad phone with Portuguese messages", () => {
    const r = leadSchemas.contato.safeParse({ nome: "Ana", telefone: "1234" });
    expect(r.success).toBe(false);
    const messages = r.error!.issues.map((i) => i.message).join(" ");
    expect(messages).toContain("telefone com DDD");
    expect(messages).toContain("autorize o uso dos seus dados");
  });

  it("validates trade-in vehicle data", () => {
    const r = leadSchemas.troca.safeParse({
      ...base,
      marca: "VW",
      modelo: "Polo",
      ano: "2021",
      km: "45.000",
      cambio: "manual",
      estado: "bom",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.km).toBe(45000);
  });
});
