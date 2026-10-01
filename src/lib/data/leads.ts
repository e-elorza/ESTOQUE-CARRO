import type { LeadType } from "../leads";

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

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

/**
 * Stores a lead. In demo mode (no database) it only logs.
 * The Supabase version will insert into `leads` and keep rate-limit counters in Postgres.
 */
export async function saveLead(
  lead: NewLead,
): Promise<{ ok: true } | { ok: false; reason: "rate_limited" | "failed" }> {
  const key = lead.ip ?? lead.phone;
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW)
    return { ok: false, reason: "rate_limited" };
  recent.set(key, [...hits, now]);

  // Personal data is not logged; only what is needed to confirm the flow works.
  console.info("[lead:demo]", lead.type, lead.vehicleCode ?? "-");
  return { ok: true };
}
