"use client";

import { buttonClass } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex flex-col items-start gap-6 py-24 md:py-32">
      <h1 className="text-4xl font-semibold md:text-5xl">Algo deu errado</h1>
      <p className="max-w-[50ch] text-lg leading-relaxed text-muted">
        Não conseguimos carregar esta página agora. Tente de novo em alguns
        segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className={buttonClass("primary", "lg")}
      >
        Tentar de novo
      </button>
    </div>
  );
}
