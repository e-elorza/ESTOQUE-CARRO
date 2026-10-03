import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import {
  SheetFilters,
  SidebarFilters,
  SortSelect,
} from "@/components/stock/stock-filters";
import { buttonClass } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { brandOptions } from "@/lib/brands";
import {
  getLocations,
  getSettings,
  getStockIndex,
  listStock,
} from "@/lib/data";
import {
  countActiveFilters,
  emptyFilters,
  filtersToQuery,
  parseFilters,
  type Filters,
} from "@/lib/filters";
import {
  bodyTypeLabel,
  formatNumber,
  fuelLabel,
  pluralVehicles,
  transmissionLabel,
  whatsappUrl,
} from "@/lib/format";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const brand = filters.marca
    ? brandOptions(await getStockIndex()).find((b) => b.slug === filters.marca)
    : undefined;
  const model = brand?.models.find((m) => m.slug === filters.modelo);
  const subject = model
    ? `${brand!.name} ${model.name}`
    : brand
      ? brand.name
      : "Carros seminovos";
  const onlyBrandModel =
    countActiveFilters(filters) ===
    (filters.marca ? 1 : 0) + (filters.modelo ? 1 : 0);
  const canonicalQuery = new URLSearchParams();
  if (filters.marca) canonicalQuery.set("marca", filters.marca);
  if (filters.modelo) canonicalQuery.set("modelo", filters.modelo);
  return {
    title: `${subject} à venda`,
    description: `Veja ${subject.toLowerCase() === "carros seminovos" ? "carros seminovos" : subject} à venda com fotos, preço e quilometragem. Filtre por preço, ano, câmbio e mais.`,
    alternates: {
      canonical: `/estoque${canonicalQuery.size ? `?${canonicalQuery}` : ""}`,
    },
    // Deep filter combinations are useful to people, not to search engines.
    robots:
      onlyBrandModel && filters.pagina === 1
        ? undefined
        : { index: false, follow: true },
  };
}

function hrefWith(filters: Filters, patch: Partial<Filters>) {
  const q = filtersToQuery(
    { ...filters, ...patch, pagina: patch.pagina ?? 1 },
    { keepPage: true },
  );
  return `/estoque${q ? `?${q}` : ""}`;
}

