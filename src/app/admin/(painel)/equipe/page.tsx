import type { Metadata } from "next";
import { ConfirmSubmit } from "@/components/admin/buttons";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/lib/auth/session";
import { listStaff } from "@/lib/data/admin";
import { deleteStaff } from "../../_actions/records";
import { NewStaffForm, ResetPasswordForm } from "./staff-forms";

export const metadata: Metadata = { title: "Equipe" };

export default async function StaffPage() {
  const me = await requireStaff();
  const staff = await listStaff();
  return (
    <>
      <PageHeader title="Equipe" description="Pessoas com acesso ao painel." />
      <div className="flex flex-col gap-6">
        <ul className="divide-y divide-line overflow-hidden rounded-ui border border-line bg-surface">
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 font-medium">
                  {s.name}
                  {s.id === me.id && <Badge>Você</Badge>}
                  {s.mustChangePassword && (
                    <Badge tone="warning">Senha temporária</Badge>
                  )}
                </span>
                <span className="truncate text-sm text-muted">{s.email}</span>
              </div>
              {s.id !== me.id && (
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <ResetPasswordForm id={s.id} name={s.name} />
                  <form action={deleteStaff}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmit
                      label="Remover acesso"
                      confirmLabel="Remover"
                      question={`Remover o acesso de ${s.name}?`}
                    />
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Panel title="Novo acesso">
          <NewStaffForm />
        </Panel>
      </div>
    </>
  );
}
