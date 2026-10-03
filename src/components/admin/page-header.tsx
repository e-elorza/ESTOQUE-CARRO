import { CheckCircle } from "@phosphor-icons/react/ssr";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
          {title}
        </h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="mb-6 flex items-center gap-2 rounded-ui bg-[color-mix(in_oklab,var(--success)_12%,transparent)] px-4 py-3 text-[15px]"
    >
      <CheckCircle
        size={20}
        weight="fill"
        className="text-success"
        aria-hidden
      />
      {message}
    </p>
  );
}

export function Panel({
  title,
  children,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-ui border border-line bg-surface">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
