"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { selectClass as baseSelect } from "@/components/ui/field";
import type { BrandOption } from "@/lib/brands";
import { priceRanges } from "@/lib/filters";

const selectClass = `${baseSelect} h-12`;

export function HeroSearch({ brands }: { brands: BrandOption[] }) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [range, setRange] = useState("");
  const models = brands.find((b) => b.slug === brand)?.models ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (brand) q.set("marca", brand);
    if (model) q.set("modelo", model);
    const r = range ? priceRanges[Number(range)] : undefined;
    if (r && "min" in r) q.set("preco_min", String(r.min));
    if (r && "max" in r) q.set("preco_max", String(r.max));
    router.push(`/estoque${q.size ? `?${q}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Buscar veículos"
      className="grid gap-3 sm:grid-cols-3"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="busca-marca" className="text-sm text-muted">
          Marca
        </label>
        <select
          id="busca-marca"
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setModel("");
          }}
          className={selectClass}
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
        <label htmlFor="busca-modelo" className="text-sm text-muted">
          Modelo
        </label>
        <select
          id="busca-modelo"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!brand}
          className={selectClass}
        >
          <option value="">
            {brand ? "Todos os modelos" : "Escolha a marca"}
          </option>
          {models.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name} ({m.count})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="busca-preco" className="text-sm text-muted">
          Faixa de preço
        </label>
        <select
          id="busca-preco"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={selectClass}
        >
          <option value="">Qualquer valor</option>
          {priceRanges.map((r, i) => (
            <option key={r.label} value={i}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className={buttonClass(
          "primary",
          "lg",
          "w-full sm:col-span-3 sm:w-auto sm:justify-self-start",
        )}
      >
        <MagnifyingGlass size={18} weight="bold" aria-hidden />
        Buscar veículos
      </button>
    </form>
  );
}
