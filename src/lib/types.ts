export type Theme = "light" | "dark";

export type Transmission = "manual" | "automatico" | "cvt" | "automatizado";
export type Fuel = "flex" | "gasolina" | "diesel" | "hibrido" | "eletrico";
export type BodyType =
  "hatch" | "seda" | "suv" | "picape" | "minivan" | "cupe" | "conversivel";
export type VehicleStatus = "disponivel" | "reservado" | "vendido" | "rascunho";
export type Badge = "unico_dono" | "baixa_km";

export type OpeningHours = { days: string; hours: string }[];

export type DealershipSettings = {
  name: string;
  /** Short code prefix used in vehicle codes, e.g. "VA" -> VA-0142 */
  codePrefix: string;
  logoUrl: string | null;
  accentColor: string;
  theme: Theme;
  /** Digits only, with country code, e.g. 5511987654321 */
  whatsapp: string;
  /** Digits only, with country code */
  phone: string;
  email: string;
  instagram: string | null;
  facebook: string | null;
  seoTitle: string;
  seoDescription: string;
  /** Short institutional text for the About page */
  about: string;
  yearFounded: number | null;
  /** "Por que comprar aqui" items. Empty list hides the section. */
  reasons: { title: string; text: string }[];
  siteUrl: string;
};

export type Location = {
  id: string;
  name: string;
  street: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  phone: string | null;
  whatsapp: string | null;
  mapsUrl: string | null;
  hours: OpeningHours;
  sortOrder: number;
};

export type VehiclePhoto = {
  id: string;
  /** Public URLs for each generated size */
  thumb: string;
  card: string;
  full: string;
  width: number;
  height: number;
  alt: string;
};

export type Vehicle = {
  id: string;
  code: string;
  slug: string;
  brand: string;
  model: string;
  version: string;
  yearManufacture: number;
  yearModel: number;
  mileageKm: number;
  transmission: Transmission;
  fuel: Fuel;
  bodyType: BodyType;
  color: string;
  doors: number;
  engine: string | null;
  powerCv: number | null;
  plateFinal: number | null;
  price: number;
  promoPrice: number | null;
  status: VehicleStatus;
  featured: boolean;
  badges: Badge[];
  locationId: string | null;
  description: string;
  equipment: string[];
  photos: VehiclePhoto[];
  createdAt: string;
};

/** Compact shape sent to the client for live filter counts and model lists. */
export type VehicleIndexEntry = Pick<
  Vehicle,
  | "brand"
  | "model"
  | "yearModel"
  | "mileageKm"
  | "transmission"
  | "fuel"
  | "bodyType"
  | "color"
  | "locationId"
  | "equipment"
  | "featured"
  | "createdAt"
> & { price: number };
