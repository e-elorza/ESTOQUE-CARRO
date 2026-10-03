"use client";

import { List, WhatsappLogo, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui/button";
import { navItems } from "@/lib/nav";

export function MobileNav({
  whatsappHref,
  phoneLabel,
}: {
  whatsappHref: string;
  phoneLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close when navigating
  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex size-11 items-center justify-center rounded-ui text-fg hover:bg-surface-2 lg:hidden"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
      >
        <List size={24} weight="regular" />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        className="sheet overscroll-contain m-0 ml-auto h-dvh max-h-dvh w-[min(100%,24rem)] max-w-none bg-surface p-0 text-fg"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex h-12 items-center justify-end">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-ui hover:bg-surface-2"
              aria-label="Fechar menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav aria-label="Principal" className="mt-2">
            <ul className="flex flex-col">
              <li>
                <Link
                  href="/"
                  className="flex h-14 items-center border-b border-line text-xl font-medium"
                >
                  Início
                </Link>
              </li>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={
                      pathname.startsWith(item.href) ? "page" : undefined
                    }
                    className="flex h-14 items-center border-b border-line text-xl font-medium aria-[current=page]:text-accent-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener"
              className={buttonClass("whatsapp", "lg", "w-full")}
            >
              <WhatsappLogo size={20} weight="fill" aria-hidden />
              Falar no WhatsApp
            </a>
            <p className="text-center text-sm text-muted">
              Ou ligue: {phoneLabel}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
