import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-start gap-6 py-24 md:py-32">
      <p className="font-mono text-sm text-muted">Erro 404</p>
      <h1 className="text-4xl font-semibold md:text-5xl">
        Página não encontrada
      </h1>
      <p className="max-w-[50ch] text-lg leading-relaxed text-muted">
        O endereço pode ter mudado ou o veículo pode ter saído do estoque. Veja
        os carros disponíveis agora.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/estoque" className={buttonClass("primary", "lg")}>
          Ver estoque
        </Link>
        <Link href="/" className={buttonClass("secondary", "lg")}>
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
