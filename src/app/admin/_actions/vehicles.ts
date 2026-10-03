"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import sharp, { type Metadata } from "sharp";
import { vehicleFormToObject, vehicleSchema } from "@/lib/admin/vehicle-schema";
import { requireStaff } from "@/lib/auth/session";
import { getSettingsAdmin } from "@/lib/data/admin";
import { requireSql } from "@/lib/db";
import { formValues, zodErrorState, type FormState } from "@/lib/form-state";
import { slugify } from "@/lib/format";
import { storage } from "@/lib/storage";
import type { VehicleStatus } from "@/lib/types";
import { revalidateCatalog } from "./revalidate";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/.test(id);

export async function saveVehicle(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  const sql = requireSql();
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData);
  const parsed = vehicleSchema.safeParse(vehicleFormToObject(formData));
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const d = parsed.data;

  if (d.locationId) {
    const [loc] = await sql`select 1 from locations where id = ${d.locationId}`;
    if (!loc)
      return {
        status: "error",
        message: "Unidade não encontrada.",
        fieldErrors: { locationId: "Escolha uma unidade válida." },
        values,
      };
  }

  const columns = {
    brand: d.brand,
    model: d.model,
    version: d.version,
    year_manufacture: d.yearManufacture,
    year_model: d.yearModel,
    mileage_km: d.mileageKm,
    transmission: d.transmission,
    fuel: d.fuel,
    body_type: d.bodyType,
    color: d.color,
    doors: d.doors,
    engine: d.engine,
    power_cv: d.powerCv,
    plate_final: d.plateFinal,
    price: d.price,
    promo_price: d.promoPrice,
    status: d.status,
    featured: d.featured,
    badges: d.badges,
    location_id: d.locationId,
    description: d.description,
    equipment: d.equipment,
  };

  let savedId = id;
  if (id && isUuid(id)) {
    // The slug stays stable after creation so shared links and Google results keep working.
    const [row] = await sql<{ id: string }[]>`
      update vehicles set ${sql(columns)},
        sold_at = case when ${d.status} = 'vendido' then coalesce(sold_at, now()) else null end
      where id = ${id} returning id`;
    if (!row)
      return {
        status: "error",
        message: "Veículo não encontrado.",
        fieldErrors: {},
        values,
      };
  } else {
    const settings = await getSettingsAdmin();
    const [{ n }] = await sql<
      { n: string }[]
    >`select nextval('vehicle_code_seq')::text as n`;
    const code = `${settings.codePrefix}-${n.padStart(4, "0")}`;
    const slug = slugify(
      `${d.brand} ${d.model} ${d.version} ${d.yearModel} ${code}`,
    );
    const [row] = await sql<{ id: string }[]>`
      insert into vehicles ${sql({ ...columns, code, slug, sold_at: d.status === "vendido" ? new Date() : null })}
      returning id`;
    savedId = row.id;
  }

  revalidateCatalog();
  redirect(`/admin/veiculos/${savedId}?salvo=1`);
}

export async function setVehicleStatus(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as VehicleStatus;
  if (
    !isUuid(id) ||
    !["disponivel", "reservado", "vendido", "rascunho"].includes(status)
  )
    return;
  await requireSql()`
    update vehicles set status = ${status},
      sold_at = case when ${status} = 'vendido' then coalesce(sold_at, now()) else null end
    where id = ${id}`;
  revalidateCatalog();
}

export async function duplicateVehicle(formData: FormData): Promise<void> {
  await requireStaff();
  const sql = requireSql();
  const id = String(formData.get("id"));
  if (!isUuid(id)) return;
  const [src] = await sql<
    { brand: string; model: string; version: string; year_model: number }[]
  >`
    select brand, model, version, year_model from vehicles where id = ${id}`;
  if (!src) return;
  const settings = await getSettingsAdmin();
  const [{ n }] = await sql<
    { n: string }[]
  >`select nextval('vehicle_code_seq')::text as n`;
  const code = `${settings.codePrefix}-${n.padStart(4, "0")}`;
  const slug = slugify(
    `${src.brand} ${src.model} ${src.version} ${src.year_model} ${code}`,
  );
  // Copy goes in as a draft without photos or plate digit, ready to adjust.
  const [row] = await sql<{ id: string }[]>`
    insert into vehicles (code, slug, brand, model, version, year_manufacture, year_model, mileage_km, transmission, fuel,
      body_type, color, doors, engine, power_cv, price, promo_price, status, badges, location_id, description, equipment)
    select ${code}, ${slug}, brand, model, version, year_manufacture, year_model, mileage_km, transmission, fuel,
      body_type, color, doors, engine, power_cv, price, promo_price, 'rascunho', badges, location_id, description, equipment
    from vehicles where id = ${id}
    returning id`;
  redirect(`/admin/veiculos/${row.id}?copiado=1`);
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  await requireStaff();
  const sql = requireSql();
  const id = String(formData.get("id"));
  if (!isUuid(id)) return;
  const photos = await sql<
    { key_thumb: string; key_card: string; key_full: string }[]
  >`
    select key_thumb, key_card, key_full from vehicle_photos where vehicle_id = ${id}`;
  await sql`delete from vehicles where id = ${id}`;
  await storage
    .remove(photos.flatMap((p) => [p.key_thumb, p.key_card, p.key_full]))
    .catch(() => {});
  revalidateCatalog();
  redirect("/admin/veiculos?excluido=1");
}

