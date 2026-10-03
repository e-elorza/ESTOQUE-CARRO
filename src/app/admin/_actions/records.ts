"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, temporaryPassword } from "@/lib/auth/password";
import { destroyAllSessions, requireStaff } from "@/lib/auth/session";
import { requireSql } from "@/lib/db";
import { formValues, zodErrorState, type FormState } from "@/lib/form-state";
import { slugify } from "@/lib/format";
import { contrastRatio } from "@/lib/theme";
import { revalidateCatalog } from "./revalidate";

const isUuid = (id: string) => /^[0-9a-f-]{36}$/.test(id);

// Leads -------------------------------------------------------------------------

const leadUpdate = z.object({
  status: z.enum(["novo", "em_contato", "negociacao", "fechado", "perdido"]),
  notes: z.string().max(5000, "Anotações muito longas.").default(""),
});

export async function updateLead(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  const id = String(formData.get("id"));
  const values = formValues(formData);
  const parsed = leadUpdate.safeParse(values);
  if (!isUuid(id) || !parsed.success)
    return {
      status: "error",
      message: "Não foi possível salvar.",
      fieldErrors: {},
      values,
    };
  await requireSql()`update leads set status = ${parsed.data.status}, notes = ${parsed.data.notes} where id = ${id}`;
  revalidatePath("/admin", "layout");
  return { status: "success", message: "Atendimento atualizado." };
}

/** Permanently deletes a lead, e.g. when the customer asks for their data to be removed (LGPD). */
export async function deleteLead(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id"));
  if (isUuid(id)) await requireSql()`delete from leads where id = ${id}`;
  redirect("/admin/leads?excluido=1");
}

// Locations ----------------------------------------------------------------------

const phoneDigits = z
  .string()
  .optional()
  .transform((v) => (v ?? "").replace(/\D/g, ""))
  .refine(
    (v) => v === "" || v.length === 10 || v.length === 11,
    "Telefone com DDD, por exemplo (11) 3000-0000.",
  )
  .transform((v) => (v ? `55${v}` : null));

const locationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da unidade."),
  street: z.string().trim().min(3, "Informe o endereço."),
  district: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a sigla do estado, por exemplo SP."),
  cep: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP com 8 dígitos.")
    .transform(
      (v) => `${v.replace("-", "").slice(0, 5)}-${v.replace("-", "").slice(5)}`,
    ),
  phone: phoneDigits,
  mapsUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => !v || /^https:\/\//.test(v),
      "Use um link começando com https://",
    ),
  hours: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split("\n")
        .map((line) => line.split("|").map((s) => s.trim()))
        .filter(([days, hours]) => days && hours)
        .map(([days, hours]) => ({ days, hours })),
    ),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveLocation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  const sql = requireSql();
  const values = formValues(formData);
  const parsed = locationSchema.safeParse(values);
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const d = parsed.data;
  const cols = {
    name: d.name,
    street: d.street,
    district: d.district,
    city: d.city,
    state: d.state,
    cep: d.cep,
    phone: d.phone,
    maps_url: d.mapsUrl,
    hours: sql.json(d.hours),
    sort_order: d.sortOrder,
  };
  const id = String(formData.get("id") ?? "");
  if (id) {
    await sql`update locations set ${sql(cols)} where id = ${id}`;
  } else {
    let newId = slugify(d.name) || "unidade";
    const [exists] = await sql`select 1 from locations where id = ${newId}`;
    if (exists) newId = `${newId}-${Date.now().toString(36)}`;
    await sql`insert into locations ${sql({ id: newId, ...cols })}`;
  }
  revalidateCatalog();
  redirect("/admin/unidades?salvo=1");
}

export async function deleteLocation(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id"));
  await requireSql()`delete from locations where id = ${id}`;
  revalidateCatalog();
  redirect("/admin/unidades?excluido=1");
}

// Settings ------------------------------------------------------------------------

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja."),
  codePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,4}$/, "Use de 1 a 4 letras, por exemplo VA."),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => !v || /^(https:\/\/|\/)/.test(v),
      "Use um link começando com https://",
    ),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #1F3FBF."),
  theme: z.enum(["light", "dark"]),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(
      (v) => v.length === 10 || v.length === 11,
      "WhatsApp com DDD, por exemplo (11) 98765-4321.",
    )
    .transform((v) => `55${v}`),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone com DDD.")
    .transform((v) => `55${v}`),
  email: z.email("Informe um e-mail válido."),
  instagram: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => !v || /^https:\/\//.test(v),
      "Use o link completo, começando com https://",
    ),
  facebook: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine(
      (v) => !v || /^https:\/\//.test(v),
      "Use o link completo, começando com https://",
    ),
  siteUrl: z
    .string()
    .trim()
    .regex(
      /^https?:\/\/[^/\s]+$/,
      "Use o endereço do site sem barra no final, por exemplo https://www.loja.com.br.",
    ),
  seoTitle: z
    .string()
    .trim()
    .min(10, "Título muito curto.")
    .max(70, "Use até 70 caracteres."),
  seoDescription: z
    .string()
    .trim()
    .min(50, "Use pelo menos 50 caracteres.")
    .max(170, "Use até 170 caracteres."),
  about: z.string().trim().max(800, "Use até 800 caracteres.").default(""),
  yearFounded: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce
      .number()
      .int()
      .min(1900, "Ano inválido.")
      .max(new Date().getFullYear(), "Ano inválido.")
      .optional(),
  ),
});

