import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/auth/session";
import { listLocationsAdmin } from "@/lib/data/admin";
import { VehicleForm } from "../vehicle-form";

export const metadata: Metadata = { title: "Cadastrar veículo" };

export default async function NewVehiclePage() {
  await requireStaff();
  const locations = await listLocationsAdmin();
  return (
    <>
      <PageHeader title="Cadastrar veículo" />
      <VehicleForm
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
    </>
  );
}
