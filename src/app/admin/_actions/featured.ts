"use server";

import { redirect } from "next/navigation";
import type { TransactionSql } from "postgres";
import { requireStaff } from "@/lib/auth/session";
import { requireSql } from "@/lib/db";
import {
  FEATURED_DEFAULT_DAYS,
  FEATURED_DURATIONS,
  FEATURED_SLOTS,
} from "@/lib/featured";
import { revalidateCatalog } from "./revalidate";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/.test(id);
const ACTIVE = `featured_position is not null and (featured_until is null or featured_until > now())`;

type Tx = TransactionSql;

/** Runs `fn` with the picks locked, so two people cannot overfill the slots at once. */
async function withPicks<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return requireSql().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('featured-picks'))`;
    return fn(tx);
  }) as Promise<T>;
}

/** Renumbers the active picks 1..n, keeping their order. */
async function renumber(tx: Tx) {
  await tx.unsafe(`
    update vehicles v set featured_position = r.pos
    from (select id, row_number() over (order by featured_position, created_at desc) as pos
          from vehicles where ${ACTIVE}) r
    where v.id = r.id`);
}

async function activeCount(tx: Tx): Promise<number> {
  const [{ n }] = await tx.unsafe<{ n: number }[]>(
    `select count(*)::int as n from vehicles where ${ACTIVE}`,
  );
  return n;
}

/** Back to the destaques page, or to the vehicle page when the form came from there. */
function done(formData: FormData, id: string, code: string): never {
  const base =
    formData.get("from") === "veiculo"
      ? `/admin/veiculos/${id}`
      : "/admin/destaques";
  redirect(`${base}?destaque=${code}`);
}

export async function addFeatured(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const days = Number(formData.get("dias") ?? FEATURED_DEFAULT_DAYS);
  if (!isUuid(id)) done(formData, id, "escolha");
  if (!(FEATURED_DURATIONS as readonly number[]).includes(days))
    done(formData, id, "erro");

  const result = await withPicks(async (tx) => {
    const [v] = await tx.unsafe<{ status: string; active: boolean }[]>(
      `select status, (${ACTIVE}) as active from vehicles where id = $1`,
      [id],
    );
    if (!v) return "erro";
    if (v.status !== "disponivel") return "indisponivel";
    if (v.active) return "ja";
    if ((await activeCount(tx)) >= FEATURED_SLOTS) return "cheio";
    await tx`
      update vehicles set featured = true,
        featured_position = ${FEATURED_SLOTS * 100},
        featured_until = now() + make_interval(days => ${days})
      where id = ${id}`;
    await renumber(tx);
    return "adicionado";
  });
  if (result === "adicionado") revalidateCatalog();
  done(formData, id, result);
}

export async function renewFeatured(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) done(formData, id, "erro");

  const result = await withPicks(async (tx) => {
    const [v] = await tx.unsafe<
      { active: boolean; picked: boolean; status: string }[]
    >(
      `select (${ACTIVE}) as active, featured_position is not null as picked, status from vehicles where id = $1`,
      [id],
    );
    if (!v?.picked) return "erro";
    if (v.active) {
      // Extend from the current end date; a pick without an end date stays that way.
      await tx`
        update vehicles set featured_until = featured_until + make_interval(days => ${FEATURED_DEFAULT_DAYS})
        where id = ${id} and featured_until is not null`;
    } else {
      if (v.status !== "disponivel") return "indisponivel";
      if ((await activeCount(tx)) >= FEATURED_SLOTS) return "cheio";
      await tx`
        update vehicles set featured = true,
          featured_position = ${FEATURED_SLOTS * 100},
          featured_until = now() + make_interval(days => ${FEATURED_DEFAULT_DAYS})
        where id = ${id}`;
      await renumber(tx);
    }
    return "renovado";
  });
  if (result === "renovado") revalidateCatalog();
  done(formData, id, result);
}

export async function removeFeatured(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) done(formData, id, "erro");
  await withPicks(async (tx) => {
    await tx`
      update vehicles set featured = false, featured_position = null, featured_until = null
      where id = ${id}`;
    await renumber(tx);
  });
  revalidateCatalog();
  done(formData, id, "removido");
}

export async function moveFeatured(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const step = formData.get("direcao") === "subir" ? -1 : 1;
  if (!isUuid(id)) done(formData, id, "erro");
  await withPicks(async (tx) => {
    const ids = (
      await tx.unsafe<{ id: string }[]>(
        `select id from vehicles where ${ACTIVE} order by featured_position, created_at desc`,
      )
    ).map((r) => r.id);
    const i = ids.indexOf(id);
    const j = i + step;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    for (const [pos, vid] of ids.entries()) {
      await tx`update vehicles set featured_position = ${pos + 1} where id = ${vid}`;
    }
  });
  revalidateCatalog();
  redirect("/admin/destaques");
}
