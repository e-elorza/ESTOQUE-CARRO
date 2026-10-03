"use client";

import {
  ArrowLeft,
  ArrowRight,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useRef, useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import {
  deletePhoto,
  reorderPhotos,
  uploadPhoto,
} from "../../_actions/vehicles";

type Photo = { id: string; thumb: string };
type Upload = { name: string; state: "enviando" | "erro"; message?: string };

const MAX_SIDE = 2400;

/** Downscale in the browser so phone photos (often 5–10 MB) fit hosting request limits. */
async function prepare(file: File): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 && /jpe?g|webp/.test(file.type))
    return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    return blob ?? file;
  } catch {
    // Formats the browser can't decode (e.g. HEIC on some systems) go as-is; the server converts them.
    return file;
  }
}

export function PhotoManager({
  vehicleId,
  initial,
}: {
  vehicleId: string;
  initial: Photo[];
}) {
  const [photos, setPhotos] = useState(initial);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    setUploads(list.map((f) => ({ name: f.name, state: "enviando" })));
    // One at a time keeps each request small and the order predictable
    for (const [i, file] of list.entries()) {
      const fd = new FormData();
      fd.append(
        "foto",
        await prepare(file),
        file.name.replace(/\.\w+$/, ".jpg"),
      );
      const result = await uploadPhoto(vehicleId, fd);
      if (result.ok) {
        setPhotos((p) => [
          ...p,
          { id: result.photo.id, thumb: result.photo.thumb },
        ]);
        setUploads((u) =>
          u.map((x, j) =>
            j === i ? { ...x, state: "enviando", message: "ok" } : x,
          ),
        );
      } else {
        setUploads((u) =>
          u.map((x, j) =>
            j === i ? { ...x, state: "erro", message: result.message } : x,
          ),
        );
      }
    }
    setUploads((u) => u.filter((x) => x.state === "erro"));
    if (input.current) input.current.value = "";
  }

  function persist(next: Photo[]) {
    setPhotos(next);
    startTransition(() =>
      reorderPhotos(
        vehicleId,
        next.map((p) => p.id),
      ),
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function remove(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
    startTransition(() => deletePhoto(vehicleId, id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col items-start gap-3 rounded-ui border border-dashed border-line-strong p-5 sm:flex-row sm:items-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={buttonClass("secondary")}
        >
          <UploadSimple size={18} aria-hidden /> Adicionar fotos
        </button>
        <p className="text-sm text-muted">
          Arraste as fotos para cá ou escolha do computador ou celular. A
          primeira foto é a capa.
        </p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
          multiple
          className="sr-only"
          aria-label="Escolher fotos"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm" aria-live="polite">
          {uploads.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className={u.state === "erro" ? "text-danger" : "text-muted"}
            >
              {u.name}:{" "}
              {u.state === "erro"
                ? u.message
                : u.message === "ok"
                  ? "enviada"
                  : "enviando…"}
            </li>
          ))}
        </ul>
      )}

      {photos.length === 0 ? (
        <p className="text-muted">Nenhuma foto ainda.</p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          aria-label="Fotos do veículo, na ordem em que aparecem no site"
        >
          {photos.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragId || dragId === p.id) return;
                const next = photos.filter((x) => x.id !== dragId);
                next.splice(
                  i,
                  0,
                  photos.find((x) => x.id === dragId)!,
                );
                persist(next);
              }}
              className={`group relative overflow-hidden rounded-ui border border-line bg-surface select-none ${dragId === p.id ? "opacity-50" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb}
                alt={`Foto ${i + 1}`}
                width={480}
                height={360}
                draggable={false}
                className="aspect-[4/3] w-full cursor-grab object-cover"
              />
              {confirmId === p.id ? (
                <div
                  role="group"
                  aria-label={`Excluir foto ${i + 1}?`}
                  className="flex items-center justify-between gap-1 p-1.5 text-sm"
                >
                  <span className="px-1.5">Excluir?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(null);
                        remove(p.id);
                      }}
                      className="inline-flex h-8 items-center rounded-ui bg-danger px-3 font-medium text-white"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="inline-flex h-8 items-center rounded-ui px-2 hover:bg-surface-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <span className="px-1.5 text-xs font-medium text-muted">
                    {i === 0 ? "Capa" : `${i + 1}`}
                  </span>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="inline-flex size-8 items-center justify-center rounded-ui hover:bg-surface-2 disabled:opacity-30"
                      aria-label={`Mover foto ${i + 1} para trás`}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === photos.length - 1}
                      className="inline-flex size-8 items-center justify-center rounded-ui hover:bg-surface-2 disabled:opacity-30"
                      aria-label={`Mover foto ${i + 1} para frente`}
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      className="inline-flex size-8 items-center justify-center rounded-ui text-danger hover:bg-surface-2"
                      aria-label={`Excluir foto ${i + 1}`}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
