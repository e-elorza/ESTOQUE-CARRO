"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel = "Salvando…",
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * Two-step destructive action inside a form: the first click asks for confirmation inline
 * (no browser dialog), the second submits.
 */
export function ConfirmSubmit({
  label,
  confirmLabel,
  question,
}: {
  label: string;
  confirmLabel: string;
  question: string;
}) {
  const [asking, setAsking] = useState(false);
  const { pending } = useFormStatus();
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="inline-flex h-9 items-center rounded-ui px-3 text-sm font-medium text-danger hover:bg-surface-2"
      >
        {label}
      </button>
    );
  }
  return (
    <span
      role="group"
      aria-label={question}
      className="inline-flex flex-wrap items-center gap-2 text-sm"
    >
      <span>{question}</span>
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "sm", "!bg-danger !text-white")}
      >
        {pending ? "Excluindo…" : confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className={buttonClass("ghost", "sm")}
      >
        Cancelar
      </button>
    </span>
  );
}
