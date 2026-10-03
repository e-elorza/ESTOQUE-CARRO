import { ArrowSquareOut, SignOut } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { countNewLeads } from "@/lib/data/admin";
import { logout } from "../_actions/auth";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const [settings, newLeads] = await Promise.all([
    getSettings(),
    countNewLeads(),
  ]);

  const footer = (
    <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm">
      <p className="truncate px-3 font-medium">{staff.name}</p>
      <p className="truncate px-3 text-muted">{staff.email}</p>
      <Link
        href="/admin/conta"
        className="mt-2 flex h-9 items-center rounded-ui px-3 text-muted hover:bg-surface-2 hover:text-fg"
      >
        Minha conta
      </Link>
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="flex h-9 items-center gap-2 rounded-ui px-3 text-muted hover:bg-surface-2 hover:text-fg"
      >
        Ver site <ArrowSquareOut size={16} aria-hidden />
      </a>
      <form action={logout}>
        <button
          type="submit"
          className="flex h-9 w-full items-center gap-2 rounded-ui px-3 text-muted hover:bg-surface-2 hover:text-fg"
        >
          <SignOut size={16} aria-hidden /> Sair
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
        <Link
          href="/admin"
          className="px-3 pt-2 text-[17px] font-semibold tracking-[-0.02em]"
        >
          {settings.name}
        </Link>
        <AdminSidebarNav newLeads={newLeads} />
        <div className="mt-auto">{footer}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <Link href="/admin" className="font-semibold">
            {settings.name}
          </Link>
          <AdminMobileNav newLeads={newLeads} footer={footer} />
        </header>
        <main
          id="conteudo"
          className="w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10"
        >
          {staff.mustChangePassword ? (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-semibold">Crie sua senha</h1>
              <p className="max-w-[56ch] text-muted">
                Você entrou com uma senha temporária. Escolha uma senha pessoal
                para continuar usando o painel.
              </p>
              <PasswordForm />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
