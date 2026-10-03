"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { createContext, useContext, useId } from "react";
import { inputClass, selectClass } from "@/components/ui/field";
import { formatPhone } from "@/lib/format";
import type { FormState } from "@/lib/form-state";

/** Provides the last server-action result to the fields below it (errors and submitted values). */
export const FormStateContext = createContext<FormState>({ status: "idle" });

function useField(name: string) {
  const state = useContext(FormStateContext);
  const id = useId();
  const error = state.status === "error" ? state.fieldErrors[name] : undefined;
  const value = state.status === "error" ? state.values[name] : undefined;
  return { id, error, value, errorId: `${id}-erro`, hintId: `${id}-dica` };
}

export function FormMessage({
  innerRef,
}: {
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const state = useContext(FormStateContext);
  if (state.status === "error" && state.message) {
    return (
      <div
        ref={innerRef}
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
    );
  }
  if (state.status === "success" && state.message) {
    return (
      <div
        role="status"
        className="rounded-ui bg-[color-mix(in_oklab,var(--success)_12%,transparent)] p-4 text-[15px]"
      >
        {state.message}
      </div>
    );
  }
  return null;
}

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  /** Hide the "(opcional)" suffix (e.g. admin forms where it adds noise) */
  hideOptional?: boolean;
};

function FieldShell({
  id,
  label,
  required,
  hideOptional,
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
        {!required && !hideOptional && (
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
  max,
  step,
  ...props
}: FieldProps & {
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  defaultValue?: string;
  mask?: "phone" | "money" | "number";
  min?: string;
  max?: string;
  step?: string;
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
        max={max}
        step={step}
        spellCheck={type === "email" || type === "password" ? false : undefined}
        autoCapitalize={type === "email" ? "none" : undefined}
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
  placeholder?: string | null;
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
        {placeholder !== null && (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        )}
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
  defaultValue,
  rows = 4,
  ...props
}: FieldProps & {
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  const f = useField(props.name);
  return (
    <FieldShell {...props} {...f}>
      <textarea
        id={f.id}
        name={props.name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={f.value ?? defaultValue}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={
          f.error ? f.errorId : props.hint ? f.hintId : undefined
        }
        className={`${inputClass} py-3 leading-relaxed`}
      />
    </FieldShell>
  );
}

const choiceClass =
  "inline-flex h-11 cursor-pointer items-center gap-2 rounded-ui border border-line-strong bg-surface px-4 text-[15px] has-[:checked]:border-fg has-[:checked]:shadow-[inset_0_0_0_1px_var(--fg)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text";

export function RadioGroupField({
  name,
  label,
  options,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
}) {
  const f = useField(name);
  const current = f.value ?? defaultValue;
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={f.error ? f.errorId : undefined}
    >
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className={choiceClass}>
            <input
              type="radio"
              name={name}
              value={o.value}
              required={required}
              defaultChecked={current === o.value}
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

/** Group of checkboxes sharing one name (values arrive as repeated form entries). */
export function CheckboxGroupField({
  name,
  label,
  options,
  defaultValues = [],
  columns = 1,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValues?: string[];
  columns?: 1 | 2 | 3;
}) {
  const f = useField(name);
  const selected = f.value !== undefined ? f.value.split("\n") : defaultValues;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div
        className={`grid gap-x-6 gap-y-1 ${columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""}`}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px]"
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={selected.includes(o.value)}
              className="size-[18px] shrink-0 rounded-[3px] accent-[var(--accent)]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const f = useField(name);
  const checked = f.value !== undefined ? f.value === "on" : defaultChecked;
  return (
    <label className="flex cursor-pointer gap-3 text-[15px] leading-relaxed">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="mt-1 size-[18px] shrink-0 accent-[var(--accent)]"
      />
      <span>
        {label}
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** Consent checkbox required on public forms (LGPD). */
export function ConsentField({ children }: { children: React.ReactNode }) {
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
        <span>{children}</span>
      </label>
      {f.error && (
        <p id={f.errorId} className="text-sm text-danger">
          {f.error}
        </p>
      )}
    </div>
  );
}
