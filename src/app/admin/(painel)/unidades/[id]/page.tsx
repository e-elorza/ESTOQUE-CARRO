import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/admin/buttons";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getLocationAdmin } from "@/lib/data/admin";
import { deleteLocation } from "../../../_actions/records";
import { LocationForm } from "./location-form";

export const metadata: Metadata = { title: "Unidade" };

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const location = id === "nova" ? undefined : await getLocationAdmin(id);
  if (id !== "nova" && !location) notFound();
  return (
    <>
      <PageHeader
        title={location ? `Unidade ${location.name}` : "Nova unidade"}
      />
      <LocationForm location={location ?? undefined} />
      {location && (
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6">
          <h2 className="font-semibold">Excluir unidade</h2>
          <p className="text-sm text-muted">
            Os veículos desta unidade continuam no estoque, sem unidade
            definida.
          </p>
          <form action={deleteLocation}>
            <input type="hidden" name="id" value={location.id} />
            <ConfirmSubmit
              label="Excluir unidade"
              confirmLabel="Excluir"
              question="Excluir esta unidade?"
            />
          </form>
        </div>
      )}
      <Link
        href="/admin/unidades"
        className="mt-6 inline-block text-sm text-accent-text hover:underline"
      >
        Voltar para as unidades
      </Link>
    </>
  );
}
