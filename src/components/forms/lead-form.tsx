"use client";

import {
  CheckCircle,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { submitLead } from "@/app/actions/leads";
import { buttonClass } from "@/components/ui/button";
import { inputClass, selectClass } from "@/components/ui/field";
import { formatPhone } from "@/lib/format";
import type { LeadFormState, LeadType } from "@/lib/leads";

const FormContext = createContext<LeadFormState>({ status: "idle" });

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
  const [state, action, pending] = useActionState(submitLead, {
    status: "idle",
  } as LeadFormState);
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
    <FormContext.Provider value={state}>
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

        {state.status === "error" && state.message && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="flex gap-3 rounded-ui bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-4 text-[15px] text-fg outline-none"
          >
            <WarningCircle
              size={20}
              className="mt-0.5 shrink-0 text-danger"
              aria-hidden
            />
            {state.message}
          </div>
        )}

        {children}

        <Consent />

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
    </FormContext.Provider>
  );
}

function useField(name: string) {
  const state = useContext(FormContext);
  const id = useId();
  const error = state.status === "error" ? state.fieldErrors[name] : undefined;
  const value = state.status === "error" ? state.values[name] : undefined;
  return { id, error, value, errorId: `${id}-erro`, hintId: `${id}-dica` };
}

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
};

function FieldShell({
  id,
  label,
  required,
  hint,
  hintId,
  error,
  errorId,
  className = "",
  children,
}: FieldProps & {
  id: string;
  hintId: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && (
          <span className="font-normal text-muted"> (opcional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  defaultValue,
  mask,
  min,
  ...props
}: FieldProps & {
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  defaultValue?: string;
  mask?: "phone" | "money" | "number";
  min?: string;
}) {
  const f = useField(props.name);
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const digits = el.value.replace(/\D/g, "");
    if (mask === "phone")
      el.value =
        digits.length > 2
          ? formatPhone(digits.slice(0, 11)).replace(/-$/, "")
          : digits;
    if (mask === "money")
      el.value = digits ? `R$ ${Number(digits).toLocaleString("pt-BR")}` : "";
    if (mask === "number")
      el.value = digits ? Number(digits).toLocaleString("pt-BR") : "";
  };
  return (
    <FieldShell {...props} {...f}>
      <input
        id={f.id}
        name={props.name}
        type={type}
        required={props.required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        min={min}
        defaultValue={f.value ?? defaultValue}
        onInput={mask ? onInput : undefined}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={
          f.error ? f.errorId : props.hint ? f.hintId : undefined
        }
        className={`${inputClass} h-12`}
      />
    </FieldShell>
  );
}

export function SelectField({
  options,
  placeholder = "Selecione",
  defaultValue,
  ...props
}: FieldProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}) {
  const f = useField(props.name);
  return (
    <FieldShell {...props} {...f}>
      <select
        id={f.id}
        name={props.name}
        required={props.required}
        defaultValue={f.value ?? defaultValue ?? ""}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={
          f.error ? f.errorId : props.hint ? f.hintId : undefined
        }
        className={`${selectClass} h-12`}
      >
        <option value="" disabled={props.required}>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function TextAreaField({
  placeholder,
  ...props
}: FieldProps & { placeholder?: string }) {
  const f = useField(props.name);
  return (
    <FieldShell {...props} {...f}>
      <textarea
        id={f.id}
        name={props.name}
        rows={4}
        placeholder={placeholder}
        defaultValue={f.value}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={
          f.error ? f.errorId : props.hint ? f.hintId : undefined
        }
        className={`${inputClass} py-3 leading-relaxed`}
      />
    </FieldShell>
  );
}

export function RadioGroupField({
  name,
  label,
  options,
  required,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const f = useField(name);
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={f.error ? f.errorId : undefined}
    >
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-ui border border-line-strong bg-surface px-4 text-[15px] has-[:checked]:border-fg has-[:checked]:shadow-[inset_0_0_0_1px_var(--fg)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required={required}
              defaultChecked={f.value === o.value}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {f.error && (
        <p id={f.errorId} className="text-sm text-danger">
          {f.error}
        </p>
      )}
    </fieldset>
  );
}

function Consent() {
  const f = useField("consentimento");
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-5">
      <label className="flex cursor-pointer gap-3 text-[15px] leading-relaxed">
        <input
          type="checkbox"
          name="consentimento"
          required
          defaultChecked={f.value === "on"}
          aria-invalid={f.error ? true : undefined}
          aria-describedby={f.error ? f.errorId : undefined}
          className="mt-1 size-[18px] shrink-0 accent-[var(--accent)]"
        />
        <span>
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
        </span>
      </label>
      {f.error && (
        <p id={f.errorId} className="text-sm text-danger">
          {f.error}
        </p>
      )}
    </div>
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
