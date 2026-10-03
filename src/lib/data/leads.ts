import { sql } from "../db";
import type { LeadType } from "../leads";
import { allow } from "../rate-limit";

export type NewLead = {
  type: LeadType;
  name: string;
  phone: string;
  email: string | null;
  vehicleCode: string | null;
  details: Record<string, unknown>;
  consentVersion: string;
  sourceUrl: string | null;
  ip: string | null;
};

/** Stores a lead. Without a database (demo mode) it only logs the type and vehicle code. */
export async function saveLead(
  lead: NewLead,
): Promise<{ ok: true } | { ok: false; reason: "rate_limited" | "failed" }> {
  if (!(await allow("lead", lead.ip ?? lead.phone, 5, 10 * 60_000)))
    return { ok: false, reason: "rate_limited" };

  if (!sql) {
    // Personal data is not logged; only what is needed to confirm the flow works.
    console.info("[lead:demo]", lead.type, lead.vehicleCode ?? "-");
    return { ok: true };
  }

  try {
    const details = JSON.parse(JSON.stringify(lead.details));
    await sql`
      insert into leads (type, name, phone, email, vehicle_id, vehicle_code, details, consent_version, source_url)
      values (
        ${lead.type}, ${lead.name}, ${lead.phone}, ${lead.email},
        (select id from vehicles where code = ${lead.vehicleCode}),
        ${lead.vehicleCode}, ${sql.json(details)}, ${lead.consentVersion}, ${lead.sourceUrl}
      )`;
    return { ok: true };
  } catch (error) {
    console.error(
      "[lead] insert failed",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, reason: "failed" };
  }
}

/** Anonymous WhatsApp click counter. */
export async function recordWhatsappClick(
  vehicleId: string | null,
): Promise<void> {
  if (!sql) return;
  if (vehicleId && !/^[0-9a-f-]{36}$/.test(vehicleId)) return;
  await sql`insert into whatsapp_clicks (vehicle_id) values (${vehicleId})`;
}
