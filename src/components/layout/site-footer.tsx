import { FacebookLogo, InstagramLogo } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { formatPhone, telHref, whatsappUrl } from "@/lib/format";
import type { DealershipSettings, Location } from "@/lib/types";
import { Logo } from "./site-header";
import { navItems } from "@/lib/nav";

export function SiteFooter({
  settings,
  locations,
}: {
  settings: DealershipSettings;
  locations: Location[];
}) {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr] lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Logo settings={settings} />
          <p className="max-w-[36ch] text-sm leading-relaxed text-muted">
            {settings.about}
          </p>
          <div className="flex gap-1">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                className="inline-flex size-10 items-center justify-center rounded-ui text-muted hover:bg-surface-2 hover:text-fg"
              >
                <InstagramLogo size={22} />
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
                className="inline-flex size-10 items-center justify-center rounded-ui text-muted hover:bg-surface-2 hover:text-fg"
              >
                <FacebookLogo size={22} />
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm">
          <h2 className="font-medium">Navegação</h2>
          <ul className="flex flex-col gap-2 text-muted">
            {navItems.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-fg">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/politica-de-privacidade" className="hover:text-fg">
                Política de Privacidade
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex flex-col gap-3 text-sm">
          <h2 className="font-medium">Atendimento</h2>
          <ul className="flex flex-col gap-2 text-muted">
            <li>
              <a
                href={whatsappUrl(settings.whatsapp)}
                target="_blank"
                rel="noopener"
                className="hover:text-fg"
              >
                WhatsApp {formatPhone(settings.whatsapp)}
              </a>
            </li>
            <li>
              <a href={telHref(settings.phone)} className="hover:text-fg">
                Telefone {formatPhone(settings.phone)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="break-all hover:text-fg"
              >
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 text-sm md:col-span-3 lg:col-span-1">
          <h2 className="font-medium">Unidades</h2>
          <ul className="grid gap-3 text-muted sm:grid-cols-3 lg:grid-cols-1">
            {locations.map((l) => (
              <li key={l.id}>
                <span className="text-fg">{l.name}</span>
                <br />
                {l.street}, {l.city}/{l.state}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. Todos os direitos
            reservados.
          </p>
          <p>
            Site de demonstração: veículos, preços e contatos são fictícios.
          </p>
        </div>
      </div>
    </footer>
  );
}
