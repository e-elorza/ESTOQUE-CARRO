"use client";

import { useActionState } from "react";
import {
  FormMessage,
  FormStateContext,
  TextField,
} from "@/components/forms/fields";
import { SubmitButton } from "@/components/admin/buttons";
import { idle } from "@/lib/form-state";
import { login } from "../_actions/auth";

export function LoginForm() {
  const [state, action] = useActionState(login, idle);
  return (
    <FormStateContext.Provider value={state}>
      <form action={action} className="flex flex-col gap-5">
        <FormMessage />
        <TextField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
        />
        <TextField
          name="senha"
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton size="lg" pendingLabel="Entrando…" className="w-full">
          Entrar
        </SubmitButton>
      </form>
    </FormStateContext.Provider>
  );
}
