import type { z } from "zod";

/** State returned by server actions that back forms (public and admin). */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | {
      status: "error";
      message?: string;
      fieldErrors: Record<string, string>;
      values: Record<string, string>;
    };

export const idle: FormState = { status: "idle" };

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    // Repeated keys (checkbox groups) are joined with a newline
    values[k] = k in values ? `${values[k]}\n${v}` : v;
  }
  return values;
}

export function zodErrorState(
  error: z.ZodError,
  values: Record<string, string>,
  message = "Revise os campos destacados.",
): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", message, fieldErrors, values };
}
