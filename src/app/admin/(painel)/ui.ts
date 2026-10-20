import type { LeadStatus } from "@/lib/data/admin";
import type { VehicleStatus } from "@/lib/types";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const dateLong = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDateLong = (iso: string) => dateLong.format(new Date(iso));

export function leadTone(
  status: LeadStatus,
): "accent" | "warning" | "success" | "neutral" | "danger" {
  return {
    novo: "accent",
    em_contato: "warning",
    negociacao: "warning",
    fechado: "success",
    perdido: "neutral",
  }[status] as "accent" | "warning" | "success" | "neutral";
}

export function vehicleTone(
  status: VehicleStatus,
): "success" | "warning" | "neutral" | "accent" {
  return (
    {
      disponivel: "success",
      reservado: "warning",
      vendido: "neutral",
      rascunho: "accent",
    } as const
  )[status];
}

const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** "Até 27/10, faltam 5 dias", "Venceu em 20/10" or "Sem prazo" for a home page pick. */
export function formatPickEnd(iso: string | null, now = Date.now()): string {
  if (!iso) return "Sem prazo";
  const ms = Date.parse(iso) - now;
  const date = dayMonth.format(new Date(iso));
  if (ms <= 0) return `Venceu em ${date}`;
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return `Até ${date}, termina em menos de 24 horas`;
  return `Até ${date}, ${days === 1 ? "falta 1 dia" : `faltam ${days} dias`}`;
}
