import { WhatsappLogo } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { formatPhone, whatsappUrl } from "@/lib/format";
import type { DealershipSettings } from "@/lib/types";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function Logo({ settings }: { settings: DealershipSettings }) {
  if (settings.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={settings.logoUrl}
        alt={settings.name}
        width={160}
        height={32}
        className="h-8 w-auto"
        translate="no"
      />
    );
  }
  return (
    <span
      translate="no"
      className="text-[19px] font-semibold tracking-[-0.03em] whitespace-nowrap"
    >
      {settings.name}
    </span>
  );
}

export function SiteHeader({ settings }: { settings: DealershipSettings }) {
  const wa = whatsappUrl(
    settings.whatsapp,
    `Olá! Vim pelo site da ${settings.name} e gostaria de falar com um consultor.`,
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md supports-[not(backdrop-filter:blur(0))]:bg-bg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="-mx-1 rounded-ui px-1"
          aria-label={`${settings.name}, página inicial`}
        >
          <Logo settings={settings} />
        </Link>
        <nav aria-label="Principal" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className={buttonClass("whatsapp", "sm")}
            >
              <WhatsappLogo size={18} weight="fill" aria-hidden />
              Falar no WhatsApp
            </a>
          </div>
          <MobileNav
            whatsappHref={wa}
            phoneLabel={formatPhone(settings.phone)}
          />
        </div>
      </div>
    </header>
  );
}
