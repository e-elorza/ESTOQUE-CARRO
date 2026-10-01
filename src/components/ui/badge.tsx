type Tone = "neutral" | "accent" | "warning" | "success" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg",
  accent:
    "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent-text",
  warning:
    "bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-warning",
  success:
    "bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success",
  danger: "bg-[color-mix(in_oklab,var(--danger)_14%,transparent)] text-danger",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-ui px-2 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
