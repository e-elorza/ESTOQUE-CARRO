"use client";

import { Funnel, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import { selectClass } from "@/components/ui/field";
import {
  countActiveFilters,
  emptyFilters,
  filtersToQuery,
  matches,
  sortOptions,
  type Filters,
} from "@/lib/filters";
import { pluralVehicles } from "@/lib/format";
import type { VehicleIndexEntry } from "@/lib/types";
import { FilterPanel } from "./filter-panel";

type Props = {
  index: VehicleIndexEntry[];
  locations: { id: string; name: string }[];
  filters: Filters;
};

function useApply() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apply = (f: Filters) => {
    const q = filtersToQuery(f);
    startTransition(() =>
      router.replace(`/estoque${q ? `?${q}` : ""}`, { scroll: false }),
    );
  };
  return { apply, pending };
}

/** Desktop sidebar: every change applies immediately. */
export function SidebarFilters({ index, locations, filters }: Props) {
  const { apply, pending } = useApply();
  const [value, setValue] = useState(filters);
  const [synced, setSynced] = useState(filters);
  if (synced !== filters) {
    // URL changed elsewhere (chips, back button): follow it.
    setSynced(filters);
    setValue(filters);
  }
  const active = countActiveFilters(value);
  return (
    <div
      aria-busy={pending}
      className="transition-opacity aria-busy:opacity-70"
    >
      <div className="mb-4 flex h-8 items-center justify-between">
        <h2 className="text-base font-semibold">Filtros</h2>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              const next = { ...emptyFilters, ordem: value.ordem };
              setValue(next);
              apply(next);
            }}
            className="text-sm text-accent-text hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
      <FilterPanel
        index={index}
        locations={locations}
        value={value}
        idPrefix="f"
        onChange={(next) => {
          setValue(next);
          apply(next);
        }}
      />
    </div>
  );
}

/** Mobile: a bottom sheet with a live count; applies on confirm. */
export function SheetFilters({ index, locations, filters }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { apply } = useApply();
  const [draft, setDraft] = useState(filters);
  const count = index.filter((e) => matches(e, draft)).length;
  const active = countActiveFilters(filters);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(filters);
          ref.current?.showModal();
        }}
        className={buttonClass("secondary", "md", "lg:hidden")}
        aria-haspopup="dialog"
      >
        <Funnel size={18} aria-hidden />
        Filtrar{active > 0 ? ` (${active})` : ""}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="filtros-titulo"
        className="sheet mx-0 mt-auto mb-0 h-[92dvh] max-h-[92dvh] w-full max-w-none rounded-t-[12px] bg-surface p-0 text-fg"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 id="filtros-titulo" className="text-lg font-semibold">
              Filtros
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-ui hover:bg-surface-2"
              aria-label="Fechar filtros"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
            <FilterPanel
              index={index}
              locations={locations}
              value={draft}
              onChange={setDraft}
              idPrefix="m"
            />
          </div>
          <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDraft({ ...emptyFilters, ordem: draft.ordem })}
              className={buttonClass("ghost", "lg")}
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                apply(draft);
                ref.current?.close();
              }}
              className={buttonClass("primary", "lg")}
              aria-live="polite"
            >
              {count === 0 ? "Nenhum veículo" : `Ver ${pluralVehicles(count)}`}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export function SortSelect({ filters }: { filters: Filters }) {
  const { apply, pending } = useApply();
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="ordem"
        className="hidden text-sm whitespace-nowrap text-muted sm:block"
      >
        Ordenar por
      </label>
      <select
        id="ordem"
        value={filters.ordem}
        aria-busy={pending}
        onChange={(e) =>
          apply({
            ...filters,
            ordem: e.target.value as Filters["ordem"],
            pagina: 1,
          })
        }
        className={`${selectClass} h-11 w-auto`}
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
