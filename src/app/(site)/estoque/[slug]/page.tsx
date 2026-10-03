import {
  ArrowsLeftRight,
  CalendarBlank,
  Calculator,
  Clock,
  Handshake,
  MapPin,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Gallery } from "@/components/vehicle/gallery";
import { VehicleCard, vehicleBadges } from "@/components/vehicle/vehicle-card";
import { WhatsAppLink } from "@/components/vehicle/whatsapp-link";
import {
  getLocations,
  getPublicSlugs,
  getSettings,
  getSimilar,
  getVehicleBySlug,
} from "@/lib/data";
import { groupEquipment } from "@/lib/equipment";
import {
  bodyTypeLabel,
  formatKm,
  formatPhone,
  formatPrice,
  formatYears,
  fuelLabel,
  slugify,
  telHref,
  transmissionLabel,
  vehicleTitle,
  vehicleWhatsappMessage,
  whatsappUrl,
} from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublicSlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getVehicleBySlug((await params).slug);
  if (!v) return { title: "Veículo não encontrado" };
  const title = `${vehicleTitle(v)} ${formatYears(v)}`;
  const description = `${title}, ${formatKm(v.mileageKm)}, ${transmissionLabel[v.transmission].toLowerCase()}, ${fuelLabel[v.fuel].toLowerCase()}. ${
    v.status === "vendido"
      ? "Veículo vendido."
      : `Por ${formatPrice(v.promoPrice ?? v.price)}.`
  }`;
  return {
    title,
    description,
    alternates: { canonical: `/estoque/${v.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: v.photos[0]
        ? [
            {
              url: v.photos[0].full,
              width: v.photos[0].width,
              height: v.photos[0].height,
            },
          ]
        : undefined,
    },
  };
}

function jsonLd(v: Vehicle, url: string, dealerName: string) {
  const availability = {
    disponivel: "https://schema.org/InStock",
    reservado: "https://schema.org/LimitedAvailability",
    vendido: "https://schema.org/SoldOut",
    rascunho: "https://schema.org/Discontinued",
  }[v.status];
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicleTitle(v)} ${formatYears(v)}`,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleConfiguration: v.version,
    vehicleModelDate: String(v.yearModel),
    productionDate: String(v.yearManufacture),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: v.mileageKm,
      unitCode: "KMT",
    },
    fuelType: fuelLabel[v.fuel],
    vehicleTransmission: transmissionLabel[v.transmission],
    bodyType: bodyTypeLabel[v.bodyType],
    color: v.color,
    numberOfDoors: v.doors,
    itemCondition: "https://schema.org/UsedCondition",
    sku: v.code,
    description: v.description,
    image: v.photos.map((p) => p.full),
    url,
    offers: {
      "@type": "Offer",
      price: v.promoPrice ?? v.price,
      priceCurrency: "BRL",
      availability,
      itemCondition: "https://schema.org/UsedCondition",
      url,
      seller: { "@type": "AutoDealer", name: dealerName },
    },
  };
}

