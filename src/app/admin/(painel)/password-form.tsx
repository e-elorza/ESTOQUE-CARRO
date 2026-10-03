"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import {
  FormMessage,
  FormStateContext,
  TextField,
} from "@/components/forms/fields";
import { idle } from "@/lib/form-state";
import { changePassword } from "../_actions/auth";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, idle);
  return (
    <FormStateContext.Provider value={state}>
      <form action={action} className="flex max-w-md flex-col gap-5">
        <FormMessage />
        <TextField
          name="atual"
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          required
        />
        <TextField
          name="nova"
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          hint="Pelo menos 10 caracteres."
        />
        <TextField
          name="confirmacao"
          label="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          required
        />
        <SubmitButton className="self-start">Alterar senha</SubmitButton>
      </form>
    </FormStateContext.Provider>
  );
}
