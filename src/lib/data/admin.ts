/** Read queries for the admin. Every caller must have passed requireStaff(). */
import { requireSql } from "../db";
import type { LeadType } from "../leads";
import type { Location, Vehicle, VehicleStatus } from "../types";
import {
  toLocation,
  toSettings,
  toVehicle,
  VEHICLE_SELECT,
  type LocationRow,
  type SettingsRow,
  type VehicleRow,
} from "./rows";
import { seedSettings } from "./seed";

export {
  leadStatusLabel,
  vehicleStatusLabel,
  type LeadStatus,
} from "./admin-labels";
import { leadStatusLabel, type LeadStatus } from "./admin-labels";

export type Lead = {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string | null;
  vehicleId: string | null;
  vehicleCode: string | null;
  vehicleLabel: string | null;
  vehicleSlug: string | null;
  details: Record<string, unknown>;
  consentAt: string;
  consentVersion: string;
  sourceUrl: string | null;
  notes: string;
  createdAt: string;
};

type LeadRow = {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string | null;
  vehicle_id: string | null;
  vehicle_code: string | null;
  vehicle_label: string | null;
  vehicle_slug: string | null;
  details: Record<string, unknown>;
  consent_at: Date;
  consent_version: string;
  source_url: string | null;
  notes: string;
  created_at: Date;
};

const toLead = (r: LeadRow): Lead => ({
  id: r.id,
  type: r.type,
  status: r.status,
  name: r.name,
  phone: r.phone,
  email: r.email,
  vehicleId: r.vehicle_id,
  vehicleCode: r.vehicle_code,
  vehicleLabel: r.vehicle_label,
  vehicleSlug: r.vehicle_slug,
  details: r.details,
  consentAt: r.consent_at.toISOString(),
  consentVersion: r.consent_version,
  sourceUrl: r.source_url,
  notes: r.notes,
  createdAt: r.created_at.toISOString(),
});

const LEAD_SELECT = `
  select l.*, v.brand || ' ' || v.model || ' ' || v.version as vehicle_label, v.slug as vehicle_slug
  from leads l left join vehicles v on v.id = l.vehicle_id`;

export async function getDashboard() {
  const sql = requireSql();
  const [vehicles, leads, recentLeads, clicks, noPhotos] = await Promise.all([
    sql<
      { status: VehicleStatus; count: number }[]
    >`select status, count(*)::int as count from vehicles group by status`,
    sql<
      { status: LeadStatus; count: number }[]
    >`select status, count(*)::int as count from leads group by status`,
    sql.unsafe<LeadRow[]>(`${LEAD_SELECT} order by l.created_at desc limit 6`),
    sql<{ id: string; label: string; slug: string; count: number }[]>`
      select v.id, v.brand || ' ' || v.model as label, v.slug, count(*)::int as count
      from whatsapp_clicks c join vehicles v on v.id = c.vehicle_id
      where c.created_at > now() - interval '30 days'
      group by v.id order by count desc limit 5`,
    sql<{ count: number }[]>`
      select count(*)::int as count from vehicles v
      where v.status in ('disponivel', 'reservado') and not exists (select 1 from vehicle_photos p where p.vehicle_id = v.id)`,
  ]);
  const soldLast30 = await sql<{ count: number }[]>`
    select count(*)::int as count from vehicles where status = 'vendido' and sold_at > now() - interval '30 days'`;
  const byStatus = Object.fromEntries(
    vehicles.map((r) => [r.status, r.count]),
  ) as Partial<Record<VehicleStatus, number>>;
  const leadsByStatus = Object.fromEntries(
    leads.map((r) => [r.status, r.count]),
  ) as Partial<Record<LeadStatus, number>>;
  const [totalClicks] = await sql<{ count: number }[]>`
    select count(*)::int as count from whatsapp_clicks where created_at > now() - interval '30 days'`;
  return {
    available: byStatus.disponivel ?? 0,
    reserved: byStatus.reservado ?? 0,
    drafts: byStatus.rascunho ?? 0,
    soldLast30: soldLast30[0].count,
    newLeads: leadsByStatus.novo ?? 0,
    openLeads:
      (leadsByStatus.novo ?? 0) +
      (leadsByStatus.em_contato ?? 0) +
      (leadsByStatus.negociacao ?? 0),
    recentLeads: recentLeads.map(toLead),
    topClicks: clicks,
    clicksLast30: totalClicks.count,
    withoutPhotos: noPhotos[0].count,
  };
}

