import type { VehiclePhoto as Photo } from "@/lib/types";

type Props = {
  photo?: Photo;
  /** Used for the placeholder when there is no photo */
  label: string;
  size?: "card" | "full";
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Vehicle image. Photos are pre-generated in three sizes at upload, so a plain
 * <img srcset> is enough and no host-specific image optimisation is needed.
 * Without a photo it renders a neutral placeholder with the model name.
 */
export function VehiclePhoto({
  photo,
  label,
  size = "card",
  sizes,
  priority,
  className = "",
}: Props) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={size === "full" ? photo.full : photo.card}
        srcSet={`${photo.thumb} 480w, ${photo.card} 960w, ${photo.full} 1920w`}
        sizes={sizes ?? "(min-width: 1024px) 33vw, 100vw"}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${label}: foto em breve`}
      className={`@container relative flex h-full w-full flex-col justify-end overflow-hidden bg-photo bg-[linear-gradient(180deg,transparent_40%,color-mix(in_oklab,var(--photo-fg)_45%,transparent))] ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.18em] left-[0.35em] text-[clamp(2.5rem,9cqw,7rem)] leading-none font-semibold tracking-[-0.05em] whitespace-nowrap text-[var(--photo-fg)]"
      >
        {label}
      </span>
      <span className="relative m-3 hidden self-end font-mono text-[11px] tracking-wide text-muted @[14rem]:block">
        Foto em breve
      </span>
    </div>
  );
}