export default async function StockPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const [settings, locations, index, result] = await Promise.all([
    getSettings(),
    getLocations(),
    getStockIndex(),
    listStock(filters),
  ]);
  const locationById = new Map(locations.map((l) => [l.id, l]));
  const brands = brandOptions(index);
  const brand = brands.find((b) => b.slug === filters.marca);
  const model = brand?.models.find((m) => m.slug === filters.modelo);
  const locOptions = locations.map((l) => ({ id: l.id, name: l.name }));

  // Removable chips for the active filters
  const chips: { label: string; href: string }[] = [];
  if (brand)
    chips.push({
      label: brand.name,
      href: hrefWith(filters, { marca: undefined, modelo: undefined }),
    });
  if (model)
    chips.push({
      label: model.name,
      href: hrefWith(filters, { modelo: undefined }),
    });
  if (filters.precoMin || filters.precoMax) {
    const min = filters.precoMin
      ? `R$ ${formatNumber(filters.precoMin / 1000)} mil`
      : "";
    const max = filters.precoMax
      ? `R$ ${formatNumber(filters.precoMax / 1000)} mil`
      : "";
    chips.push({
      label:
        min && max
          ? `${min} a ${max}`
          : min
            ? `A partir de ${min}`
            : `Até ${max}`,
      href: hrefWith(filters, { precoMin: undefined, precoMax: undefined }),
    });
  }
  if (filters.anoMin || filters.anoMax) {
    chips.push({
      label:
        filters.anoMin && filters.anoMax
          ? `${filters.anoMin} a ${filters.anoMax}`
          : filters.anoMin
            ? `A partir de ${filters.anoMin}`
            : `Até ${filters.anoMax}`,
      href: hrefWith(filters, { anoMin: undefined, anoMax: undefined }),
    });
  }
  if (filters.kmMax)
    chips.push({
      label: `Até ${formatNumber(filters.kmMax)} km`,
      href: hrefWith(filters, { kmMax: undefined }),
    });
  const listChip = <
    K extends
      "cambio" | "combustivel" | "carroceria" | "cor" | "unidade" | "opcionais",
  >(
    key: K,
    label: (v: string) => string,
  ) => {
    for (const v of filters[key] as string[]) {
      chips.push({
        label: label(v),
        href: hrefWith(filters, {
          [key]: (filters[key] as string[]).filter((x) => x !== v),
        } as Partial<Filters>),
      });
    }
  };
  listChip(
    "carroceria",
    (v) => bodyTypeLabel[v as keyof typeof bodyTypeLabel] ?? v,
  );
  listChip(
    "cambio",
    (v) => transmissionLabel[v as keyof typeof transmissionLabel] ?? v,
  );
  listChip("combustivel", (v) => fuelLabel[v as keyof typeof fuelLabel] ?? v);
  listChip("unidade", (v) => `Unidade ${locationById.get(v)?.name ?? v}`);
  listChip("cor", (v) => v.charAt(0).toUpperCase() + v.slice(1));
  listChip("opcionais", (v) => v);

  const heading = model
    ? `${brand!.name} ${model.name}`
    : brand
      ? brand.name
      : "Estoque";

  return (
    <div className="container-page pt-8 pb-8 md:pt-10">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
        <ol className="flex gap-2">
          <li>
            <Link href="/" className="hover:text-fg">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-fg">
            Estoque
          </li>
        </ol>
      </nav>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
          {heading}
        </h1>
        <p className="text-muted" aria-live="polite">
          {result.total === 0
            ? "Nenhum veículo encontrado."
            : `Encontramos ${pluralVehicles(result.total)}.`}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:gap-14">
        <aside aria-label="Filtros" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-2 pb-6">
            <SidebarFilters
              index={index}
              locations={locOptions}
              filters={filters}
            />
          </div>
        </aside>

        <section aria-label="Resultados" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SheetFilters
              index={index}
              locations={locOptions}
              filters={filters}
            />
            <div className="ml-auto">
              <SortSelect filters={filters} />
            </div>
          </div>

          {chips.length > 0 && (
            <ul
              className="mb-6 flex flex-wrap gap-2"
              aria-label="Filtros aplicados"
            >
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    scroll={false}
                    className="inline-flex h-9 items-center gap-1.5 rounded-ui bg-surface-2 pr-2 pl-3 text-sm hover:bg-[color-mix(in_oklab,var(--surface-2)_80%,var(--fg))]"
                    aria-label={`Remover filtro ${c.label}`}
                  >
                    {c.label}
                    <X size={14} aria-hidden />
                  </Link>
                </li>
              ))}
              {chips.length > 1 && (
                <li>
                  <Link
                    href={hrefWith(emptyFilters, { ordem: filters.ordem })}
                    scroll={false}
                    className="inline-flex h-9 items-center px-2 text-sm text-accent-text hover:underline"
                  >
                    Limpar tudo
                  </Link>
                </li>
              )}
            </ul>
          )}

          {result.total === 0 ? (
            <div className="flex flex-col items-start gap-5 rounded-ui border border-line bg-surface p-8 md:p-12">
              <MagnifyingGlass size={32} className="text-muted" aria-hidden />
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold">
                  Nenhum veículo encontrado
                </h2>
                <p className="max-w-[52ch] leading-relaxed text-muted">
                  Tente remover alguns filtros. Se procura um carro específico,
                  nossos consultores podem avisar quando ele chegar.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/estoque" className={buttonClass("secondary")}>
                  Limpar filtros
                </Link>
                <a
                  href={whatsappUrl(
                    settings.whatsapp,
                    "Olá! Não encontrei no site o carro que procuro. Vocês podem me avisar quando chegar?",
                  )}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass("primary")}
                >
                  <WhatsappLogo size={18} weight="fill" aria-hidden />
                  Pedir para um consultor
                </a>
              </div>
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((v, i) => (
                <li key={v.id}>
                  <VehicleCard
                    vehicle={v}
                    location={locationById.get(v.locationId ?? "")}
                    priority={i < 3}
                    headingLevel="h2"
                  />
                </li>
              ))}
            </ul>
          )}

          {result.pageCount > 1 && (
            <nav
              aria-label="Paginação"
              className="mt-14 flex items-center justify-center gap-1"
            >
              {result.page > 1 && (
                <Link
                  href={hrefWith(filters, { pagina: result.page - 1 })}
                  className={buttonClass("ghost", "md")}
                  aria-label="Página anterior"
                >
                  <CaretLeft size={16} aria-hidden /> Anterior
                </Link>
              )}
              {Array.from({ length: result.pageCount }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={hrefWith(filters, { pagina: p })}
                    aria-current={p === result.page ? "page" : undefined}
                    className={`tabular inline-flex size-11 items-center justify-center rounded-ui text-[15px] ${p === result.page ? "bg-fg text-bg" : "hover:bg-surface-2"}`}
                  >
                    {p}
                  </Link>
                ),
              )}
              {result.page < result.pageCount && (
                <Link
                  href={hrefWith(filters, { pagina: result.page + 1 })}
                  className={buttonClass("ghost", "md")}
                  aria-label="Próxima página"
                >
                  Próxima <CaretRight size={16} aria-hidden />
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
