"use client";

import { CaretLeft, CaretRight, Images, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { VehiclePhoto as Photo } from "@/lib/types";
import { VehiclePhoto } from "./vehicle-photo";

type Props = { photos: Photo[]; label: string };

/**
 * Desktop: mosaic (1 large + up to 4 small) opening a full-screen viewer.
 * Mobile: swipeable carousel with a counter.
 */
export function Gallery({ photos, label }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const [viewer, setViewer] = useState(0);
  const total = photos.length;

  // Track the visible slide in the mobile carousel
  useEffect(() => {
    const el = track.current;
    if (!el || total < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            setCurrent(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("li").forEach((li) => observer.observe(li));
    return () => observer.disconnect();
  }, [total]);

  const open = (i: number) => {
    setViewer(i);
    dialog.current?.showModal();
  };
  const step = (d: number) => setViewer((v) => (v + d + total) % total);

  if (total === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-ui md:aspect-[16/9]">
        <VehiclePhoto label={label} size="full" priority sizes="100vw" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile carousel */}
      <div className="relative -mx-4 md:hidden">
        <ul
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label="Fotos do veículo"
        >
          {photos.map((p, i) => (
            <li
              key={p.id}
              data-index={i}
              className="aspect-[4/3] w-full shrink-0 snap-center"
            >
              <button
                type="button"
                onClick={() => open(i)}
                className="block h-full w-full"
                aria-label={`Ampliar foto ${i + 1} de ${total}`}
              >
                <VehiclePhoto
                  photo={p}
                  label={label}
                  priority={i === 0}
                  sizes="100vw"
                />
              </button>
            </li>
          ))}
        </ul>
        {total > 1 && (
          <span
            className="tabular absolute right-3 bottom-3 rounded-ui bg-[var(--overlay)] px-2 py-1 text-xs font-medium text-white"
            aria-live="polite"
          >
            {current + 1}/{total}
          </span>
        )}
      </div>

      {/* Desktop mosaic */}
      <div
        className={`hidden gap-2 md:grid ${total >= 5 ? "grid-cols-4 grid-rows-2" : total >= 3 ? "grid-cols-3 grid-rows-2" : "grid-cols-1"} aspect-[16/7] overflow-hidden rounded-ui`}
      >
        {photos.slice(0, total >= 5 ? 5 : total >= 3 ? 3 : 1).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => open(i)}
            className={`group relative overflow-hidden ${i === 0 && total >= 3 ? "col-span-2 row-span-2" : ""}`}
            aria-label={`Ampliar foto ${i + 1} de ${total}`}
          >
            <VehiclePhoto
              photo={p}
              label={label}
              priority={i === 0}
              size={i === 0 ? "full" : "card"}
              sizes={i === 0 ? "50vw" : "25vw"}
              className="transition-transform duration-700 ease-out-quint group-hover:scale-[1.02] motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>
      {total > 1 && (
        <button
          type="button"
          onClick={() => open(0)}
          className="mt-3 hidden h-10 items-center gap-2 rounded-ui px-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--fg)] md:inline-flex"
        >
          <Images size={18} aria-hidden />
          Ver todas as {total} fotos
        </button>
      )}

      {/* Full-screen viewer */}
      <dialog
        ref={dialog}
        aria-label="Fotos do veículo"
        className="m-0 h-dvh max-h-none w-screen max-w-none overscroll-contain bg-[#0d0e10] p-0 text-white"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
            <span className="tabular text-sm text-white/70" aria-live="polite">
              {viewer + 1} de {total}
            </span>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-ui hover:bg-white/10"
              aria-label="Fechar fotos"
            >
              <X size={24} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16">
            {photos[viewer] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[viewer].full}
                alt={photos[viewer].alt}
                width={photos[viewer].width}
                height={photos[viewer].height}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:left-4"
                  aria-label="Foto anterior"
                >
                  <CaretLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 md:right-4"
                  aria-label="Próxima foto"
                >
                  <CaretRight size={24} />
                </button>
              </>
            )}
          </div>
          <ul className="no-scrollbar flex h-24 shrink-0 gap-2 overflow-x-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {photos.map((p, i) => (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setViewer(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={i === viewer}
                  className="block h-full overflow-hidden rounded-ui opacity-50 aria-[current=true]:opacity-100 aria-[current=true]:outline aria-[current=true]:outline-2 aria-[current=true]:outline-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb}
                    alt=""
                    width={96}
                    height={72}
                    className="h-full w-24 object-cover"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
