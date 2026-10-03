import { z } from "zod";

const digits = (v: unknown) =>
  typeof v === "string" ? v.replace(/\D/g, "") : v;
const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) =>
      typeof v === "string" && v.replace(/\D/g, "") === ""
        ? undefined
        : digits(v),
    z.coerce.number().int().min(min, message).max(max, message).optional(),
  );

const currentYear = new Date().getFullYear();

export const vehicleSchema = z
  .object({
    brand: z.string().trim().min(2, "Informe a marca."),
    model: z.string().trim().min(1, "Informe o modelo."),
    version: z.string().trim().max(80, "Versão muito longa.").default(""),
    yearManufacture: z.coerce
      .number({ error: "Informe o ano de fabricação." })
      .int()
      .min(1950, "Ano inválido.")
      .max(currentYear + 1, "Ano inválido."),
    yearModel: z.coerce
      .number({ error: "Informe o ano do modelo." })
      .int()
      .min(1950, "Ano inválido.")
      .max(currentYear + 2, "Ano inválido."),
    mileageKm: z.preprocess(
      digits,
      z.coerce
        .number({ error: "Informe a quilometragem." })
        .int()
        .min(0, "Quilometragem inválida.")
        .max(2_000_000, "Quilometragem inválida."),
    ),
    transmission: z.enum(["manual", "automatico", "cvt", "automatizado"], {
      error: "Escolha o câmbio.",
    }),
    fuel: z.enum(["flex", "gasolina", "diesel", "hibrido", "eletrico"], {
      error: "Escolha o combustível.",
    }),
    bodyType: z.enum(
      ["hatch", "seda", "suv", "picape", "minivan", "cupe", "conversivel"],
      { error: "Escolha a carroceria." },
    ),
    color: z.string().trim().min(2, "Informe a cor."),
    doors: z.coerce
      .number()
      .int()
      .min(2, "Portas: de 2 a 5.")
      .max(5, "Portas: de 2 a 5.")
      .default(4),
    engine: z
      .string()
      .trim()
      .max(60)
      .optional()
      .transform((v) => v || null),
    powerCv: optionalInt(1, 2000, "Potência inválida.").transform(
      (v) => v ?? null,
    ),
    plateFinal: optionalInt(0, 9, "Use um dígito de 0 a 9.").transform(
      (v) => v ?? null,
    ),
    price: z.preprocess(
      digits,
      z.coerce
        .number({ error: "Informe o preço." })
        .int()
        .min(1000, "Informe o preço."),
    ),
    promoPrice: optionalInt(
      1,
      100_000_000,
      "Preço promocional inválido.",
    ).transform((v) => v ?? null),
    status: z.enum(["disponivel", "reservado", "vendido", "rascunho"]),
    featured: z.preprocess((v) => v === "on", z.boolean()),
    badges: z.array(z.enum(["unico_dono", "baixa_km"])).default([]),
    locationId: z
      .string()
      .optional()
      .transform((v) => v || null),
    description: z
      .string()
      .trim()
      .max(4000, "Descrição muito longa.")
      .default(""),
    equipment: z.array(z.string().trim().min(1).max(80)).default([]),
  })
  .superRefine((d, ctx) => {
    if (
      d.yearModel < d.yearManufacture ||
      d.yearModel > d.yearManufacture + 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["yearModel"],
        message:
          "O ano do modelo deve ser igual ou um ano depois do de fabricação.",
      });
    }
    if (d.promoPrice !== null && d.promoPrice >= d.price) {
      ctx.addIssue({
        code: "custom",
        path: ["promoPrice"],
        message: "O preço promocional deve ser menor que o preço.",
      });
    }
  });

export type VehicleInput = z.infer<typeof vehicleSchema>;

/** Turns FormData into the shape the schema expects (arrays for repeated fields). */
export function vehicleFormToObject(formData: FormData) {
  const obj: Record<string, unknown> = Object.fromEntries(
    [...formData.entries()].filter(
      ([k, v]) => typeof v === "string" && k !== "badges" && k !== "equipment",
    ),
  );
  obj.badges = formData.getAll("badges").filter((v) => typeof v === "string");
  const extra = String(formData.get("equipmentExtra") ?? "")
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  obj.equipment = [
    ...new Set([
      ...formData
        .getAll("equipment")
        .filter((v): v is string => typeof v === "string"),
      ...extra,
    ]),
  ];
  return obj;
}
