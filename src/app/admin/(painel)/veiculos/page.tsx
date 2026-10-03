import { ImageSquare, MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { requireStaff } from "@/lib/auth/session";
import {
  listVehiclesAdmin,
  vehicleStatusCounts,
  vehicleStatusLabel,
} from "@/lib/data/admin";
import { formatKm, formatPrice, formatYears } from "@/lib/format";
import { vehicleTone } from "../ui";

export const metadata: Metadata = { title: "Veículos" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const tabs = [
  { value: "", label: "Todos" },
  { value: "disponivel", label: "Disponíveis" },
  { value: "reservado", label: "Reservados" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "vendido", label: "Vendidos" },
];

export default async function VehiclesPage({ searchParams }: Props) {
  await requireStaff();
  const { q = "", status = "", excluido } = await searchParams;
  const [vehicles, counts] = await Promise.all([
    listVehiclesAdmin({ q, status }),
    vehicleStatusCounts(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabHref = (value: string) => {
    const p = new URLSearchParams();
    if (value) p.set("status", value);
    if (q) p.set("q", q);
    return `/admin/veiculos${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Veículos"
        actions={
          <Link href="/admin/veiculos/novo" className={buttonClass("primary")}>
            <Plus size={18} aria-hidden /> Cadastrar veículo
          </Link>
        }
      />
      <Flash message={excluido ? "Veículo excluído." : null} />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav
          aria-label="Filtrar por situação"
          className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          <ul className="flex gap-1">
            {tabs.map((t) => {
              const count = t.value ? (counts[t.value] ?? 0) : total;
              return (
                <li key={t.value}>
                  <Link
                    href={tabHref(t.value)}
                    aria-current={status === t.value ? "page" : undefined}
                    className="inline-flex h-9 items-center gap-1.5 rounded-ui px-3 text-sm whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
                  >
                    {t.label}{" "}
                    <span className="tabular opacity-70">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <form role="search" className="relative md:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="busca-veiculo" className="sr-only">
            Buscar por marca, modelo ou código
          </label>
          <MagnifyingGlass
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id="busca-veiculo"
            name="q"
            defaultValue={q}
            placeholder="Buscar marca, modelo ou código"
            className={`${inputClass} h-10 pl-9`}
          />
        </form>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-ui border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-muted">
            {q || status
              ? "Nenhum veículo encontrado com esses filtros."
              : "Nenhum veículo cadastrado ainda."}
          </p>
          <Link href="/admin/veiculos/novo" className={buttonClass("primary")}>
            Cadastrar o primeiro veículo
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-ui border border-line bg-surface">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/veiculos/${v.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2"
              >
                <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-ui bg-photo">
                  {v.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.photos[0].thumb}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="flex h-full items-center justify-center text-muted"
                      title="Sem fotos"
                    >
                      <ImageSquare size={22} aria-label="Sem fotos" />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate font-medium">
                    {v.brand} {v.model}{" "}
                    <span className="font-normal text-muted">{v.version}</span>
                  </p>
                  <p className="tabular truncate text-sm text-muted">
                    {v.code} · {formatYears(v)} · {formatKm(v.mileageKm)}
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <span className="tabular font-semibold">
                    {formatPrice(v.promoPrice ?? v.price)}
                  </span>
                  {v.featured && (
                    <span className="text-xs text-muted">Destaque</span>
                  )}
                </div>
                <Badge tone={vehicleTone(v.status)}>
                  {vehicleStatusLabel[v.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
