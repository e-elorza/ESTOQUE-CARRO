"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

/** Floating WhatsApp button. Hidden on vehicle pages, which have their own action bar. */
export function WhatsAppFloat({ href }: { href: string }) {
  const pathname = usePathname();
  if (/^\/estoque\/[^/]+/.test(pathname)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 inline-flex size-14 items-center justify-center rounded-full bg-[#1f8f4e] text-white shadow-float transition-transform duration-200 ease-out-quint hover:scale-105 active:scale-95 motion-reduce:transition-none md:right-6 md:bottom-6"
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden />
    </a>
  );
}