export async function saveSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireStaff();
  const sql = requireSql();
  const values = formValues(formData);
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const d = parsed.data;

  const reasons = [0, 1, 2, 3, 4, 5]
    .map((i) => ({
      title: String(formData.get(`reasonTitle${i}`) ?? "").trim(),
      text: String(formData.get(`reasonText${i}`) ?? "").trim(),
    }))
    .filter((r) => r.title);

  const cols = {
    name: d.name,
    code_prefix: d.codePrefix,
    logo_url: d.logoUrl,
    accent_color: d.accentColor.toLowerCase(),
    theme: d.theme,
    whatsapp: d.whatsapp,
    phone: d.phone,
    email: d.email,
    instagram: d.instagram,
    facebook: d.facebook,
    site_url: d.siteUrl,
    seo_title: d.seoTitle,
    seo_description: d.seoDescription,
    about: d.about,
    year_founded: d.yearFounded ?? null,
    reasons: sql.json(reasons),
  };
  await sql`
    insert into dealership_settings ${sql({ id: true, ...cols })}
    on conflict (id) do update set ${sql(cols)}`;
  revalidateCatalog();

  const lowContrast =
    Math.max(
      contrastRatio(d.accentColor, "#ffffff"),
      contrastRatio(d.accentColor, "#111316"),
    ) < 4.5;
  return {
    status: "success",
    message: lowContrast
      ? "Configurações salvas. Atenção: a cor de destaque tem pouco contraste com o texto dos botões; escolha um tom mais escuro ou mais claro."
      : "Configurações salvas. O site já foi atualizado.",
  };
}

// Staff --------------------------------------------------------------------------

const staffSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  email: z.email("Informe um e-mail válido.").transform((v) => v.toLowerCase()),
});

export type StaffResult = FormState & { tempPassword?: string };

export async function createStaff(
  _prev: StaffResult,
  formData: FormData,
): Promise<StaffResult> {
  await requireStaff();
  const sql = requireSql();
  const values = formValues(formData);
  const parsed = staffSchema.safeParse(values);
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const [exists] =
    await sql`select 1 from staff where email = ${parsed.data.email}`;
  if (exists)
    return {
      status: "error",
      message: "Já existe um acesso com este e-mail.",
      fieldErrors: { email: "E-mail já cadastrado." },
      values,
    };
  const password = temporaryPassword();
  await sql`
    insert into staff (email, name, password_hash, must_change_password)
    values (${parsed.data.email}, ${parsed.data.name}, ${await hashPassword(password)}, true)`;
  revalidatePath("/admin/equipe");
  return {
    status: "success",
    message: `Acesso criado para ${parsed.data.email}.`,
    tempPassword: password,
  };
}

export async function resetStaffPassword(
  _prev: StaffResult,
  formData: FormData,
): Promise<StaffResult> {
  const me = await requireStaff();
  const id = String(formData.get("id"));
  if (!isUuid(id) || id === me.id)
    return {
      status: "error",
      message: "Para trocar sua própria senha, use Minha conta.",
      fieldErrors: {},
      values: {},
    };
  const password = temporaryPassword();
  const sql = requireSql();
  const [row] = await sql<{ email: string }[]>`
    update staff set password_hash = ${await hashPassword(password)}, must_change_password = true where id = ${id} returning email`;
  if (!row)
    return {
      status: "error",
      message: "Acesso não encontrado.",
      fieldErrors: {},
      values: {},
    };
  await destroyAllSessions(id);
  return {
    status: "success",
    message: `Nova senha temporária para ${row.email}.`,
    tempPassword: password,
  };
}

export async function deleteStaff(formData: FormData): Promise<void> {
  const me = await requireStaff();
  const id = String(formData.get("id"));
  if (!isUuid(id) || id === me.id) return;
  await requireSql()`delete from staff where id = ${id}`;
  revalidatePath("/admin/equipe");
}
