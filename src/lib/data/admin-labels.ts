import type { VehicleStatus } from "../types";

export type LeadStatus =
  "novo" | "em_contato" | "negociacao" | "fechado" | "perdido";

export const leadStatusLabel: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  rascunho: "Rascunho",
};
