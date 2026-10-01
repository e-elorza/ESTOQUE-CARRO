type Variant = "primary" | "secondary" | "ghost" | "whatsapp";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary:
    "bg-surface text-fg shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--fg)]",
  ghost: "text-fg hover:bg-surface-2",
  whatsapp: "bg-accent text-on-accent hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  extra = "",
): string {
  return [
    "inline-flex items-center justify-center whitespace-nowrap rounded-ui font-medium select-none",
    "transition-[filter,box-shadow,background-color,transform] duration-200 ease-out-quint active:translate-y-px",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    extra,
  ].join(" ");
}
