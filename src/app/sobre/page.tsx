import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getLocations, getSettings, getStockIndex } from "@/lib/data";
import { pluralVehicles } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: "Sobre",
    description: s.about,
    alternates: { canonical: "/sobre" },
  };
}

export default async function AboutPage() {
  const [settings, locations, index] = await Promise.all([
    getSettings(),
    getLocations(),
    getStockIndex(),
  ]);
  const facts = [
    settings.yearFounded
      ? { value: String(settings.yearFounded), label: "Ano de fundação" }
      : null,
    {
      value: String(locations.length),
      label: locations.length === 1 ? "Unidade" : "Unidades em São Paulo",
    },
    {
      value: pluralVehicles(index.length).split(" ")[0],
      label: "Veículos em estoque hoje",
    },
  ].filter((f): f is { value: string; label: string } => f !== null);

  return (
    <div className="container-page pt-10 md:pt-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            Sobre a {settings.name}
          </h1>
          <p className="max-w-[56ch] text-xl leading-relaxed text-muted">
            {settings.about}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/estoque" className={buttonClass("primary", "lg")}>
              Ver estoque
            </Link>
            <Link href="/contato" className={buttonClass("secondary", "lg")}>
              Visitar uma unidade
            </Link>
          </div>
        </div>
        <dl className="tabular grid content-start gap-px self-start overflow-hidden rounded-ui border border-line bg-line sm:grid-cols-3 lg:grid-cols-1">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 bg-surface p-6">
              <dt className="order-2 text-sm text-muted">{f.label}</dt>
              <dd className="order-1 text-4xl font-semibold tracking-[-0.03em]">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {settings.reasons.length > 0 && (
        <section aria-labelledby="compromissos" className="mt-20">
          <h2 id="compromissos" className="mb-8 text-3xl font-semibold">
            O que você encontra aqui
          </h2>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {settings.reasons.map((r) => (
              <li
                key={r.title}
                className="flex flex-col gap-2 border-t border-line-strong pt-5"
              >
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <p className="max-w-[52ch] leading-relaxed text-muted">
                  {r.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
