import Link from "next/link";
import { VehiclePhoto } from "@/components/vehicle/vehicle-photo";
import { formatKm, formatPrice, formatYears } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type Props = {
  title: string;
  intro: string;
  /** What happens after sending, in order */
  steps: string[];
  /** What is collected and why (LGPD transparency) */
  dataNote: string;
  vehicle?: Vehicle | null;
  vehicleLabel?: string;
  children: React.ReactNode;
};

export function FormPage({
  title,
  intro,
  steps,
  dataNote,
  vehicle,
  vehicleLabel = "Veículo de interesse",
  children,
}: Props) {
  return (
    <div className="container-page grid gap-10 pt-10 md:pt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            {title}
          </h1>
          <p className="max-w-[48ch] text-lg leading-relaxed text-muted">
            {intro}
          </p>
        </div>

        {vehicle && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted">{vehicleLabel}</h2>
            <Link
              href={`/estoque/${vehicle.slug}`}
              className="group flex gap-4 rounded-ui border border-line bg-surface p-3 hover:border-line-strong"
            >
              <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-ui">
                <VehiclePhoto
                  photo={vehicle.photos[0]}
                  label={vehicle.model}
                  sizes="112px"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-0.5">
                <p className="truncate font-medium">
                  {vehicle.brand} {vehicle.model}{" "}
                  <span className="font-normal text-muted">
                    {vehicle.version}
                  </span>
                </p>
                <p className="tabular text-sm text-muted">
                  {formatYears(vehicle)}, {formatKm(vehicle.mileageKm)}
                </p>
                <p className="tabular font-semibold">
                  {formatPrice(vehicle.promoPrice ?? vehicle.price)}
                </p>
              </div>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Como funciona</h2>
          <ol className="flex flex-col gap-4">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-sm font-medium">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
          {dataNote}
        </p>
      </div>

      <div className="rounded-ui border border-line bg-surface p-5 sm:p-8">
        {children}
      </div>
    </div>
  );
}
