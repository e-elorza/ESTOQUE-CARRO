"use client";

import { CaretDown } from "@phosphor-icons/react";
import { selectClass } from "@/components/ui/field";
import { brandOptions } from "@/lib/brands";
import { filterableEquipment } from "@/lib/equipment";
import { baseColor, matches, type Filters } from "@/lib/filters";
import {
  bodyTypeLabel,
  formatNumber,
  fuelLabel,
  slugify,
  transmissionLabel,
} from "@/lib/format";
import type { VehicleIndexEntry } from "@/lib/types";

type Props = {
  index: VehicleIndexEntry[];
  locations: { id: string; name: string }[];
  value: Filters;
  onChange: (next: Filters) => void;
  idPrefix: string;
};

const priceSteps = [
  50000, 60000, 80000, 100000, 120000, 150000, 200000, 250000, 300000, 400000,
  500000,
];
const kmSteps = [10000, 20000, 30000, 50000, 80000, 100000];

type ListKey =
  "cambio" | "combustivel" | "carroceria" | "cor" | "unidade" | "opcionais";

/** Count matches for each option, ignoring the group's own selection (faceted counts). */
function facet(
  index: VehicleIndexEntry[],
  value: Filters,
  key: ListKey,
  get: (e: VehicleIndexEntry) => string[],
) {
  const base = { ...value, [key]: [] };
  const counts = new Map<string, number>();
  for (const e of index) {
    if (!matches(e, base)) continue;
    for (const option of get(e))
      counts.set(option, (counts.get(option) ?? 0) + 1);
  }
  return counts;
}

