import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  Phone,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { buttonClass } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { VehiclePhoto } from "@/components/vehicle/vehicle-photo";
import { brandOptions } from "@/lib/brands";
import {
  getFeatured,
  getLocations,
  getRecent,
  getSettings,
  getStockIndex,
} from "@/lib/data";
import { priceRanges } from "@/lib/filters";
import {
  bodyTypeLabel,
  formatPhone,
  pluralVehicles,
  telHref,
} from "@/lib/format";
import type { BodyType } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, locations, index, featured] = await Promise.all([
    getSettings(),
    getLocations(),
    getStockIndex(),
    getFeatured(5),
  ]);
  const recent = await getRecent(
    8,
    featured.map((v) => v.id),
  );
  const locationById = new Map(locations.map((l) => [l.id, l]));
  const heroVehicle = featured[0];

  const bodyCounts = (["suv", "seda", "hatch", "picape"] as BodyType[])
    .map((b) => ({
      type: b,
      count: index.filter((e) => e.bodyType === b).length,
    }))
    .filter((b) => b.count > 0);
  const rangeCounts = priceRanges.map((r) => ({
    ...r,
    count: index.filter(
      (e) =>
        (!("min" in r) || e.price >= r.min) &&
        (!("max" in r) || e.price <= r.max),
    ).length,
  }));

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-8 pt-8 pb-14 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pt-16 lg:pb-20">
        <div className="reveal-in flex min-w-0 flex-col gap-6">
          <h1 className="text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-5xl lg:text-[3.5rem]">
            Seminovos selecionados, prontos para você conhecer.
          </h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-muted">
            {pluralVehicles(index.length)} revisados em {locations.length}{" "}
            unidades em São Paulo, de populares a premium.
          </p>
          <HeroSearch brands={brandOptions(index)} />
        </div>
        {heroVehicle && (
          <Link
            href={`/estoque/${heroVehicle.slug}`}
            className="reveal-in-late group relative block aspect-[4/3] overflow-hidden rounded-ui lg:aspect-[5/4]"
            aria-label={`Ver ${heroVehicle.brand} ${heroVehicle.model} ${heroVehicle.version}`}
          >
            <VehiclePhoto
              photo={heroVehicle.photos[0]}
              label={heroVehicle.model}
              size="full"
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="transition-transform duration-700 ease-out-quint group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          </Link>
        )}
      </section>

      {/* Destaques */}
      {featured.length > 0 && (
        <section
          aria-labelledby="destaques"
          className="container-page py-12 md:py-16"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="destaques" className="text-3xl font-semibold md:text-4xl">
              Destaques da semana
            </h2>
            <Link
              href="/estoque?ordem=destaques"
              className="hidden items-center gap-1.5 text-[15px] font-medium text-accent-text hover:underline sm:inline-flex"
            >
              Ver todos <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div
            className={`grid gap-x-6 gap-y-10 ${featured.length > 2 ? "lg:grid-cols-2" : "md:grid-cols-2"}`}
          >
            {featured.length > 2 ? (
              <>
                <VehicleCard
                  vehicle={featured[0]}
                  location={locationById.get(featured[0].locationId ?? "")}
                  size="large"
                />
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                  {featured.slice(1).map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      location={locationById.get(v.locationId ?? "")}
                    />
                  ))}
                </div>
              </>
            ) : (
              featured.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  location={locationById.get(v.locationId ?? "")}
                  size="large"
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Categorias */}
      <section
        aria-labelledby="categorias"
        className="border-y border-line bg-surface py-12 md:py-16"
      >
        <div className="container-page flex flex-col gap-8">
          <h2 id="categorias" className="text-3xl font-semibold md:text-4xl">
            Navegue por categoria
          </h2>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-ui border border-line bg-line md:grid-cols-4">
            {bodyCounts.map((b) => (
              <li key={b.type}>
                <Link
                  href={`/estoque?carroceria=${b.type}`}
                  className="group flex h-full flex-col justify-between gap-8 bg-surface p-5 transition-colors hover:bg-surface-2 md:p-6"
                >
                  <span className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                    {bodyTypeLabel[b.type]}
                  </span>
                  <span className="flex items-center justify-between text-sm text-muted">
                    {pluralVehicles(b.count)}
                    <ArrowUpRight
                      size={18}
                      className="transition-transform duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm text-muted">Por faixa de preço</h3>
            <ul className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {rangeCounts.map((r) => {
                const q = new URLSearchParams();
                if ("min" in r) q.set("preco_min", String(r.min));
                if ("max" in r) q.set("preco_max", String(r.max));
                return (
                  <li key={r.label} className="snap-start">
                    <Link
                      href={`/estoque?${q}`}
                      className="inline-flex h-11 items-center gap-2 rounded-ui border border-line-strong px-4 text-[15px] whitespace-nowrap transition-colors hover:border-fg"
                    >
                      {r.label}
                      <span className="text-sm text-muted tabular">
                        {r.count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Recém-chegados */}
      {recent.length > 0 && (
        <section aria-labelledby="recentes" className="py-12 md:py-16">
          <div className="container-page mb-8 flex items-end justify-between gap-4">
            <h2 id="recentes" className="text-3xl font-semibold md:text-4xl">
              Recém-chegados
            </h2>
            <Link
              href="/estoque"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-text hover:underline"
            >
              Ver todo o estoque <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="container-page">
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 md:-mx-8 md:scroll-px-8 md:px-8">
              {recent.map((v) => (
                <li
                  key={v.id}
                  className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-3.75rem)/4)]"
                >
                  <VehicleCard
                    vehicle={v}
                    location={locationById.get(v.locationId ?? "")}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Financiamento + Venda seu carro */}
      <section
        aria-label="Financiamento e troca"
        className="container-page grid gap-4 py-12 md:grid-cols-2 md:py-16"
      >
        <div className="flex flex-col justify-between gap-10 rounded-ui bg-fg p-7 text-bg md:p-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold">
              Financie seu próximo carro
            </h2>
            <p className="max-w-[40ch] leading-relaxed opacity-75">
              Envie seus dados uma vez. Levamos sua proposta a vários bancos e
              um consultor retorna com as condições.
            </p>
          </div>
          <Link
            href="/financiamento"
            className={buttonClass("primary", "lg", "self-start")}
          >
            Solicitar financiamento
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-10 rounded-ui border border-line bg-surface-2 p-7 md:p-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold">Use seu carro na troca</h2>
            <p className="max-w-[40ch] leading-relaxed text-muted">
              Conte qual é o seu carro e receba uma avaliação. O valor entra
              como parte do pagamento.
            </p>
          </div>
          <Link
            href="/venda-seu-carro"
            className={buttonClass("secondary", "lg", "self-start")}
          >
            Avaliar meu carro
          </Link>
        </div>
      </section>

      {/* Por que comprar aqui */}
      {settings.reasons.length > 0 && (
        <section
          aria-labelledby="por-que"
          className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div className="flex flex-col gap-3">
            <h2 id="por-que" className="text-3xl font-semibold md:text-4xl">
              Por que comprar na {settings.name}
            </h2>
            {settings.yearFounded && (
              <p className="text-muted">
                Vendendo seminovos em São Paulo desde {settings.yearFounded}.
              </p>
            )}
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {settings.reasons.map((r) => (
              <li
                key={r.title}
                className="flex flex-col gap-2 border-t border-line-strong pt-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.01em]">
                  {r.title}
                </h3>
                <p className="leading-relaxed text-muted">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unidades */}
      <section
        aria-labelledby="unidades"
        className="container-page py-12 md:py-16"
      >
        <h2 id="unidades" className="mb-8 text-3xl font-semibold md:text-4xl">
          Nossas unidades
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {locations.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-4 rounded-ui border border-line bg-surface p-6"
            >
              <h3 className="text-xl font-semibold">{l.name}</h3>
              <p className="flex gap-2.5 text-[15px] leading-relaxed">
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
              <div className="flex gap-2.5 text-[15px]">
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
                  className="flex items-center gap-2.5 text-[15px] hover:underline"
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
                  className="mt-auto inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-text hover:underline"
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
