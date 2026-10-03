import { Envelope, Phone, WhatsappLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/admin/buttons";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { getLead, leadStatusLabel, listLocationsAdmin } from "@/lib/data/admin";
import {
  formatKm,
  formatPhone,
  formatPrice,
  telHref,
  whatsappUrl,
} from "@/lib/format";
import { leadTypeLabel } from "@/lib/leads";
import { deleteLead } from "../../../_actions/records";
import { formatDateLong, leadTone } from "../../ui";
import { LeadStatusForm } from "./lead-status-form";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Lead" };

const condition: Record<string, string> = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  reparos: "Precisa de reparos",
};

export default async function LeadPage({ params }: Props) {
  const me = await requireStaff();
  const lead = await getLead((await params).id);
  if (!lead) notFound();
  const [settings, locations] = await Promise.all([
    getSettings(),
    listLocationsAdmin(),
  ]);
  const d = lead.details as Record<string, string | number | undefined>;

  const rows: [string, string][] = [];
  if (d.entrada !== undefined)
    rows.push(["Entrada", formatPrice(Number(d.entrada))]);
  if (d.prazo) rows.push(["Prazo desejado", `${d.prazo} meses`]);
  if (d.valorProposta !== undefined)
    rows.push(["Valor da proposta", formatPrice(Number(d.valorProposta))]);
  if (d.data)
    rows.push([
      "Data preferida",
      String(d.data).split("-").reverse().join("/"),
    ]);
  if (d.periodo)
    rows.push(["Período", d.periodo === "manha" ? "Manhã" : "Tarde"]);
  if (d.unidade)
    rows.push([
      "Unidade",
      locations.find((l) => l.id === d.unidade)?.name ?? String(d.unidade),
    ]);
  if (d.marca)
    rows.push([
      "Carro do cliente",
      [d.marca, d.modelo, d.versao].filter(Boolean).join(" "),
    ]);
  if (d.ano) rows.push(["Ano", String(d.ano)]);
  if (d.km !== undefined) rows.push(["Quilometragem", formatKm(Number(d.km))]);
  if (d.cambio)
    rows.push(["Câmbio", d.cambio === "manual" ? "Manual" : "Automático"]);
  if (d.estado)
    rows.push([
      "Estado geral",
      condition[String(d.estado)] ?? String(d.estado),
    ]);

  const firstName = lead.name.split(" ")[0];
  const reply = whatsappUrl(
    `55${lead.phone}`,
    `Olá, ${firstName}! Aqui é ${me.name.split(" ")[0]}, da ${settings.name}. Recebemos seu pedido${lead.vehicleLabel ? ` sobre o ${lead.vehicleLabel.trim()}` : ""} pelo site.`,
  );

  return (
    <>
      <PageHeader
        title={lead.name}
        description={`${leadTypeLabel[lead.type]}, recebido em ${formatDateLong(lead.createdAt)}`}
        actions={
          <Badge tone={leadTone(lead.status)}>
            {leadStatusLabel[lead.status]}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Contato">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <a
                  href={reply}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass("primary")}
                >
                  <WhatsappLogo size={18} weight="fill" aria-hidden /> Responder
                  no WhatsApp
                </a>
                <a
                  href={telHref(`55${lead.phone}`)}
                  className={buttonClass("secondary")}
                >
                  <Phone size={18} aria-hidden /> Ligar
                </a>
              </div>
              <dl className="tabular grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">Telefone / WhatsApp</dt>
                  <dd>{formatPhone(lead.phone)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">E-mail</dt>
                  <dd className="break-all">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Envelope size={16} aria-hidden /> {lead.email}
                      </a>
                    ) : (
                      "Não informado"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel title="Pedido">
            <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">Veículo de interesse</dt>
                <dd>
                  {lead.vehicleId && lead.vehicleLabel ? (
                    <Link
                      href={`/admin/veiculos/${lead.vehicleId}`}
                      className="font-medium text-accent-text hover:underline"
                    >
                      {lead.vehicleLabel} ({lead.vehicleCode})
                    </Link>
                  ) : (
                    String(d.veiculo ?? lead.vehicleCode ?? "Não informado")
                  )}
                </dd>
              </div>
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="tabular">{v}</dd>
                </div>
              ))}
              {d.mensagem && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted">Mensagem</dt>
                  <dd className="leading-relaxed whitespace-pre-line">
                    {String(d.mensagem)}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>

          <p className="text-sm text-muted">
            Consentimento registrado em {formatDateLong(lead.consentAt)}{" "}
            (política de {lead.consentVersion.split("-").reverse().join("/")}).
            {lead.sourceUrl && (
              <>
                {" "}
                Enviado a partir de{" "}
                {lead.sourceUrl.replace(/^https?:\/\/[^/]+/, "") || "/"}.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Atendimento">
            <LeadStatusForm
              id={lead.id}
              status={lead.status}
              notes={lead.notes}
            />
          </Panel>
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">Excluir dados do cliente</h2>
            <p className="text-sm text-muted">
              Use quando o cliente pedir a remoção dos dados. A exclusão é
              definitiva.
            </p>
            <form action={deleteLead}>
              <input type="hidden" name="id" value={lead.id} />
              <ConfirmSubmit
                label="Excluir lead"
                confirmLabel="Excluir"
                question="Excluir definitivamente?"
              />
            </form>
          </div>
        </div>
      </div>
      <Link
        href="/admin/leads"
        className="mt-8 inline-block text-sm text-accent-text hover:underline"
      >
        Voltar para os leads
      </Link>
    </>
  );
}