export function FilterPanel({
  index,
  locations,
  value,
  onChange,
  idPrefix,
}: Props) {
  const brands = brandOptions(index);
  const models = brands.find((b) => b.slug === value.marca)?.models ?? [];
  const years = [...new Set(index.map((e) => e.yearModel))].sort(
    (a, b) => b - a,
  );
  const set = (patch: Partial<Filters>) =>
    onChange({ ...value, ...patch, pagina: 1 });
  const id = (name: string) => `${idPrefix}-${name}`;

  const toggle = (key: ListKey, option: string) => {
    const list = value[key] as string[];
    set({
      [key]: list.includes(option)
        ? list.filter((o) => o !== option)
        : [...list, option],
    } as Partial<Filters>);
  };

  const groups: {
    key: ListKey;
    title: string;
    options: { value: string; label: string }[];
    counts: Map<string, number>;
  }[] = [
    {
      key: "carroceria",
      title: "Carroceria",
      counts: facet(index, value, "carroceria", (e) => [e.bodyType]),
      options: Object.entries(bodyTypeLabel).map(([v, label]) => ({
        value: v,
        label,
      })),
    },
    {
      key: "cambio",
      title: "Câmbio",
      counts: facet(index, value, "cambio", (e) => [e.transmission]),
      options: Object.entries(transmissionLabel).map(([v, label]) => ({
        value: v,
        label,
      })),
    },
    {
      key: "combustivel",
      title: "Combustível",
      counts: facet(index, value, "combustivel", (e) => [e.fuel]),
      options: Object.entries(fuelLabel).map(([v, label]) => ({
        value: v,
        label,
      })),
    },
    {
      key: "unidade",
      title: "Unidade",
      counts: facet(index, value, "unidade", (e) =>
        e.locationId ? [e.locationId] : [],
      ),
      options: locations.map((l) => ({ value: l.id, label: l.name })),
    },
  ];

  const colors = [...new Set(index.map((e) => baseColor(e.color)))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
  const extraGroups: typeof groups = [
    {
      key: "cor",
      title: "Cor",
      counts: facet(index, value, "cor", (e) => [slugify(baseColor(e.color))]),
      options: colors.map((c) => ({ value: slugify(c), label: c })),
    },
    {
      key: "opcionais",
      title: "Opcionais",
      counts: facet(index, value, "opcionais", (e) => e.equipment),
      options: filterableEquipment.map((o) => ({ value: o, label: o })),
    },
  ];
  const extrasActive = value.cor.length + value.opcionais.length;

  const renderGroup = (g: (typeof groups)[number]) => {
    const options = g.options.filter(
      (o) =>
        (g.counts.get(o.value) ?? 0) > 0 ||
        (value[g.key] as string[]).includes(o.value),
    );
    if (options.length === 0) return null;
    return (
      <div key={g.key} className="border-t border-line pt-5">
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-2 text-sm font-medium">{g.title}</legend>
          {options.map((o) => {
            const checked = (value[g.key] as string[]).includes(o.value);
            return (
              <label
                key={o.value}
                className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(g.key, o.value)}
                  className="size-[18px] shrink-0 rounded-[3px] accent-[var(--accent)]"
                />
                <span className="flex-1">{o.label}</span>
                <span className="tabular text-sm text-muted">
                  {g.counts.get(o.value) ?? 0}
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("marca")} className="text-sm font-medium">
            Marca
          </label>
          <select
            id={id("marca")}
            value={value.marca ?? ""}
            onChange={(e) =>
              set({ marca: e.target.value || undefined, modelo: undefined })
            }
            className={`${selectClass} h-11`}
          >
            <option value="">Todas as marcas</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name} ({b.count})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("modelo")} className="text-sm font-medium">
            Modelo
          </label>
          <select
            id={id("modelo")}
            value={value.modelo ?? ""}
            onChange={(e) => set({ modelo: e.target.value || undefined })}
            disabled={!value.marca}
            className={`${selectClass} h-11`}
          >
            <option value="">
              {value.marca ? "Todos os modelos" : "Escolha a marca"}
            </option>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name} ({m.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Preço</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor={id("preco-min")}>
              Preço mínimo
            </label>
            <select
              id={id("preco-min")}
              value={value.precoMin ?? ""}
              onChange={(e) =>
                set({ precoMin: Number(e.target.value) || undefined })
              }
              className={`${selectClass} h-11`}
            >
              <option value="">Mínimo</option>
              {priceSteps.map((p) => (
                <option key={p} value={p}>
                  R$ {formatNumber(p / 1000)} mil
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={id("preco-max")}>
              Preço máximo
            </label>
            <select
              id={id("preco-max")}
              value={value.precoMax ?? ""}
              onChange={(e) =>
                set({ precoMax: Number(e.target.value) || undefined })
              }
              className={`${selectClass} h-11`}
            >
              <option value="">Máximo</option>
              {priceSteps.map((p) => (
                <option key={p} value={p}>
                  R$ {formatNumber(p / 1000)} mil
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Ano do modelo</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor={id("ano-min")}>
              Ano mínimo
            </label>
            <select
              id={id("ano-min")}
              value={value.anoMin ?? ""}
              onChange={(e) =>
                set({ anoMin: Number(e.target.value) || undefined })
              }
              className={`${selectClass} h-11`}
            >
              <option value="">De</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={id("ano-max")}>
              Ano máximo
            </label>
            <select
              id={id("ano-max")}
              value={value.anoMax ?? ""}
              onChange={(e) =>
                set({ anoMax: Number(e.target.value) || undefined })
              }
              className={`${selectClass} h-11`}
            >
              <option value="">Até</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line pt-5">
        <label htmlFor={id("km")} className="text-sm font-medium">
          Quilometragem máxima
        </label>
        <select
          id={id("km")}
          value={value.kmMax ?? ""}
          onChange={(e) => set({ kmMax: Number(e.target.value) || undefined })}
          className={`${selectClass} h-11`}
        >
          <option value="">Qualquer</option>
          {kmSteps.map((k) => (
            <option key={k} value={k}>
              Até {formatNumber(k)} km
            </option>
          ))}
        </select>
      </div>

      {groups.map(renderGroup)}

      <details
        className="group border-t border-line pt-5"
        open={extrasActive > 0 || undefined}
      >
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
          Mais filtros{extrasActive > 0 ? ` (${extrasActive})` : ""}
          <CaretDown
            size={16}
            className="transition-transform duration-200 group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-2 flex flex-col gap-5">
          {extraGroups.map(renderGroup)}
        </div>
      </details>
    </div>
  );
}