export async function countNewLeads(): Promise<number> {
  const [r] = await requireSql()<
    { count: number }[]
  >`select count(*)::int as count from leads where status = 'novo'`;
  return r.count;
}

export type AdminVehicle = Vehicle & { updatedAt: string };

export async function listVehiclesAdmin({
  q,
  status,
}: {
  q?: string;
  status?: string;
}): Promise<AdminVehicle[]> {
  const sql = requireSql();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (
    status &&
    ["disponivel", "reservado", "vendido", "rascunho"].includes(status)
  ) {
    params.push(status);
    where.push(`v.status = $${params.length}`);
  }
  if (q?.trim()) {
    params.push(`%${q.trim()}%`);
    where.push(
      `(v.brand || ' ' || v.model || ' ' || v.version || ' ' || v.code) ilike $${params.length}`,
    );
  }
  const rows = await sql.unsafe<VehicleRow[]>(
    `${VEHICLE_SELECT} ${where.length ? `where ${where.join(" and ")}` : ""} order by v.updated_at desc limit 500`,
    params,
  );
  return rows.map(toVehicle);
}

export async function vehicleStatusCounts(): Promise<Record<string, number>> {
  const rows = await requireSql()<
    { status: string; count: number }[]
  >`select status, count(*)::int as count from vehicles group by status`;
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export async function getVehicleAdmin(
  id: string,
): Promise<AdminVehicle | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await requireSql().unsafe<VehicleRow[]>(
    `${VEHICLE_SELECT} where v.id = $1`,
    [id],
  );
  return row ? toVehicle(row) : null;
}

export async function listLeads({
  status,
  type,
}: {
  status?: string;
  type?: string;
}): Promise<Lead[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (status && status in leadStatusLabel) {
    params.push(status);
    where.push(`l.status = $${params.length}`);
  }
  if (
    type &&
    ["financiamento", "troca", "proposta", "visita", "contato"].includes(type)
  ) {
    params.push(type);
    where.push(`l.type = $${params.length}`);
  }
  const rows = await requireSql().unsafe<LeadRow[]>(
    `${LEAD_SELECT} ${where.length ? `where ${where.join(" and ")}` : ""} order by l.created_at desc limit 500`,
    params,
  );
  return rows.map(toLead);
}

export async function leadStatusCounts(): Promise<Record<string, number>> {
  const rows = await requireSql()<
    { status: string; count: number }[]
  >`select status, count(*)::int as count from leads group by status`;
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await requireSql().unsafe<LeadRow[]>(
    `${LEAD_SELECT} where l.id = $1`,
    [id],
  );
  return row ? toLead(row) : null;
}

export async function listLocationsAdmin(): Promise<
  (Location & { vehicleCount: number })[]
> {
  const rows = await requireSql()<(LocationRow & { vehicle_count: number })[]>`
    select l.*, (select count(*)::int from vehicles v where v.location_id = l.id and v.status in ('disponivel','reservado')) as vehicle_count
    from locations l order by sort_order, name`;
  return rows.map((r) => ({ ...toLocation(r), vehicleCount: r.vehicle_count }));
}

export async function getLocationAdmin(id: string): Promise<Location | null> {
  const [row] = await requireSql()<
    LocationRow[]
  >`select * from locations where id = ${id}`;
  return row ? toLocation(row) : null;
}

export async function getSettingsAdmin() {
  const [row] = await requireSql()<
    SettingsRow[]
  >`select * from dealership_settings limit 1`;
  return row ? toSettings(row) : seedSettings;
}

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  createdAt: string;
};

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await requireSql()<
    {
      id: string;
      email: string;
      name: string;
      must_change_password: boolean;
      created_at: Date;
    }[]
  >`
    select id, email, name, must_change_password, created_at from staff order by name`;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    mustChangePassword: r.must_change_password,
    createdAt: r.created_at.toISOString(),
  }));
}
