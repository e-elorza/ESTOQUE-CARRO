import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { requireStaff } from "@/lib/auth/session";
import { PasswordForm } from "../password-form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const me = await requireStaff();
  return (
    <>
      <PageHeader title="Minha conta" description={`${me.name}, ${me.email}`} />
      <Panel title="Alterar senha">
        <PasswordForm />
      </Panel>
    </>
  );
}
