import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getSettingsAdmin } from "@/lib/data/admin";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requireStaff();
  const settings = await getSettingsAdmin();
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Identidade, contatos e textos da loja. As mudanças aparecem no site na hora."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
