import { createHash } from "node:crypto";
import { sql } from "@/lib/db";

const memory = new Map<string, number[]>();

/**
 * Sliding-window limiter. Returns true when the action is allowed.
 * Uses Postgres when available (shared across server instances), memory otherwise.
 * Keys are hashed so no raw IP or phone number is stored.
 */
export async function allow(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const keyHash = createHash("sha256").update(`${bucket}:${key}`).digest("hex");
  const since = new Date(Date.now() - windowMs);

  if (sql) {
    const [{ count }] = await sql<{ count: number }[]>`
      select count(*)::int as count from rate_limits
      where bucket = ${bucket} and key_hash = ${keyHash} and created_at > ${since}`;
    if (count >= limit) return false;
    await sql`insert into rate_limits (bucket, key_hash) values (${bucket}, ${keyHash})`;
    if (Math.random() < 0.02)
      await sql`delete from rate_limits where created_at < now() - interval '1 day'`;
    return true;
  }

  const now = Date.now();
  const hits = (memory.get(keyHash) ?? []).filter((t) => t > since.getTime());
  if (hits.length >= limit) return false;
  memory.set(keyHash, [...hits, now]);
  return true;
}
