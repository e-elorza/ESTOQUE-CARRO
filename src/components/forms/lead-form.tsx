"use client";

import { CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitLead } from "@/app/actions/leads";
import { buttonClass } from "@/components/ui/button";
import { idle } from "@/lib/form-state";
import type { LeadType } from "@/lib/leads";
import {
  ConsentField,
  FormMessage,
  FormStateContext,
  TextField,
} from "./fields";

export {
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";

type LeadFormProps = {
  type: LeadType;
  /** Hidden context, e.g. the vehicle code */
  hidden?: Record<string, string>;
  submitLabel: string;
  success: {
    title: string;
    text: string;
    whatsapp?: { href: string; label: string };
  };
  children: React.ReactNode;
};

export function LeadForm({
  type,
  hidden = {},
  submitLabel,
  success,
  children,
}: LeadFormProps) {
  const [state, action, pending] = useActionState(submitLead, idle);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Move focus to the result so screen reader and keyboard users notice it.
  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error") {
      const first = formRef.current?.querySelector<HTMLElement>(
        "[aria-invalid=true]",
      );
      (first ?? summaryRef.current)?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col items-start gap-4 outline-none"
      >
        <CheckCircle
          size={40}
          weight="fill"
          className="text-success"
          aria-hidden
        />
        <h2 className="text-2xl font-semibold">{success.title}</h2>
        <p className="max-w-[48ch] leading-relaxed text-muted">
          {success.text}
        </p>
        {success.whatsapp && (
          <a
            href={success.whatsapp.href}
            target="_blank"
            rel="noopener"
            className={buttonClass("whatsapp", "lg")}
          >
            <WhatsappLogo size={20} weight="fill" aria-hidden />
            {success.whatsapp.label}
          </a>
        )}
        <Link
          href="/estoque"
          className="text-[15px] font-medium text-accent-text hover:underline"
        >
          Voltar para o estoque
        </Link>
      </div>
    );
  }

  return (
    <FormStateContext.Provider value={state}>
      <form
        ref={formRef}
        action={action}
        noValidate
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="tipo" value={type} />
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {/* Honeypot */}
        <div
          aria-hidden
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label>
            Não preencha este campo
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <FormMessage innerRef={summaryRef} />

        {children}

        <ConsentField>
          Autorizo o uso dos meus dados para que a loja entre em contato sobre
          esta solicitação, conforme a{" "}
          <Link
            href="/politica-de-privacidade"
            target="_blank"
            className="text-accent-text underline"
          >
            Política de Privacidade
          </Link>
          .
        </ConsentField>

        <button
          type="submit"
          disabled={pending}
          className={buttonClass(
            "primary",
            "lg",
            "w-full sm:w-auto sm:self-start",
          )}
        >
          {pending ? "Enviando…" : submitLabel}
        </button>
      </form>
    </FormStateContext.Provider>
  );
}

export function ContactFields() {
  return (
    <>
      <TextField
        name="nome"
        label="Nome completo"
        required
        autoComplete="name"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="telefone"
          label="WhatsApp"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          mask="phone"
          placeholder="Ex.: (11) 98765-4321"
        />
        <TextField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
        />
      </div>
    </>
  );
}
