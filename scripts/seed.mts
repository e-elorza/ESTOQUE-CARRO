/** Loads the demo dealership (settings, locations, vehicles) into an empty database. Usage: npm run db:seed */
import {
  seedLocations,
  seedSettings,
  seedVehicles,
} from "../src/lib/data/seed";
import { connect } from "./db";

const sql = connect();
const [{ count }] = await sql<
  { count: number }[]
>`select count(*)::int as count from vehicles`;
if (count > 0) {
  console.log("O banco já tem veículos. Nada foi alterado.");
  await sql.end();
  process.exit(0);
}

const s = seedSettings;
await sql.begin(async (tx) => {
  await tx`
    insert into dealership_settings (name, code_prefix, logo_url, accent_color, theme, whatsapp, phone, email,
      instagram, facebook, seo_title, seo_description, about, year_founded, reasons, site_url)
    values (${s.name}, ${s.codePrefix}, ${s.logoUrl}, ${s.accentColor}, ${s.theme}, ${s.whatsapp}, ${s.phone}, ${s.email},
      ${s.instagram}, ${s.facebook}, ${s.seoTitle}, ${s.seoDescription}, ${s.about}, ${s.yearFounded},
      ${tx.json(s.reasons)}, ${process.env.SITE_URL ?? s.siteUrl})
    on conflict (id) do nothing`;
  for (const l of seedLocations) {
    await tx`
      insert into locations (id, name, street, district, city, state, cep, phone, whatsapp, maps_url, hours, sort_order)
      values (${l.id}, ${l.name}, ${l.street}, ${l.district}, ${l.city}, ${l.state}, ${l.cep}, ${l.phone}, ${l.whatsapp},
        ${l.mapsUrl}, ${tx.json(l.hours)}, ${l.sortOrder})
      on conflict (id) do nothing`;
  }
  for (const v of seedVehicles) {
    await tx`
      insert into vehicles (code, slug, brand, model, version, year_manufacture, year_model, mileage_km, transmission,
        fuel, body_type, color, doors, engine, power_cv, plate_final, price, promo_price, status, featured, badges,
        location_id, description, equipment, sold_at, created_at)
      values (${v.code}, ${v.slug}, ${v.brand}, ${v.model}, ${v.version}, ${v.yearManufacture}, ${v.yearModel},
        ${v.mileageKm}, ${v.transmission}, ${v.fuel}, ${v.bodyType}, ${v.color}, ${v.doors}, ${v.engine}, ${v.powerCv},
        ${v.plateFinal}, ${v.price}, ${v.promoPrice}, ${v.status}, ${v.featured}, ${v.badges}, ${v.locationId},
        ${v.description}, ${v.equipment}, ${v.status === "vendido" ? v.createdAt : null}, ${v.createdAt})`;
  }
});
console.log(
  `Dados de demonstração carregados: ${seedVehicles.length} veículos, ${seedLocations.length} unidades.`,
);
await sql.end();
