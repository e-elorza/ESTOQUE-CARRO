"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import {
  FormMessage,
  FormStateContext,
  TextField,
} from "@/components/forms/fields";
import { buttonClass } from "@/components/ui/button";
import {
  createStaff,
  resetStaffPassword,
  type StaffResult,
} from "../../_actions/records";

function TempPassword({ state }: { state: StaffResult }) {
  if (state.status !== "success" || !state.tempPassword) return null;
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-ui bg-[color-mix(in_oklab,var(--success)_12%,transparent)] p-4 text-[15px]"
    >
      <p>{state.message}</p>
      <p>
        Senha temporária:{" "}
        <code className="rounded-ui bg-surface px-2 py-1 font-mono text-base select-all">
          {state.tempPassword}
        </code>
      </p>
      <p className="text-sm text-muted">
        Envie para a pessoa por um canal seguro. Ela vai criar uma senha própria
        no primeiro acesso. Esta senha não aparece de novo.
      </p>
    </div>
  );
}

export function NewStaffForm() {
  const [state, action] = useActionState(createStaff, {
    status: "idle",
  } as StaffResult);
  return (
    <FormStateContext.Provider value={state}>
      <form action={action} noValidate className="flex flex-col gap-4">
        {state.status === "success" ? (
          <TempPassword state={state} />
        ) : (
          <FormMessage />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" label="Nome" required />
          <TextField name="email" label="E-mail" type="email" required />
        </div>
        <SubmitButton className="self-start">Criar acesso</SubmitButton>
      </form>
    </FormStateContext.Provider>
  );
}

export function ResetPasswordForm({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState(resetStaffPassword, {
    status: "idle",
  } as StaffResult);
  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className={buttonClass("ghost", "sm")}
          aria-label={`Gerar nova senha para ${name}`}
        >
          Gerar nova senha
        </button>
      </form>
      <TempPassword state={state} />
      {state.status === "error" && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
    </div>
  );
}