export default async function VehiclePage({ params }: Props) {
  const v = await getVehicleBySlug((await params).slug);
  if (!v) notFound();
  const [settings, locations, similar] = await Promise.all([
    getSettings(),
    getLocations(),
    getSimilar(v),
  ]);
  const location = locations.find((l) => l.id === v.locationId);
  const locationById = new Map(locations.map((l) => [l.id, l]));
  const url = `${settings.siteUrl}/estoque/${v.slug}`;
  const wa = whatsappUrl(settings.whatsapp, vehicleWhatsappMessage(v, url));
  const sold = v.status === "vendido";
  const reserved = v.status === "reservado";
  const title = vehicleTitle(v);
  const badges = vehicleBadges(v).filter((b) => b.label !== "Reservado");
  const query = `veiculo=${encodeURIComponent(v.code)}`;

  const specs: [string, string][] = [
    ["Ano de fabricação", String(v.yearManufacture)],
    ["Ano do modelo", String(v.yearModel)],
    ["Quilometragem", formatKm(v.mileageKm)],
    ["Câmbio", transmissionLabel[v.transmission]],
    ["Combustível", fuelLabel[v.fuel]],
    ...(v.engine ? [["Motor", v.engine] as [string, string]] : []),
    ...(v.powerCv ? [["Potência", `${v.powerCv} cv`] as [string, string]] : []),
    ["Carroceria", bodyTypeLabel[v.bodyType]],
    ["Cor", v.color],
    ["Portas", String(v.doors)],
    ...(v.plateFinal !== null
      ? [["Final da placa", String(v.plateFinal)] as [string, string]]
      : []),
    ["Código", v.code],
  ];

  return (
    <div className="pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(v, url, settings.name)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <div className="container-page pt-6 md:pt-8">
        <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/" className="hover:text-fg">
                Início
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/estoque" className="hover:text-fg">
                Estoque
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/estoque?marca=${slugify(v.brand)}`}
                className="hover:text-fg"
              >
                {v.brand}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-fg">
              {v.model}
            </li>
          </ol>
        </nav>

        {sold && (
          <div
            role="status"
            className="mb-4 flex flex-col gap-3 rounded-ui border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              <strong className="font-semibold">
                Este veículo já foi vendido.
              </strong>{" "}
              <span className="text-muted">
                Veja opções parecidas abaixo ou peça para um consultor avisar
                quando chegar outro.
              </span>
            </p>
            <a
              href="#similares"
              className={buttonClass("secondary", "md", "shrink-0")}
            >
              Ver parecidos
            </a>
          </div>
        )}

        <Gallery photos={v.photos} label={v.model} />

        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_26rem]">
          {/* Summary + actions (first on mobile, sticky on desktop) */}
          <aside className="lg:order-2">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <div className="flex flex-col gap-2">
                {(badges.length > 0 || reserved) && (
                  <div className="flex flex-wrap gap-1.5">
                    {reserved && <Badge tone="warning">Reservado</Badge>}
                    {badges.map((b) => (
                      <Badge key={b.label} tone={b.tone}>
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-muted">{v.brand}</p>
                <h1 className="text-3xl leading-tight font-semibold tracking-[-0.03em] md:text-[2.5rem]">
                  {v.model}{" "}
                  <span className="font-normal text-muted">{v.version}</span>
                </h1>
              </div>

              <dl className="tabular grid grid-cols-2 gap-px overflow-hidden rounded-ui border border-line bg-line">
                {[
                  ["Ano", formatYears(v)],
                  ["Quilometragem", formatKm(v.mileageKm)],
                  ["Câmbio", transmissionLabel[v.transmission]],
                  ["Combustível", fuelLabel[v.fuel]],
                ].map(([k, val]) => (
                  <div
                    key={k}
                    className="flex flex-col gap-0.5 bg-surface px-4 py-3"
                  >
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="font-medium">{val}</dd>
                  </div>
                ))}
              </dl>

              {!sold && (
                <div className="flex flex-col gap-1">
                  {v.promoPrice && (
                    <p className="text-sm text-muted">
                      De <s className="tabular">{formatPrice(v.price)}</s> por
                    </p>
                  )}
                  <p className="tabular text-4xl font-semibold tracking-[-0.03em]">
                    {formatPrice(v.promoPrice ?? v.price)}
                  </p>
                </div>
              )}

              {reserved && (
                <p
                  role="status"
                  className="rounded-ui bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] p-4 text-[15px] leading-relaxed"
                >
                  Este carro está reservado para outro cliente. Fale com um
                  consultor para entrar na lista de espera.
                </p>
              )}

              {!sold && (
                <div className="flex flex-col gap-3">
                  <WhatsAppLink
                    href={wa}
                    vehicleId={v.id}
                    className={buttonClass("whatsapp", "lg", "w-full")}
                  >
                    <WhatsappLogo size={20} weight="fill" aria-hidden />
                    Falar no WhatsApp
                  </WhatsAppLink>
                  <Link
                    href={`/financiamento?${query}`}
                    className={buttonClass("secondary", "lg", "w-full")}
                  >
                    <Calculator size={20} aria-hidden />
                    Simular financiamento
                  </Link>
                  <ul className="mt-1 flex flex-col">
                    {[
                      {
                        href: `/contato?assunto=proposta&${query}`,
                        icon: Handshake,
                        label: "Enviar proposta",
                      },
                      {
                        href: `/venda-seu-carro?${query}`,
                        icon: ArrowsLeftRight,
                        label: "Tenho carro na troca",
                      },
                      {
                        href: `/contato?assunto=visita&${query}`,
                        icon: CalendarBlank,
                        label: "Agendar visita",
                      },
                    ].map((a) => (
                      <li key={a.label}>
                        <Link
                          href={a.href}
                          className="flex h-11 items-center gap-3 border-b border-line text-[15px] hover:text-accent-text"
                        >
                          <a.icon
                            size={20}
                            className="text-muted"
                            aria-hidden
                          />
                          {a.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {location && (
                <p className="flex items-start gap-2.5 text-[15px]">
                  <MapPin
                    size={20}
                    className="mt-0.5 shrink-0 text-muted"
                    aria-hidden
                  />
                  <span>
                    {sold ? "Estava na" : "Disponível na"} unidade{" "}
                    <strong className="font-medium">{location.name}</strong>
                    <br />
                    <span className="text-muted">
                      {location.street}, {location.city}/{location.state}
                    </span>
                  </span>
                </p>
              )}
            </div>
          </aside>

          {/* Details */}
          <div className="flex min-w-0 flex-col gap-12 lg:order-1">
            <section aria-labelledby="especificacoes">
              <h2 id="especificacoes" className="mb-5 text-2xl font-semibold">
                Especificações
              </h2>
              <dl className="tabular grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
                {specs.map(([k, val]) => (
                  <div key={k} className="flex min-w-0 flex-col gap-1">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="text-[17px] font-medium break-words">
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {v.equipment.length > 0 && (
              <section aria-labelledby="equipamentos">
                <h2 id="equipamentos" className="mb-5 text-2xl font-semibold">
                  Equipamentos
                </h2>
                <div className="grid gap-8 sm:grid-cols-2">
                  {groupEquipment(v.equipment).map((g) => (
                    <div key={g.category} className="flex flex-col gap-3">
                      <h3 className="text-sm font-medium text-muted">
                        {g.category}
                      </h3>
                      <ul className="flex flex-col gap-2 text-[15px]">
                        {g.items.map((item) => (
                          <li key={item} className="flex gap-2.5">
                            <span
                              aria-hidden
                              className="mt-[0.6em] size-1 shrink-0 rounded-full bg-fg"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {v.description && (
              <section aria-labelledby="descricao">
                <h2 id="descricao" className="mb-4 text-2xl font-semibold">
                  Sobre este carro
                </h2>
                <p className="max-w-[68ch] text-[17px] leading-relaxed whitespace-pre-line text-muted">
                  {v.description}
                </p>
              </section>
            )}

            {location && (
              <section
                aria-labelledby="unidade"
                className="rounded-ui border border-line bg-surface p-6"
              >
                <h2 id="unidade" className="mb-4 text-xl font-semibold">
                  Unidade {location.name}
                </h2>
                <div className="grid gap-4 text-[15px] sm:grid-cols-2">
                  <p className="flex gap-2.5">
                    <MapPin
                      size={20}
                      className="mt-0.5 shrink-0 text-muted"
                      aria-hidden
                    />
                    <span>
                      {location.street}, {location.district}
                      <br />
                      {location.city}/{location.state}, CEP {location.cep}
                      {location.mapsUrl && (
                        <>
                          <br />
                          <a
                            href={location.mapsUrl}
                            target="_blank"
                            rel="noopener"
                            className="font-medium text-accent-text hover:underline"
                          >
                            Ver no mapa
                          </a>
                        </>
                      )}
                    </span>
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2.5">
                      <Clock
                        size={20}
                        className="mt-0.5 shrink-0 text-muted"
                        aria-hidden
                      />
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3">
                        {location.hours.map((h) => (
                          <div key={h.days} className="contents">
                            <dt className="text-muted">{h.days}</dt>
                            <dd>{h.hours}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {location.phone && (
                      <a
                        href={telHref(location.phone)}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <Phone size={20} className="text-muted" aria-hidden />
                        {formatPhone(location.phone)}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section
          id="similares"
          aria-labelledby="similares-titulo"
          className="container-page mt-20"
        >
          <h2 id="similares-titulo" className="mb-8 text-3xl font-semibold">
            {sold ? "Carros parecidos disponíveis" : "Você também pode gostar"}
          </h2>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((s) => (
              <li key={s.id}>
                <VehicleCard
                  vehicle={s}
                  location={locationById.get(s.locationId ?? "")}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center gap-2">
          {sold ? (
            <a
              href="#similares"
              className={buttonClass("primary", "lg", "flex-1")}
            >
              Ver carros parecidos
            </a>
          ) : (
            <>
              <WhatsAppLink
                href={wa}
                vehicleId={v.id}
                className={buttonClass("whatsapp", "lg", "flex-1")}
              >
                <WhatsappLogo size={20} weight="fill" aria-hidden />
                WhatsApp
              </WhatsAppLink>
              <a
                href={telHref(location?.phone ?? settings.phone)}
                className={buttonClass("secondary", "lg", "px-4")}
                aria-label="Ligar"
              >
                <Phone size={20} aria-hidden />
              </a>
              <Link
                href={`/financiamento?${query}`}
                className={buttonClass("secondary", "lg", "px-4")}
              >
                Simular
              </Link>
            </>
          )}
        </div>
        <span className="sr-only">
          {title} por {formatPrice(v.promoPrice ?? v.price)}
        </span>
      </div>
    </div>
  );
}
