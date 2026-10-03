"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import {
  FormMessage,
  FormStateContext,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { formatPhone } from "@/lib/format";
import { idle } from "@/lib/form-state";
import type { Location } from "@/lib/types";
import { saveLocation } from "../../../_actions/records";

export function LocationForm({ location }: { location?: Location }) {
  const [state, action] = useActionState(saveLocation, idle);
  return (
    <FormStateContext.Provider value={state}>
      <form
        action={action}
        noValidate
        className="flex max-w-3xl flex-col gap-5 rounded-ui border border-line bg-surface p-5 md:p-6"
      >
        {location && <input type="hidden" name="id" value={location.id} />}
        <FormMessage />
        <TextField
          name="name"
          label="Nome da unidade"
          required
          defaultValue={location?.name}
          placeholder="Ex.: Pinheiros"
        />
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <TextField
            name="street"
            label="Endereço"
            required
            defaultValue={location?.street}
            placeholder="Ex.: Av. Rebouças, 1500"
          />
          <TextField
            name="district"
            label="Bairro"
            required
            defaultValue={location?.district}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
          <TextField
            name="city"
            label="Cidade"
            required
            defaultValue={location?.city}
          />
          <TextField
            name="state"
            label="UF"
            required
            defaultValue={location?.state}
            placeholder="SP"
          />
          <TextField
            name="cep"
            label="CEP"
            required
            inputMode="numeric"
            defaultValue={location?.cep}
            placeholder="00000-000"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="phone"
            label="Telefone"
            hideOptional
            type="tel"
            mask="phone"
            defaultValue={
              location?.phone ? formatPhone(location.phone) : undefined
            }
          />
          <TextField
            name="mapsUrl"
            label="Link do Google Maps"
            hideOptional
            defaultValue={location?.mapsUrl ?? undefined}
            placeholder="https://maps.google.com/..."
          />
        </div>
        <TextAreaField
          name="hours"
          label="Horários"
          hideOptional
          rows={3}
          defaultValue={location?.hours
            .map((h) => `${h.days} | ${h.hours}`)
            .join("\n")}
          hint="Uma linha por período, com | separando dias e horário. Ex.: Segunda a sexta | 9h às 19h"
        />
        <TextField
          name="sortOrder"
          label="Ordem de exibição"
          hideOptional
          inputMode="numeric"
          defaultValue={String(location?.sortOrder ?? 0)}
        />
        <SubmitButton className="self-start">
          {location ? "Salvar unidade" : "Cadastrar unidade"}
        </SubmitButton>
      </form>
    </FormStateContext.Provider>
  );
}
