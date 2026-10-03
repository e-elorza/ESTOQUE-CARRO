import {
  ArrowUpRight,
  Clock,
  Envelope,
  MapPin,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { FormPage } from "@/components/forms/form-page";
import { getLocations, getSettings, getVehicleByCode } from "@/lib/data";
import {
  formatPhone,
  telHref,
  vehicleWhatsappMessage,
  whatsappUrl,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Contato e unidades",
  description:
    "Endereços, horários e telefones das unidades. Envie uma proposta, agende uma visita ou fale com um consultor.",
  alternates: { canonical: "/contato" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  const code = typeof sp.veiculo === "string" ? sp.veiculo : undefined;
  const [settings, locations, vehicle] = await Promise.all([
    getSettings(),
    getLocations(),
    getVehicleByCode(code),
  ]);
  const available = vehicle && vehicle.status !== "vendido" ? vehicle : null;
  const subject =
    sp.assunto === "proposta" || sp.assunto === "visita"
      ? sp.assunto
      : "contato";
  const wa = available
    ? whatsappUrl(
        settings.whatsapp,
        vehicleWhatsappMessage(
          available,
          `${settings.siteUrl}/estoque/${available.slug}`,
        ),
      )
    : whatsappUrl(settings.whatsapp, `Olá! Vim pelo site da ${settings.name}.`);

  return (
    <>
      <FormPage
        title="Fale com a gente"
        intro="Mande sua dúvida, faça uma proposta ou agende uma visita. Se preferir, chame direto no WhatsApp."
        steps={[
          "Você envia a mensagem.",
          "Um consultor responde pelo WhatsApp ou telefone em horário comercial.",
        ]}
        dataNote="Usamos seu nome e telefone apenas para responder a esta mensagem."
        vehicle={available}
      >
        <ContactForm
          initialSubject={subject}
          vehicleCode={available?.code}
          locations={locations.map((l) => ({ id: l.id, name: l.name }))}
          defaultLocation={available?.locationId ?? undefined}
          whatsappHref={wa}
        />
      </FormPage>

      <section
        aria-labelledby="atendimento"
        className="container-page mt-20 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] lg:gap-16"
      >
        <div className="flex flex-col gap-5">
          <h2 id="atendimento" className="text-3xl font-semibold">
            Atendimento
          </h2>
          <ul className="flex flex-col gap-4 text-[15px]">
            <li>
              <a
                href={whatsappUrl(settings.whatsapp)}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 hover:underline"
              >
                <WhatsappLogo size={22} className="text-muted" aria-hidden />
                {formatPhone(settings.whatsapp)}
              </a>
            </li>
            <li>
              <a
                href={telHref(settings.phone)}
                className="flex items-center gap-3 hover:underline"
              >
                <Phone size={22} className="text-muted" aria-hidden />
                {formatPhone(settings.phone)}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-3 break-all hover:underline"
              >
                <Envelope
                  size={22}
                  className="shrink-0 text-muted"
                  aria-hidden
                />
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-3 border-t border-line-strong pt-5 text-[15px]"
            >
              <h3 className="text-xl font-semibold">{l.name}</h3>
              <p className="flex gap-2.5 leading-relaxed">
                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-muted"
                  aria-hidden
                />
                <span>
                  {l.street}, {l.district}
                  <br />
                  {l.city}/{l.state}, CEP {l.cep}
                </span>
              </p>
              <div className="flex gap-2.5">
                <Clock
                  size={20}
                  className="mt-0.5 shrink-0 text-muted"
                  aria-hidden
                />
                <dl className="grid grid-cols-[auto_1fr] gap-x-3">
                  {l.hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt className="text-muted">{h.days}</dt>
                      <dd>{h.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {l.phone && (
                <a
                  href={telHref(l.phone)}
                  className="flex items-center gap-2.5 hover:underline"
                >
                  <Phone size={20} className="text-muted" aria-hidden />
                  {formatPhone(l.phone)}
                </a>
              )}
              {l.mapsUrl && (
                <a
                  href={l.mapsUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 font-medium text-accent-text hover:underline"
                >
                  Ver no mapa <ArrowUpRight size={16} aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
