"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import { useUnsavedChanges } from "@/components/admin/use-unsaved-changes";
import {
  FormMessage,
  FormStateContext,
  RadioGroupField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { inputClass } from "@/components/ui/field";
import { formatPhone } from "@/lib/format";
import { idle } from "@/lib/form-state";
import { contrastRatio, onAccent } from "@/lib/theme";
import type { DealershipSettings } from "@/lib/types";
import { saveSettings } from "../../_actions/records";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-ui border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsForm({ settings }: { settings: DealershipSettings }) {
  const formRef = useUnsavedChanges<HTMLFormElement>();
  const [state, action] = useActionState(saveSettings, idle);
  const [accent, setAccent] = useState(settings.accentColor);
  const validHex = /^#[0-9a-fA-F]{6}$/.test(accent);
  const ratio = validHex ? contrastRatio(accent, onAccent(accent)) : 0;
  const reasons = [
    ...settings.reasons,
    ...Array(6).fill({ title: "", text: "" }),
  ].slice(0, 6);

  return (
    <FormStateContext.Provider value={state}>
      <form
        ref={formRef}
        action={action}
        noValidate
        className="flex flex-col gap-6"
      >
        <FormMessage />

        <Section title="Identidade">
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <TextField
              name="name"
              label="Nome da loja"
              required
              defaultValue={settings.name}
            />
            <TextField
              name="codePrefix"
              label="Prefixo dos códigos"
              required
              defaultValue={settings.codePrefix}
              hint="Ex.: VA gera VA-1001."
            />
          </div>
          <TextField
            name="logoUrl"
            label="Endereço do logotipo"
            hideOptional
            defaultValue={settings.logoUrl ?? undefined}
            hint="Link de uma imagem SVG ou PNG. Sem logotipo, o nome da loja aparece em texto."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="accent-picker" className="text-sm font-medium">
                Cor de destaque
              </label>
              <div className="flex gap-2">
                <input
                  id="accent-picker"
                  type="color"
                  value={validHex ? accent : "#1f3fbf"}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-12 w-14 shrink-0 cursor-pointer rounded-ui border border-line-strong bg-surface p-1"
                  aria-label="Escolher cor"
                />
                <input
                  name="accentColor"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className={`${inputClass} h-12 font-mono`}
                  aria-label="Código da cor"
                />
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 items-center rounded-ui px-4 text-sm font-medium"
                  style={{
                    background: validHex ? accent : undefined,
                    color: validHex ? onAccent(accent) : undefined,
                  }}
                >
                  Falar no WhatsApp
                </span>
                <span
                  className={`text-sm ${ratio >= 4.5 ? "text-muted" : "text-danger"}`}
                  aria-live="polite"
                >
                  {!validHex
                    ? "Use o formato #1F3FBF."
                    : ratio >= 4.5
                      ? "Boa leitura nos botões."
                      : "Pouco contraste: o texto dos botões fica difícil de ler."}
                </span>
              </div>
            </div>
            <RadioGroupField
              name="theme"
              label="Tema do site"
              defaultValue={settings.theme}
              options={[
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
              ]}
            />
          </div>
        </Section>

        <Section title="Contato">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="whatsapp"
              label="WhatsApp principal"
              required
              type="tel"
              mask="phone"
              defaultValue={formatPhone(settings.whatsapp)}
              hint="Recebe as mensagens de todos os botões do site."
            />
            <TextField
              name="phone"
              label="Telefone"
              required
              type="tel"
              mask="phone"
              defaultValue={formatPhone(settings.phone)}
            />
            <TextField
              name="email"
              label="E-mail"
              required
              type="email"
              defaultValue={settings.email}
            />
            <TextField
              name="instagram"
              label="Instagram"
              hideOptional
              defaultValue={settings.instagram ?? undefined}
              placeholder="https://instagram.com/sualoja"
            />
            <TextField
              name="facebook"
              label="Facebook"
              hideOptional
              defaultValue={settings.facebook ?? undefined}
              placeholder="https://facebook.com/sualoja"
            />
          </div>
        </Section>

        <Section title="Sobre a loja">
          <TextAreaField
            name="about"
            label="Texto institucional"
            hideOptional
            rows={4}
            defaultValue={settings.about}
            hint="Aparece na página Sobre e no rodapé."
          />
          <TextField
            name="yearFounded"
            label="Ano de fundação"
            hideOptional
            inputMode="numeric"
            defaultValue={
              settings.yearFounded ? String(settings.yearFounded) : undefined
            }
          />
        </Section>

        <Section
          title="Por que comprar aqui"
          description="Até 6 diferenciais reais da loja. Itens sem título não aparecem no site."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {reasons.map((r, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-ui border border-line p-4"
              >
                <TextField
                  name={`reasonTitle${i}`}
                  label={`Diferencial ${i + 1}`}
                  hideOptional
                  defaultValue={r.title}
                  placeholder="Ex.: Garantia de 3 meses"
                />
                <TextAreaField
                  name={`reasonText${i}`}
                  label="Detalhe"
                  hideOptional
                  rows={2}
                  defaultValue={r.text}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Google e redes sociais">
          <TextField
            name="siteUrl"
            label="Endereço do site"
            required
            defaultValue={settings.siteUrl}
            hint="Usado nos links compartilhados e no mapa do site. Ex.: https://www.sualoja.com.br"
          />
          <TextField
            name="seoTitle"
            label="Título nos resultados do Google"
            required
            defaultValue={settings.seoTitle}
            hint="Até 70 caracteres."
          />
          <TextAreaField
            name="seoDescription"
            label="Descrição nos resultados do Google"
            required
            rows={3}
            defaultValue={settings.seoDescription}
            hint="Entre 50 e 170 caracteres."
          />
        </Section>

        <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-ui md:border md:px-5">
          <SubmitButton size="lg">Salvar configurações</SubmitButton>
        </div>
      </form>
    </FormStateContext.Provider>
  );
}
