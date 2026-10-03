import { Plus } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/session";
import { listLocationsAdmin } from "@/lib/data/admin";
import { formatPhone, pluralVehicles } from "@/lib/format";

export const metadata: Metadata = { title: "Unidades" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function LocationsPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const locations = await listLocationsAdmin();
  return (
    <>
      <PageHeader
        title="Unidades"
        description="Endereços, horários e telefones exibidos no site."
        actions={
          <Link href="/admin/unidades/nova" className={buttonClass("primary")}>
            <Plus size={18} aria-hidden /> Nova unidade
          </Link>
        }
      />
      <Flash
        message={
          sp.salvo ? "Unidade salva." : sp.excluido ? "Unidade excluída." : null
        }
      />
      {locations.length === 0 ? (
        <div className="rounded-ui border border-line bg-surface p-10 text-center text-muted">
          Nenhuma unidade cadastrada.
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-ui border border-line bg-surface">
          {locations.map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/unidades/${l.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{l.name}</span>
                  <span className="truncate text-sm text-muted">
                    {l.street}, {l.city}/{l.state}
                    {l.phone ? `, ${formatPhone(l.phone)}` : ""}
                  </span>
                </div>
                <span className="text-sm whitespace-nowrap text-muted">
                  {pluralVehicles(l.vehicleCount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
