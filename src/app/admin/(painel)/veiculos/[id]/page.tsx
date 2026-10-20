import { ArrowSquareOut, Copy } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/buttons";
import { Flash, PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/session";
import {
  countActiveFeatured,
  getVehicleAdmin,
  listLocationsAdmin,
  vehicleStatusLabel,
} from "@/lib/data/admin";
import {
  FEATURED_DEFAULT_DAYS,
  FEATURED_SLOTS,
  isFeatureActive,
} from "@/lib/featured";
import type { VehicleStatus } from "@/lib/types";
import { addFeatured } from "../../../_actions/featured";
import {
  deleteVehicle,
  duplicateVehicle,
  setVehicleStatus,
} from "../../../_actions/vehicles";
import { PickNotice } from "../../destaques/notice";
import { formatPickEnd, vehicleTone } from "../../ui";
import { PhotoManager } from "../photo-manager";
import { VehicleForm } from "../vehicle-form";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getVehicleAdmin((await params).id);
  return { title: v ? `${v.brand} ${v.model}` : "Veículo" };
}

const quickStatus: { value: VehicleStatus; label: string }[] = [
  { value: "disponivel", label: "Marcar disponível" },
  { value: "reservado", label: "Marcar reservado" },
  { value: "vendido", label: "Marcar vendido" },
];

export default async function EditVehiclePage({ params, searchParams }: Props) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [vehicle, locations, featuredCount] = await Promise.all([
    getVehicleAdmin(id),
    listLocationsAdmin(),
    countActiveFeatured(),
  ]);
  if (!vehicle) notFound();
  const featured = isFeatureActive(vehicle);

  return (
    <>
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        description={`${vehicle.version ? `${vehicle.version}, ` : ""}código ${vehicle.code}`}
        actions={
          vehicle.status !== "rascunho" && (
            <a
              href={`/estoque/${vehicle.slug}`}
              target="_blank"
              rel="noopener"
              className={buttonClass("secondary")}
            >
              Ver no site <ArrowSquareOut size={16} aria-hidden />
            </a>
          )
        }
      />
      <Flash
        message={
          sp.salvo
            ? "Veículo salvo. O site já foi atualizado."
            : sp.copiado
              ? "Cópia criada como rascunho. Ajuste os dados e adicione as fotos."
              : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-ui border border-line bg-surface p-3">
        <span className="px-1 text-sm text-muted">Situação:</span>
        <Badge tone={vehicleTone(vehicle.status)}>
          {vehicleStatusLabel[vehicle.status]}
        </Badge>
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
        {quickStatus
          .filter((s) => s.value !== vehicle.status)
          .map((s) => (
            <form key={s.value} action={setVehicleStatus}>
              <input type="hidden" name="id" value={vehicle.id} />
              <input type="hidden" name="status" value={s.value} />
              <SubmitButton variant="ghost" size="sm" pendingLabel="Salvando…">
                {s.label}
              </SubmitButton>
            </form>
          ))}
        <form action={duplicateVehicle} className="sm:ml-auto">
          <input type="hidden" name="id" value={vehicle.id} />
          <SubmitButton variant="ghost" size="sm" pendingLabel="Copiando…">
            <Copy size={16} aria-hidden /> Duplicar
          </SubmitButton>
        </form>
      </div>

      <PickNotice code={sp.destaque} />
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-ui border border-line bg-surface p-3 text-sm">
        <span className="px-1 text-muted">Página inicial:</span>
        {featured ? (
          <>
            <Badge tone="accent">Destaque nº {vehicle.featuredPosition}</Badge>
            <span>{formatPickEnd(vehicle.featuredUntil)}</span>
          </>
        ) : vehicle.status !== "disponivel" ? (
          <span className="text-muted">
            Só carros disponíveis podem ser destaque.
          </span>
        ) : featuredCount >= FEATURED_SLOTS ? (
          <span className="text-muted">
            Fora dos destaques. As {FEATURED_SLOTS} vagas estão ocupadas.
          </span>
        ) : (
          <form action={addFeatured}>
            <input type="hidden" name="id" value={vehicle.id} />
            <input type="hidden" name="dias" value={FEATURED_DEFAULT_DAYS} />
            <input type="hidden" name="from" value="veiculo" />
            <SubmitButton variant="ghost" size="sm" pendingLabel="Salvando…">
              Destacar por {FEATURED_DEFAULT_DAYS} dias
            </SubmitButton>
          </form>
        )}
        <Link
          href="/admin/destaques"
          className="text-accent-text hover:underline sm:ml-auto"
        >
          Gerenciar destaques
        </Link>
      </div>

      <div className="mb-6">
        <Panel title={`Fotos (${vehicle.photos.length})`}>
          <PhotoManager
            vehicleId={vehicle.id}
            initial={vehicle.photos.map((p) => ({ id: p.id, thumb: p.thumb }))}
          />
        </Panel>
      </div>

      <VehicleForm
        vehicle={vehicle}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />

      <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6">
        <h2 className="font-semibold">Excluir veículo</h2>
        <p className="text-sm text-muted">
          Prefira marcar como vendido: a página continua no ar e o histórico
          fica guardado. Excluir apaga o anúncio e as fotos.
        </p>
        <form action={deleteVehicle}>
          <input type="hidden" name="id" value={vehicle.id} />
          <ConfirmSubmit
            label="Excluir veículo"
            confirmLabel="Excluir"
            question="Excluir este veículo e as fotos?"
          />
        </form>
        <Link
          href="/admin/veiculos"
          className="mt-4 text-sm text-accent-text hover:underline"
        >
          Voltar para a lista
        </Link>
      </div>
    </>
  );
}
