import { ArrowRight, ImageSquare, Plus } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/session";
import { getDashboard, leadStatusLabel } from "@/lib/data/admin";
import { leadTypeLabel } from "@/lib/leads";
import { formatNumber } from "@/lib/format";
import { formatDateTime, leadTone } from "./ui";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const me = await requireStaff();
  const d = await getDashboard();
  const tiles = [
    {
      label: "Disponíveis",
      value: d.available,
      href: "/admin/veiculos?status=disponivel",
    },
    {
      label: "Reservados",
      value: d.reserved,
      href: "/admin/veiculos?status=reservado",
    },
    {
      label: "Vendidos em 30 dias",
      value: d.soldLast30,
      href: "/admin/veiculos?status=vendido",
    },
    {
      label: "Leads novos",
      value: d.newLeads,
      href: "/admin/leads?status=novo",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${me.name.split(" ")[0]}`}
        description="Resumo do estoque e dos atendimentos."
        actions={
          <Link href="/admin/veiculos/novo" className={buttonClass("primary")}>
            <Plus size={18} aria-hidden /> Cadastrar veículo
          </Link>
        }
      />

      <dl className="tabular mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-ui border border-line bg-line lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface">
            <Link
              href={t.href}
              className="flex flex-col gap-1 p-5 hover:bg-surface-2"
            >
              <dt className="order-2 text-sm text-muted">{t.label}</dt>
              <dd className="order-1 text-3xl font-semibold tracking-[-0.02em]">
                {formatNumber(t.value)}
              </dd>
            </Link>
          </div>
        ))}
      </dl>

      {(d.withoutPhotos > 0 || d.drafts > 0) && (
        <div className="mb-6 flex flex-col gap-2">
          {d.withoutPhotos > 0 && (
            <Link
              href="/admin/veiculos?status=disponivel"
              className="flex items-center gap-3 rounded-ui border border-line bg-surface px-4 py-3 text-[15px] hover:border-line-strong"
            >
              <ImageSquare size={20} className="text-warning" aria-hidden />
              <span className="flex-1">
                {d.withoutPhotos === 1
                  ? "1 veículo à venda está sem fotos."
                  : `${d.withoutPhotos} veículos à venda estão sem fotos.`}{" "}
                Carros com fotos recebem muito mais contatos.
              </span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
          {d.drafts > 0 && (
            <Link
              href="/admin/veiculos?status=rascunho"
              className="flex items-center gap-3 rounded-ui border border-line bg-surface px-4 py-3 text-[15px] hover:border-line-strong"
            >
              <span className="flex-1">
                {d.drafts === 1
                  ? "1 rascunho ainda não publicado."
                  : `${d.drafts} rascunhos ainda não publicados.`}
              </span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Leads recentes"
          actions={
            <Link
              href="/admin/leads"
              className="text-sm text-accent-text hover:underline"
            >
              Ver todos
            </Link>
          }
        >
          {d.recentLeads.length === 0 ? (
            <p className="text-muted">
              Nenhum lead ainda. Os pedidos enviados pelos formulários do site
              aparecem aqui.
            </p>
          ) : (
            <ul className="-my-2 flex flex-col">
              {d.recentLeads.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-ui px-2 py-2.5 hover:bg-surface-2"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{l.name}</span>
                      <span className="truncate text-sm text-muted">
                        {leadTypeLabel[l.type]}
                        {l.vehicleLabel ? `, ${l.vehicleLabel}` : ""}
                      </span>
                    </div>
                    <span className="hidden text-sm text-muted sm:block">
                      {formatDateTime(l.createdAt)}
                    </span>
                    <Badge tone={leadTone(l.status)}>
                      {leadStatusLabel[l.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cliques no WhatsApp (30 dias)">
          <p className="tabular mb-4 text-3xl font-semibold">
            {formatNumber(d.clicksLast30)}
          </p>
          {d.topClicks.length === 0 ? (
            <p className="text-sm text-muted">
              Os cliques nos botões de WhatsApp das páginas de veículos aparecem
              aqui. Contamos o clique, não a conversa.
            </p>
          ) : (
            <ol className="flex flex-col gap-2 text-[15px]">
              {d.topClicks.map((c) => (
                <li
                  key={c.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <Link
                    href={`/admin/veiculos/${c.id}`}
                    className="truncate hover:underline"
                  >
                    {c.label}
                  </Link>
                  <span className="tabular text-muted">{c.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
