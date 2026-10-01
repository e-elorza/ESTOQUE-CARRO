import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PRIVACY_POLICY_VERSION } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  alternates: { canonical: "/politica-de-privacidade" },
};

/*
 * Template text. It must be reviewed by a lawyer before a real dealership goes live;
 * it does not, on its own, guarantee LGPD compliance.
 */
export default async function PrivacyPage() {
  const s = await getSettings();
  const [y, m, d] = PRIVACY_POLICY_VERSION.split("-");
  return (
    <article className="container-page max-w-3xl pt-10 md:pt-14">
      <h1 className="mb-3 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
        Política de Privacidade
      </h1>
      <p className="mb-10 text-muted">
        Versão de {d}/{m}/{y}
      </p>
      <div className="flex flex-col gap-8 text-[17px] leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:text-muted">
        <section>
          <h2>Quem somos</h2>
          <p>
            Este site pertence à {s.name}. Para qualquer assunto sobre seus
            dados, escreva para {s.email}.
          </p>
        </section>
        <section>
          <h2>Quais dados coletamos</h2>
          <p>Somente o que você informa nos formulários:</p>
          <ul>
            <li>nome, telefone/WhatsApp e, se quiser, e-mail;</li>
            <li>
              o carro de interesse e as condições desejadas (entrada, prazo,
              proposta);
            </li>
            <li>no formulário de venda ou troca, os dados do seu veículo.</li>
          </ul>
          <p className="mt-2">
            Não usamos cookies de publicidade nem ferramentas de rastreamento.
            Guardamos a data do seu consentimento e a página de onde o
            formulário foi enviado.
          </p>
        </section>
        <section>
          <h2>Para que usamos</h2>
          <p>
            Para responder à sua solicitação: entrar em contato, preparar
            propostas, encaminhar pedidos de financiamento às instituições
            financeiras que você autorizar e avaliar seu veículo.
          </p>
        </section>
        <section>
          <h2>Com quem compartilhamos</h2>
          <p>
            Com bancos e financeiras apenas quando você pedir uma análise de
            crédito, e com os fornecedores que hospedam este site e seu banco de
            dados. Não vendemos seus dados.
          </p>
        </section>
        <section>
          <h2>Por quanto tempo guardamos</h2>
          <p>
            Pelo tempo necessário para concluir o atendimento e cumprir
            obrigações legais. Depois disso, os dados são excluídos ou
            anonimizados.
          </p>
        </section>
        <section>
          <h2>Seus direitos</h2>
          <p>
            Você pode pedir acesso, correção ou exclusão dos seus dados, ou
            revogar o consentimento, a qualquer momento, pelo e-mail {s.email}.
          </p>
        </section>
      </div>
    </article>
  );
}
