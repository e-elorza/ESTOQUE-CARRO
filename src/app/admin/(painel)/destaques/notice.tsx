import { WarningCircle } from "@phosphor-icons/react/ssr";
import { Flash } from "@/components/admin/page-header";

const messages: Record<string, { ok: boolean; text: string }> = {
  adicionado: {
    ok: true,
    text: "Destaque adicionado. A página inicial já foi atualizada.",
  },
  renovado: { ok: true, text: "Destaque renovado." },
  removido: { ok: true, text: "Destaque removido." },
  cheio: {
    ok: false,
    text: "As 5 vagas já estão ocupadas. Remova um destaque (ou espere um vencer) antes de adicionar outro.",
  },
  indisponivel: {
    ok: false,
    text: "Só carros disponíveis podem ser destaque.",
  },
  ja: { ok: false, text: "Esse carro já está em destaque." },
  escolha: { ok: false, text: "Escolha um carro para destacar." },
  erro: {
    ok: false,
    text: "Não foi possível alterar o destaque. Tente de novo.",
  },
};

/** Result of a destaque action, passed back as ?destaque=<code>. */
export function PickNotice({ code }: { code?: string }) {
  const m = code ? messages[code] : undefined;
  if (!m) return null;
  if (m.ok) return <Flash message={m.text} />;
  return (
    <p
      role="alert"
      className="mb-6 flex items-start gap-2 rounded-ui bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-4 py-3 text-[15px]"
    >
      <WarningCircle
        size={20}
        className="mt-0.5 shrink-0 text-danger"
        aria-hidden
      />
      {m.text}
    </p>
  );
}