// Photos ------------------------------------------------------------------------

const SIZES = { thumb: 480, card: 960, full: 1920 } as const;
const MAX_UPLOAD = 4 * 1024 * 1024;

export type PhotoResult =
  | { ok: true; photo: { id: string; thumb: string; position: number } }
  | { ok: false; message: string };

export async function uploadPhoto(
  vehicleId: string,
  formData: FormData,
): Promise<PhotoResult> {
  await requireStaff();
  const sql = requireSql();
  if (!isUuid(vehicleId)) return { ok: false, message: "Veículo inválido." };
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Nenhuma foto recebida." };
  if (file.size > MAX_UPLOAD)
    return { ok: false, message: "Foto muito grande. O limite é 4 MB." };

  const [vehicle] = await sql<
    { brand: string; model: string; count: number }[]
  >`
    select brand, model, (select count(*)::int from vehicle_photos where vehicle_id = v.id) as count
    from vehicles v where id = ${vehicleId}`;
  if (!vehicle) return { ok: false, message: "Veículo não encontrado." };
  if (vehicle.count >= 40)
    return { ok: false, message: "Limite de 40 fotos por veículo." };

  let input: Buffer;
  let meta: Metadata;
  try {
    input = Buffer.from(await file.arrayBuffer());
    meta = await sharp(input).metadata();
    if (
      !meta.width ||
      !meta.height ||
      !["jpeg", "png", "webp", "heif", "avif"].includes(meta.format ?? "")
    )
      throw new Error();
  } catch {
    return {
      ok: false,
      message:
        "Arquivo não reconhecido. Envie fotos em JPG, PNG, WebP ou HEIC.",
    };
  }

  const photoId = randomUUID();
  const keys = {
    thumb: `vehicles/${vehicleId}/${photoId}-480.webp`,
    card: `vehicles/${vehicleId}/${photoId}-960.webp`,
    full: `vehicles/${vehicleId}/${photoId}-1920.webp`,
  };
  try {
    let fullInfo = { width: 0, height: 0 };
    for (const [size, width] of Object.entries(SIZES) as [
      keyof typeof SIZES,
      number,
    ][]) {
      const { data, info } = await sharp(input)
        .rotate() // apply EXIF orientation, then strip metadata (removes GPS location from phone photos)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: size === "thumb" ? 72 : 80 })
        .toBuffer({ resolveWithObject: true });
      await storage.put(keys[size], data, "image/webp");
      if (size === "full") fullInfo = info;
    }
    const position = vehicle.count;
    await sql`
      insert into vehicle_photos (id, vehicle_id, position, key_thumb, key_card, key_full, width, height, alt)
      values (${photoId}, ${vehicleId}, ${position}, ${keys.thumb}, ${keys.card}, ${keys.full},
        ${fullInfo.width}, ${fullInfo.height}, ${`${vehicle.brand} ${vehicle.model}, foto ${position + 1}`})`;
    revalidateCatalog();
    return {
      ok: true,
      photo: { id: photoId, thumb: storage.publicUrl(keys.thumb), position },
    };
  } catch (error) {
    console.error(
      "[photo] upload failed",
      error instanceof Error ? error.message : error,
    );
    await storage.remove(Object.values(keys)).catch(() => {});
    return {
      ok: false,
      message: "Não foi possível salvar a foto. Tente de novo.",
    };
  }
}

export async function reorderPhotos(
  vehicleId: string,
  ids: string[],
): Promise<void> {
  await requireStaff();
  const sql = requireSql();
  if (!isUuid(vehicleId) || !ids.every(isUuid)) return;
  await sql.begin(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx`update vehicle_photos set position = ${i} where id = ${id} and vehicle_id = ${vehicleId}`;
    }
  });
  revalidateCatalog();
}

export async function deletePhoto(
  vehicleId: string,
  photoId: string,
): Promise<void> {
  await requireStaff();
  const sql = requireSql();
  if (!isUuid(vehicleId) || !isUuid(photoId)) return;
  const [p] = await sql<
    { key_thumb: string; key_card: string; key_full: string }[]
  >`
    delete from vehicle_photos where id = ${photoId} and vehicle_id = ${vehicleId}
    returning key_thumb, key_card, key_full`;
  if (p)
    await storage.remove([p.key_thumb, p.key_card, p.key_full]).catch(() => {});
  // Close gaps in positions
  await sql`
    update vehicle_photos p set position = r.pos
    from (select id, row_number() over (order by position) - 1 as pos from vehicle_photos where vehicle_id = ${vehicleId}) r
    where p.id = r.id`;
  revalidateCatalog();
}
