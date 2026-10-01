import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { isNewArrival } from "@/lib/filters";
import {
  formatKm,
  formatPrice,
  formatYears,
  fuelLabel,
  transmissionLabel,
} from "@/lib/format";
import type { Location, Vehicle } from "@/lib/types";
import { VehiclePhoto } from "./vehicle-photo";

export function vehicleBadges(v: Vehicle) {
  const list: { label: string; tone: "neutral" | "accent" | "warning" }[] = [];
  if (v.status === "reservado")
    list.push({ label: "Reservado", tone: "warning" });
  if (v.promoPrice) list.push({ label: "Oferta", tone: "accent" });
  if (isNewArrival(v.createdAt))
    list.push({ label: "Novidade", tone: "neutral" });
  if (v.badges.includes("unico_dono"))
    list.push({ label: "Único dono", tone: "neutral" });
  if (v.badges.includes("baixa_km"))
    list.push({ label: "Baixa km", tone: "neutral" });
  return list;
}

type Props = {
  vehicle: Vehicle;
  location?: Location;
  size?: "default" | "large";
  priority?: boolean;
  headingLevel?: "h2" | "h3";
};

export function VehicleCard({
  vehicle: v,
  location,
  size = "default",
  priority,
  headingLevel = "h3",
}: Props) {
  const Heading = headingLevel;
  const badges = vehicleBadges(v).slice(0, 2);
  const large = size === "large";
  return (
    <article className="group relative flex min-w-0 flex-col gap-3">
      <div
        className={`overflow-hidden rounded-ui ${large ? "aspect-[4/3] lg:aspect-[16/11]" : "aspect-[4/3]"}`}
      >
        <VehiclePhoto
          photo={v.photos[0]}
          label={v.model}
          priority={priority}
          sizes={
            large
              ? "(min-width: 1024px) 50vw, 100vw"
              : "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          }
          className="transition-transform duration-700 ease-out-quint group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-muted">{v.brand}</p>
        <Heading
          className={`leading-snug font-semibold tracking-[-0.01em] ${large ? "text-xl md:text-2xl" : "text-[17px]"}`}
        >
          <Link
            href={`/estoque/${v.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-offset-4 [&:focus-visible]:after:outline-accent-text [&:focus-visible]:after:rounded-ui"
          >
            {v.model}{" "}
            <span className="font-normal text-muted">{v.version}</span>
          </Link>
        </Heading>
        <p className="tabular flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted">
          <span>{formatYears(v)}</span>
          <span>{formatKm(v.mileageKm)}</span>
          <span>{transmissionLabel[v.transmission]}</span>
          <span>{fuelLabel[v.fuel]}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="tabular flex items-baseline gap-2">
            <span
              className={`font-semibold tracking-[-0.02em] ${large ? "text-2xl" : "text-xl"}`}
            >
              {formatPrice(v.promoPrice ?? v.price)}
            </span>
            {v.promoPrice && (
              <s className="text-sm text-muted">
                <span className="sr-only">De </span>
                {formatPrice(v.price)}
              </s>
            )}
          </p>
          {location && (
            <p className="text-sm text-muted">Unidade {location.name}</p>
          )}
        </div>
      </div>
    </article>
  );
}
