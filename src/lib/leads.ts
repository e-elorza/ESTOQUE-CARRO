import { z } from "zod";

export const PRIVACY_POLICY_VERSION = "2026-10-01";

export const leadTypes = [
  "financiamento",
  "troca",
  "proposta",
  "visita",
  "contato",
] as const;
export type LeadType = (typeof leadTypes)[number];

export const leadTypeLabel: Record<LeadType, string> = {
  financiamento: "Financiamento",
  troca: "Venda / troca",
  proposta: "Proposta",
  visita: "Visita",
  contato: "Contato",
};

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine(
    (v) => v.length === 10 || v.length === 11,
    "Informe um telefone com DDD, por exemplo (11) 98765-4321.",
  );

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((v) => v || undefined);

const money = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v.replace(/\D/g, "")) : undefined))
  .refine(
    (v) => v === undefined || (v >= 0 && v < 100_000_000),
    "Informe um valor válido.",
  );

const base = {
  nome: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  telefone: phone,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .refine(
      (v) => !v || z.email().safeParse(v).success,
      "Informe um e-mail válido ou deixe em branco.",
    ),
  veiculo: optionalText(40),
  mensagem: optionalText(1000),
  consentimento: z.literal("on", {
    error: "Para enviar, autorize o uso dos seus dados para este contato.",
  }),
};

export const leadSchemas = {
  financiamento: z.object({
    ...base,
    entrada: money,
    prazo: z.enum(["12", "24", "36", "48", "60"], {
      error: "Escolha o prazo desejado.",
    }),
  }),
  troca: z.object({
    ...base,
    marca: z.string().trim().min(2, "Informe a marca."),
    modelo: z.string().trim().min(1, "Informe o modelo."),
    versao: optionalText(80),
    ano: z.coerce
      .number({ error: "Informe o ano." })
      .int()
      .min(1980, "Informe um ano válido.")
      .max(new Date().getFullYear() + 1, "Informe um ano válido."),
    km: z
      .string()
      .transform((v) => Number(v.replace(/\D/g, "")))
      .refine((v) => v > 0 && v < 2_000_000, "Informe a quilometragem."),
    cambio: z.enum(["manual", "automatico"], { error: "Escolha o câmbio." }),
    estado: z.enum(["excelente", "bom", "regular", "reparos"], {
      error: "Escolha o estado geral.",
    }),
  }),
  proposta: z.object({ ...base, valorProposta: money }),
  visita: z.object({
    ...base,
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data."),
    periodo: z.enum(["manha", "tarde"], { error: "Escolha o período." }),
    unidade: optionalText(40),
  }),
  contato: z.object(base),
} satisfies Record<LeadType, z.ZodType>;

export type { FormState as LeadFormState } from "./form-state";
