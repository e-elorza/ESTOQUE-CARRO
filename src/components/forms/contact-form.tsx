"use client";

import { useState } from "react";
import {
  ContactFields,
  LeadForm,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
} from "./lead-form";

type Subject = "contato" | "proposta" | "visita";

const subjects: { value: Subject; label: string }[] = [
  { value: "contato", label: "Tirar dúvidas" },
  { value: "proposta", label: "Enviar proposta" },
  { value: "visita", label: "Agendar visita" },
];

type Props = {
  initialSubject: Subject;
  vehicleCode?: string;
  locations: { id: string; name: string }[];
  defaultLocation?: string;
  whatsappHref: string;
};

export function ContactForm({
  initialSubject,
  vehicleCode,
  locations,
  defaultLocation,
  whatsappHref,
}: Props) {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          Sobre o que você quer falar?
        </legend>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <label
              key={s.value}
              className="inline-flex h-11 cursor-pointer items-center rounded-ui border border-line-strong bg-surface px-4 text-[15px] has-[:checked]:border-fg has-[:checked]:shadow-[inset_0_0_0_1px_var(--fg)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text"
            >
              <input
                type="radio"
                name="assunto"
                value={s.value}
                checked={subject === s.value}
                onChange={() => setSubject(s.value)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <LeadForm
        key={subject}
        type={subject}
        hidden={vehicleCode ? { veiculo: vehicleCode } : {}}
        submitLabel={
          subject === "proposta"
            ? "Enviar proposta"
            : subject === "visita"
              ? "Agendar visita"
              : "Enviar mensagem"
        }
        success={{
          title:
            subject === "visita"
              ? "Pedido de visita enviado"
              : subject === "proposta"
                ? "Proposta enviada"
                : "Mensagem enviada",
          text:
            subject === "visita"
              ? "Um consultor vai confirmar o horário com você pelo WhatsApp."
              : "Um consultor vai responder pelo WhatsApp em horário comercial.",
          whatsapp: { href: whatsappHref, label: "Falar agora pelo WhatsApp" },
        }}
      >
        <ContactFields />
        {subject === "proposta" && (
          <TextField
            name="valorProposta"
            label="Valor da sua proposta"
            inputMode="numeric"
            mask="money"
            placeholder="Ex.: R$ 120.000"
          />
        )}
        {subject === "visita" && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="data"
                label="Data preferida"
                required
                type="date"
                min={today}
              />
              <SelectField
                name="unidade"
                label="Unidade"
                options={locations.map((l) => ({ value: l.id, label: l.name }))}
                defaultValue={defaultLocation}
                placeholder="Qualquer unidade"
              />
            </div>
            <RadioGroupField
              name="periodo"
              label="Período"
              required
              options={[
                { value: "manha", label: "Manhã" },
                { value: "tarde", label: "Tarde" },
              ]}
            />
          </>
        )}
        {!vehicleCode && subject !== "contato" && (
          <TextField
            name="veiculo"
            label="Carro de interesse"
            placeholder="Ex.: Compass 2022 ou código VA-0142"
          />
        )}
        <TextAreaField name="mensagem" label="Mensagem" required={false} />
      </LeadForm>
    </div>
  );
}
