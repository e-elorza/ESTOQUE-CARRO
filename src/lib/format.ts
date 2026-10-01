import type { BodyType, Fuel, Transmission, Vehicle } from "./types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const int = new Intl.NumberFormat("pt-BR");

/** R$ 129.900 (non-breaking space normalised to a regular one) */
export function formatPrice(value: number): string {
  return brl.format(value).replace(/ /g, " ");
}

export function formatKm(value: number): string {
  return `${int.format(value)} km`;
}

export function formatNumber(value: number): string {
  return int.format(value);
}

export function formatYears(
  v: Pick<Vehicle, "yearManufacture" | "yearModel">,
): string {
  return `${v.yearManufacture}/${v.yearModel}`;
}

/** 5511987654321 -> (11) 98765-4321 */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function telHref(digits: string): string {
  return `tel:+${digits.replace(/\D/g, "")}`;
}

export function whatsappUrl(digits: string, message?: string): string {
  const base = `https://wa.me/${digits.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function vehicleTitle(
  v: Pick<Vehicle, "brand" | "model" | "version">,
): string {
  return `${v.brand} ${v.model} ${v.version}`.trim();
}

export function effectivePrice(
  v: Pick<Vehicle, "price" | "promoPrice">,
): number {
  return v.promoPrice ?? v.price;
}

export function vehicleWhatsappMessage(v: Vehicle, pageUrl: string): string {
  return `Olá! Tenho interesse no ${vehicleTitle(v)} ${formatYears(v)} (${formatPrice(
    effectivePrice(v),
  )}), código ${v.code}. Vi no site: ${pageUrl}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const transmissionLabel: Record<Transmission, string> = {
  manual: "Manual",
  automatico: "Automático",
  cvt: "CVT",
  automatizado: "Automatizado",
};

export const fuelLabel: Record<Fuel, string> = {
  flex: "Flex",
  gasolina: "Gasolina",
  diesel: "Diesel",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
};

export const bodyTypeLabel: Record<BodyType, string> = {
  hatch: "Hatch",
  seda: "Sedã",
  suv: "SUV",
  picape: "Picape",
  minivan: "Minivan",
  cupe: "Cupê",
  conversivel: "Conversível",
};

/** "1 veículo" / "32 veículos" */
export function pluralVehicles(n: number): string {
  return `${formatNumber(n)} ${n === 1 ? "veículo" : "veículos"}`;
}
