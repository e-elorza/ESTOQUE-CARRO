/** Row <-> domain mapping for Postgres queries. */
import { storage } from "../storage";
import type {
  DealershipSettings,
  Location,
  Vehicle,
  VehiclePhoto,
} from "../types";

export type VehicleRow = {
  id: string;
  code: string;
  slug: string;
  brand: string;
  model: string;
  version: string;
  year_manufacture: number;
  year_model: number;
  mileage_km: number;
  transmission: Vehicle["transmission"];
  fuel: Vehicle["fuel"];
  body_type: Vehicle["bodyType"];
  color: string;
  doors: number;
  engine: string | null;
  power_cv: number | null;
  plate_final: number | null;
  price: number;
  promo_price: number | null;
  status: Vehicle["status"];
  featured: boolean;
  badges: string[];
  location_id: string | null;
  description: string;
  equipment: string[];
  created_at: Date | string;
  updated_at: Date | string;
  photos: PhotoRow[];
};

export type PhotoRow = {
  id: string;
  position: number;
  key_thumb: string;
  key_card: string;
  key_full: string;
  width: number;
  height: number;
  alt: string;
};

const iso = (d: Date | string) =>
  d instanceof Date ? d.toISOString() : new Date(d).toISOString();

export function toPhoto(p: PhotoRow): VehiclePhoto {
  return {
    id: p.id,
    thumb: storage.publicUrl(p.key_thumb),
    card: storage.publicUrl(p.key_card),
    full: storage.publicUrl(p.key_full),
    width: p.width,
    height: p.height,
    alt: p.alt,
  };
}

export function toVehicle(r: VehicleRow): Vehicle & { updatedAt: string } {
  return {
    id: r.id,
    code: r.code,
    slug: r.slug,
    brand: r.brand,
    model: r.model,
    version: r.version,
    yearManufacture: r.year_manufacture,
    yearModel: r.year_model,
    mileageKm: r.mileage_km,
    transmission: r.transmission,
    fuel: r.fuel,
    bodyType: r.body_type,
    color: r.color,
    doors: r.doors,
    engine: r.engine,
    powerCv: r.power_cv,
    plateFinal: r.plate_final,
    price: r.price,
    promoPrice: r.promo_price,
    status: r.status,
    featured: r.featured,
    badges: r.badges as Vehicle["badges"],
    locationId: r.location_id,
    description: r.description,
    equipment: r.equipment,
    photos: (r.photos ?? [])
      .sort((a, b) => a.position - b.position)
      .map(toPhoto),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export type LocationRow = {
  id: string;
  name: string;
  street: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  phone: string | null;
  whatsapp: string | null;
  maps_url: string | null;
  hours: Location["hours"];
  sort_order: number;
};

export function toLocation(r: LocationRow): Location {
  return {
    id: r.id,
    name: r.name,
    street: r.street,
    district: r.district,
    city: r.city,
    state: r.state,
    cep: r.cep,
    phone: r.phone,
    whatsapp: r.whatsapp,
    mapsUrl: r.maps_url,
    hours: r.hours,
    sortOrder: r.sort_order,
  };
}

export type SettingsRow = {
  name: string;
  code_prefix: string;
  logo_url: string | null;
  accent_color: string;
  theme: DealershipSettings["theme"];
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string | null;
  facebook: string | null;
  seo_title: string;
  seo_description: string;
  about: string;
  year_founded: number | null;
  reasons: DealershipSettings["reasons"];
  site_url: string;
};

export function toSettings(r: SettingsRow): DealershipSettings {
  return {
    name: r.name,
    codePrefix: r.code_prefix,
    logoUrl: r.logo_url,
    accentColor: r.accent_color,
    theme: r.theme,
    whatsapp: r.whatsapp,
    phone: r.phone,
    email: r.email,
    instagram: r.instagram,
    facebook: r.facebook,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    about: r.about,
    yearFounded: r.year_founded,
    reasons: r.reasons,
    siteUrl: r.site_url,
  };
}

/** Columns + aggregated photos for vehicle queries. Use inside sql`` with sql.unsafe. */
export const VEHICLE_SELECT = `
  select v.*,
    coalesce(
      (select json_agg(json_build_object(
          'id', p.id, 'position', p.position, 'key_thumb', p.key_thumb, 'key_card', p.key_card,
          'key_full', p.key_full, 'width', p.width, 'height', p.height, 'alt', p.alt)
        order by p.position)
       from vehicle_photos p where p.vehicle_id = v.id),
      '[]'::json) as photos
  from vehicles v`;
