"use server";

import { headers } from "next/headers";
import { saveLead } from "@/lib/data/leads";
import {
  leadSchemas,
  leadTypes,
  PRIVACY_POLICY_VERSION,
  type LeadFormState,
  type LeadType,
} from "@/lib/leads";

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const type = raw.tipo as LeadType;

  // Honeypot: real people never fill this hidden field.
  if (raw.website) return { status: "success" };

  if (!leadTypes.includes(type)) {
    return {
      status: "error",
      message: "Formulário inválido. Recarregue a página e tente de novo.",
      fieldErrors: {},
      values: raw,
    };
  }

  const parsed = leadSchemas[type].safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors,
      values: raw,
    };
  }

  const h = await headers();
  const { nome, telefone, email, veiculo, consentimento, ...details } =
    parsed.data as Record<string, unknown> & {
      nome: string;
      telefone: string;
      email?: string;
      veiculo?: string;
    };

  void consentimento; // validated above; stored as the policy version
  const result = await saveLead({
    type,
    name: nome,
    phone: telefone,
    email: email ?? null,
    vehicleCode: veiculo ?? null,
    details,
    consentVersion: PRIVACY_POLICY_VERSION,
    sourceUrl: h.get("referer"),
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "rate_limited"
          ? "Recebemos vários envios seguidos. Aguarde alguns minutos ou fale com a gente pelo WhatsApp."
          : "Não conseguimos enviar agora. Tente de novo ou fale com a gente pelo WhatsApp.",
      fieldErrors: {},
      values: raw,
    };
  }
  return { status: "success" };
}
