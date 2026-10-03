"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  hashPassword,
  passwordProblem,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  requireStaff,
} from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { formValues, type FormState } from "@/lib/form-state";
import { allow } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3, "Informe seu e-mail."),
  senha: z.string().min(1, "Informe sua senha."),
});

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  delete values.senha;
  if (!sql) {
    return {
      status: "error",
      message:
        "O banco de dados ainda não foi configurado. Veja docs/DEPLOY.md.",
      fieldErrors: {},
      values,
    };
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Preencha e-mail e senha.",
      fieldErrors: {},
      values,
    };
  }
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const allowed =
    (await allow("login-ip", ip, 20, 15 * 60_000)) &&
    (await allow("login-email", parsed.data.email, 8, 15 * 60_000));
  if (!allowed) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde 15 minutos e tente de novo.",
      fieldErrors: {},
      values,
    };
  }

  const [staff] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from staff where email = ${parsed.data.email}`;
  // Same message for unknown e-mail and wrong password
  if (
    !staff ||
    !(await verifyPassword(parsed.data.senha, staff.password_hash))
  ) {
    return {
      status: "error",
      message: "E-mail ou senha incorretos.",
      fieldErrors: {},
      values,
    };
  }
  await createSession(staff.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

const changeSchema = z
  .object({
    atual: z.string().min(1, "Informe a senha atual."),
    nova: z.string(),
    confirmacao: z.string(),
  })
  .superRefine((d, ctx) => {
    const problem = passwordProblem(d.nova);
    if (problem)
      ctx.addIssue({ code: "custom", path: ["nova"], message: problem });
    if (d.nova !== d.confirmacao)
      ctx.addIssue({
        code: "custom",
        path: ["confirmacao"],
        message: "As senhas não conferem.",
      });
  });

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireStaff();
  const parsed = changeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      fieldErrors[String(i.path[0])] ??= i.message;
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors,
      values: {},
    };
  }
  const db = sql!;
  const [row] = await db<
    { password_hash: string }[]
  >`select password_hash from staff where id = ${me.id}`;
  if (!(await verifyPassword(parsed.data.atual, row.password_hash))) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: { atual: "Senha atual incorreta." },
      values: {},
    };
  }
  await db`update staff set password_hash = ${await hashPassword(parsed.data.nova)}, must_change_password = false where id = ${me.id}`;
  await destroyAllSessions(me.id, true);
  return {
    status: "success",
    message:
      "Senha alterada. Outros dispositivos conectados foram desconectados.",
  };
}
