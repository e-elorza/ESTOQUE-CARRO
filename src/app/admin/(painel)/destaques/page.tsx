import {
  ArrowDown,
  ArrowUp,
  ImageSquare,
  Plus,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/buttons";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { labelClass, selectClass } from "@/components/ui/field";
import { requireStaff } from "@/lib/auth/session";
import { getFeaturedAdmin, type AdminVehicle } from "@/lib/data/admin";
import {
  CLICK_WINDOW_DAYS,
  FEATURED_DEFAULT_DAYS,
  FEATURED_DURATIONS,
  FEATURED_SLOTS,
  type FeaturedSource,
} from "@/lib/featured";
import { formatKm, formatPrice, formatYears } from "@/lib/format";
import {
  addFeatured,
  moveFeatured,
  removeFeatured,
  renewFeatured,
} from "../../_actions/featured";
import { formatPickEnd } from "../ui";
import { PickNotice } from "./notice";

export const metadata: Metadata = { title: "Destaques" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

function VehicleLine({
  v,
  children,
}: {
  v: AdminVehicle;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-ui bg-photo">
        {v.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.photos[0].thumb}
            alt=""
            width={64}
            height={48}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-full items-center justify-center text-muted"
            title="Sem fotos"
          >
            <ImageSquare size={20} aria-label="Sem fotos" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={`/admin/veiculos/${v.id}`}
          className="truncate font-medium hover:underline"
        >
          {v.brand} {v.model}{" "}
          <span className="font-normal text-muted">{v.version}</span>
        </Link>
        <p className="tabular truncate text-sm text-muted">
          {v.code}, {formatYears(v)}, {formatKm(v.mileageKm)},{" "}
          {formatPrice(v.promoPrice ?? v.price)}
        </p>
        {children}
      </div>
    </div>
  );
}

function sourceLabel(source: FeaturedSource): string {
  if (source.kind === "manual") return "Escolhido por vocês";
  if (source.kind === "clicks")
    return `Automático: ${source.clicks} ${source.clicks === 1 ? "chamada" : "chamadas"} no WhatsApp em ${CLICK_WINDOW_DAYS} dias`;
  return "Automático: chegou recentemente";
}

const smallButton = buttonClass("ghost", "sm");

export default async function FeaturedPage({ searchParams }: Props) {
  await requireStaff();
  const [{ destaque }, data] = await Promise.all([
    searchParams,
    getFeaturedAdmin(),
  ]);
  const { active, expired, available, preview } = data;
  const activeIds = new Set(active.map((v) => v.id));
  const candidates = available.filter((v) => !activeIds.has(v.id));
  const full = active.length >= FEATURED_SLOTS;

  return (
    <>
      <PageHeader
        title="Destaques"
        description="Os carros de “Destaques da semana” na página inicial. O primeiro também aparece na capa."
      />
      <PickNotice code={destaque} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel
            title="Escolhidos por vocês"
            actions={
              <span className="tabular text-sm text-muted">
                {active.length} de {FEATURED_SLOTS} vagas
              </span>
            }
          >
            <p className="mb-4 text-sm text-muted">
              Cada destaque vale pelo prazo escolhido e depois sai sozinho. Use
              as setas para mudar a ordem: o 1º vai para a capa.
            </p>
            {active.length === 0 ? (
              <p className="rounded-ui bg-surface-2 px-4 py-3 text-[15px]">
                Nenhum carro escolhido. As vagas estão sendo preenchidas
                automaticamente.
              </p>
            ) : (
              <ol className="flex flex-col divide-y divide-line">
                {active.map((v, i) => (
                  <li
                    key={v.id}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <span
                      className="tabular hidden w-6 shrink-0 text-center font-semibold sm:block"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <VehicleLine v={v}>
                      <p className="text-sm">
                        <span className="sr-only">Posição {i + 1}. </span>
                        {formatPickEnd(v.featuredUntil)}
                      </p>
                      {v.status !== "disponivel" && (
                        <p className="text-sm text-warning">
                          Não aparece no site enquanto não estiver disponível.
                        </p>
                      )}
                      {i >= FEATURED_SLOTS && (
                        <p className="text-sm text-warning">
                          Fora da página inicial: o limite é de {FEATURED_SLOTS}{" "}
                          destaques.
                        </p>
                      )}
                    </VehicleLine>
                    <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="direcao" value="subir" />
                        <button
                          type="submit"
                          disabled={i === 0}
                          className={`${smallButton} size-9 !px-0`}
                          aria-label={`Subir ${v.brand} ${v.model}`}
                        >
                          <ArrowUp size={16} aria-hidden />
                        </button>
                      </form>
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="direcao" value="descer" />
                        <button
                          type="submit"
                          disabled={i === active.length - 1}
                          className={`${smallButton} size-9 !px-0`}
                          aria-label={`Descer ${v.brand} ${v.model}`}
                        >
                          <ArrowDown size={16} aria-hidden />
                        </button>
                      </form>
                      {v.featuredUntil && (
                        <form action={renewFeatured}>
                          <input type="hidden" name="id" value={v.id} />
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            pendingLabel="Renovando…"
                          >
                            +{FEATURED_DEFAULT_DAYS} dias
                          </SubmitButton>
                        </form>
                      )}
                      <form action={removeFeatured}>
                        <input type="hidden" name="id" value={v.id} />
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          pendingLabel="Removendo…"
                          className="text-danger"
                        >
                          Remover
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Adicionar destaque">
            {full ? (
              <p className="text-[15px] text-muted">
                As {FEATURED_SLOTS} vagas estão ocupadas. Remova um destaque
                para adicionar outro.
              </p>
            ) : candidates.length === 0 ? (
              <p className="text-[15px] text-muted">
                Nenhum carro disponível para destacar.{" "}
                <Link
                  href="/admin/veiculos"
                  className="text-accent-text hover:underline"
                >
                  Ver veículos
                </Link>
              </p>
            ) : (
              <form
                action={addFeatured}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label htmlFor="destaque-carro" className={labelClass}>
                    Carro
                  </label>
                  <select
                    id="destaque-carro"
                    name="id"
                    required
                    defaultValue=""
                    className={`${selectClass} h-11`}
                  >
                    <option value="" disabled>
                      Escolha um carro disponível…
                    </option>
                    {candidates.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} {v.version} ({v.code})
                        {v.photos.length === 0 ? ", sem fotos" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:w-36">
                  <label htmlFor="destaque-dias" className={labelClass}>
                    Por quanto tempo
                  </label>
                  <select
                    id="destaque-dias"
                    name="dias"
                    defaultValue={FEATURED_DEFAULT_DAYS}
                    className={`${selectClass} h-11`}
                  >
                    {FEATURED_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} dias
                      </option>
                    ))}
                  </select>
                </div>
                <SubmitButton pendingLabel="Adicionando…">
                  <Plus size={18} aria-hidden /> Adicionar
                </SubmitButton>
              </form>
            )}
          </Panel>

          {expired.length > 0 && (
            <Panel title="Vencidos">
              <ul className="flex flex-col divide-y divide-line">
                {expired.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <VehicleLine v={v}>
                      <p className="text-sm text-muted">
                        {formatPickEnd(v.featuredUntil)}
                      </p>
                    </VehicleLine>
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      {!full && v.status === "disponivel" && (
                        <form action={renewFeatured}>
                          <input type="hidden" name="id" value={v.id} />
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            pendingLabel="Renovando…"
                          >
                            Destacar de novo
                          </SubmitButton>
                        </form>
                      )}
                      <form action={removeFeatured}>
                        <input type="hidden" name="id" value={v.id} />
                        <SubmitButton
                          variant="ghost"
                          size="sm"
                          pendingLabel="Removendo…"
                        >
                          Tirar da lista
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel title="Como está a página inicial agora">
          <p className="mb-4 text-sm text-muted">
            Vagas livres são preenchidas sozinhas: primeiro os carros mais
            chamados no WhatsApp nos últimos {CLICK_WINDOW_DAYS} dias, depois os
            que chegaram por último. Carros com fotos têm preferência.
          </p>
          {preview.length === 0 ? (
            <p className="text-[15px] text-muted">
              Nenhum carro disponível. A seção não aparece no site.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {preview.map(({ vehicle, source }, i) => (
                <li key={vehicle.id} className="flex items-start gap-3">
                  <span
                    className="tabular w-5 shrink-0 pt-3 text-center text-sm font-semibold text-muted"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <VehicleLine v={vehicle}>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      {i === 0 && <Badge tone="accent">Capa</Badge>}
                      {sourceLabel(source)}
                    </p>
                  </VehicleLine>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
