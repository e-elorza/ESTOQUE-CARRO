import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth/session";
import {
  leadStatusCounts,
  leadStatusLabel,
  listLeads,
  type LeadStatus,
} from "@/lib/data/admin";
import { formatPhone } from "@/lib/format";
import { leadTypeLabel, leadTypes } from "@/lib/leads";
import { formatDateTime, leadTone } from "../ui";

export const metadata: Metadata = { title: "Leads" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function LeadsPage({ searchParams }: Props) {
  await requireStaff();
  const { status = "", tipo = "", excluido } = await searchParams;
  const [leads, counts] = await Promise.all([
    listLeads({ status, type: tipo }),
    leadStatusCounts(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const href = (patch: { status?: string; tipo?: string }) => {
    const p = new URLSearchParams();
    const s = patch.status ?? status;
    const t = patch.tipo ?? tipo;
    if (s) p.set("status", s);
    if (t) p.set("tipo", t);
    return `/admin/leads${p.size ? `?${p}` : ""}`;
  };
  const statusTabs: { value: string; label: string; count: number }[] = [
    { value: "", label: "Todos", count: total },
    ...(Object.keys(leadStatusLabel) as LeadStatus[]).map((s) => ({
      value: s,
      label: leadStatusLabel[s],
      count: counts[s] ?? 0,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        description="Pedidos enviados pelos formulários do site."
      />
      <Flash message={excluido ? "Lead excluído definitivamente." : null} />

      <div className="mb-5 flex flex-col gap-3">
        <nav
          aria-label="Filtrar por situação"
          className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          <ul className="flex gap-1">
            {statusTabs.map((t) => (
              <li key={t.value}>
                <Link
                  href={href({ status: t.value })}
                  aria-current={status === t.value ? "page" : undefined}
                  className="inline-flex h-9 items-center gap-1.5 rounded-ui px-3 text-sm whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
                >
                  {t.label}{" "}
                  <span className="tabular opacity-70">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav
          aria-label="Filtrar por tipo"
          className="flex flex-wrap gap-2 text-sm"
        >
          {[
            { value: "", label: "Todos os tipos" },
            ...leadTypes.map((t) => ({ value: t, label: leadTypeLabel[t] })),
          ].map((t) => (
            <Link
              key={t.value}
              href={href({ tipo: t.value })}
              aria-current={tipo === t.value ? "page" : undefined}
              className="inline-flex h-8 items-center rounded-ui border border-line px-3 text-muted hover:border-line-strong hover:text-fg aria-[current=page]:border-fg aria-[current=page]:text-fg"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-ui border border-line bg-surface p-10 text-center text-muted">
          {status || tipo
            ? "Nenhum lead com esses filtros."
            : "Nenhum lead ainda. Os pedidos do site aparecem aqui."}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-ui border border-line bg-surface">
          {leads.map((l) => (
            <li
              key={l.id}
              className="[contain-intrinsic-size:auto_72px] [content-visibility:auto]"
            >
              <Link
                href={`/admin/leads/${l.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-2 md:grid-cols-[8rem_minmax(0,1.2fr)_minmax(0,1fr)_7rem_auto]"
              >
                <span className="tabular hidden text-sm text-muted md:block">
                  {formatDateTime(l.createdAt)}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate ${l.status === "novo" ? "font-semibold" : "font-medium"}`}
                  >
                    {l.name}
                  </span>
                  <span className="tabular block truncate text-sm text-muted">
                    {formatPhone(l.phone)}
                  </span>
                </span>
                <span className="hidden min-w-0 truncate text-sm text-muted md:block">
                  {l.vehicleLabel ??
                    (l.vehicleCode ? `Código ${l.vehicleCode}` : "Sem veículo")}
                </span>
                <span className="hidden text-sm md:block">
                  {leadTypeLabel[l.type]}
                </span>
                <Badge tone={leadTone(l.status)}>
                  {leadStatusLabel[l.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
