import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "sessao";
const SESSION_DAYS = 7;

export type Staff = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
};

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(staffId: string): Promise<void> {
  if (!sql) throw new Error("Banco de dados não configurado.");
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql`insert into sessions (token_hash, staff_id, expires_at) values (${hash(token)}, ${staffId}, ${expires})`;
  // Opportunistic cleanup of expired sessions
  await sql`delete from sessions where expires_at < now()`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && sql)
    await sql`delete from sessions where token_hash = ${hash(token)}`;
  store.delete(SESSION_COOKIE);
}

/** End every session of a staff member (password reset, account removal). */
export async function destroyAllSessions(
  staffId: string,
  exceptCurrent = false,
): Promise<void> {
  if (!sql) return;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (exceptCurrent && token) {
    await sql`delete from sessions where staff_id = ${staffId} and token_hash <> ${hash(token)}`;
  } else {
    await sql`delete from sessions where staff_id = ${staffId}`;
  }
}

export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  if (!sql) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await sql<
    { id: string; email: string; name: string; must_change_password: boolean }[]
  >`
    select s.id, s.email, s.name, s.must_change_password
    from sessions x join staff s on s.id = x.staff_id
    where x.token_hash = ${hash(token)} and x.expires_at > now()`;
  return row
    ? {
        id: row.id,
        email: row.email,
        name: row.name,
        mustChangePassword: row.must_change_password,
      }
    : null;
});

/** Use at the top of every admin page and admin server action. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}
