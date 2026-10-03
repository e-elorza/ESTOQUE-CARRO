"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import {
  FormMessage,
  FormStateContext,
  SelectField,
  TextAreaField,
} from "@/components/forms/fields";
import { leadStatusLabel, type LeadStatus } from "@/lib/data/admin-labels";
import { idle } from "@/lib/form-state";
import { updateLead } from "../../../_actions/records";

export function LeadStatusForm({
  id,
  status,
  notes,
}: {
  id: string;
  status: LeadStatus;
  notes: string;
}) {
  const [state, action] = useActionState(updateLead, idle);
  return (
    <FormStateContext.Provider value={state}>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <FormMessage />
        <SelectField
          name="status"
          label="Situação do atendimento"
          required
          placeholder={null}
          defaultValue={status}
          options={Object.entries(leadStatusLabel).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <TextAreaField
          name="notes"
          label="Anotações internas"
          hideOptional
          rows={5}
          defaultValue={notes}
          hint="Só a equipe vê. Ex.: ligou dia 12, quer simular com entrada de 40 mil."
        />
        <SubmitButton className="self-start">Salvar</SubmitButton>
      </form>
    </FormStateContext.Provider>
  );
}
