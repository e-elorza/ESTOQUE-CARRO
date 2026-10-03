"use client";

import {
  Car,
  ChatsCircle,
  Gauge,
  Gear,
  List,
  MapPin,
  Users,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const items = [
  { href: "/admin", label: "Painel", icon: Gauge, exact: true },
  { href: "/admin/veiculos", label: "Veículos", icon: Car },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: ChatsCircle,
    badge: "leads" as const,
  },
  { href: "/admin/unidades", label: "Unidades", icon: MapPin },
  { href: "/admin/configuracoes", label: "Configurações", icon: Gear },
  { href: "/admin/equipe", label: "Equipe", icon: Users },
];

function Links({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex h-10 items-center gap-3 rounded-ui px-3 text-[15px] text-muted hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:font-medium aria-[current=page]:text-fg"
            >
              <Icon size={20} aria-hidden />
              <span className="flex-1">{label}</span>
              {badge === "leads" && newLeads > 0 && (
                <span className="tabular rounded-full bg-accent px-2 text-xs leading-5 font-medium text-on-accent">
                  {newLeads}
                  <span className="sr-only"> novos</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebarNav({ newLeads }: { newLeads: number }) {
  return (
    <nav aria-label="Painel">
      <Links newLeads={newLeads} />
    </nav>
  );
}

export function AdminMobileNav({
  newLeads,
  footer,
}: {
  newLeads: number;
  footer: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => ref.current?.close(), [pathname]);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex size-11 items-center justify-center rounded-ui hover:bg-surface-2 lg:hidden"
        aria-label="Abrir menu do painel"
      >
        <List size={24} />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu do painel"
        className="sheet m-0 h-dvh max-h-dvh w-[min(100%,20rem)] max-w-none bg-surface p-0 text-fg"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-ui hover:bg-surface-2"
              aria-label="Fechar menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav aria-label="Painel">
            <Links newLeads={newLeads} />
          </nav>
          <div className="mt-auto">{footer}</div>
        </div>
      </dialog>
    </>
  );
}
