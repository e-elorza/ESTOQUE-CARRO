import type { Metadata } from "next";
import { FormPage } from "@/components/forms/form-page";
import {
  ContactFields,
  LeadForm,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/lead-form";
import { getSettings, getVehicleByCode } from "@/lib/data";
import { whatsappUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Financiamento",
  description:
    "Peça seu financiamento de carro seminovo. Enviamos sua proposta para vários bancos e um consultor retorna com as condições.",
  alternates: { canonical: "/financiamento" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FinancingPage({ searchParams }: Props) {
  const code = (await searchParams).veiculo;
  const [settings, vehicle] = await Promise.all([
    getSettings(),
    getVehicleByCode(typeof code === "string" ? code : undefined),
  ]);
  const available = vehicle && vehicle.status !== "vendido" ? vehicle : null;

  return (
    <FormPage
      title="Financiamento"
      intro="Conte quanto pode dar de entrada e em quantas parcelas prefere pagar. Levamos sua proposta aos bancos parceiros e voltamos com as condições aprovadas."
      steps={[
        "Você envia seus dados e o carro de interesse.",
        "Um consultor confere as informações e pede os documentos necessários pelo WhatsApp.",
        "Enviamos a proposta para mais de um banco e apresentamos as condições aprovadas.",
      ]}
      dataNote="Pedimos nome, telefone e as condições desejadas apenas para preparar sua proposta. CPF e renda são solicitados depois, pelo consultor, somente se você quiser seguir com a análise de crédito. Taxas, parcelas e aprovação dependem da instituição financeira."
      vehicle={available}
    >
      <LeadForm
        type="financiamento"
        hidden={available ? { veiculo: available.code } : {}}
        submitLabel="Solicitar financiamento"
        success={{
          title: "Pedido enviado",
          text: "Recebemos seu pedido de financiamento. Um consultor vai falar com você pelo WhatsApp em horário comercial.",
          whatsapp: {
            href: whatsappUrl(
              settings.whatsapp,
              `Olá! Acabei de enviar um pedido de financiamento pelo site${available ? ` para o ${available.brand} ${available.model} (${available.code})` : ""}.`,
            ),
            label: "Adiantar pelo WhatsApp",
          },
        }}
      >
        <ContactFields />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="entrada"
            label="Valor de entrada"
            inputMode="numeric"
            mask="money"
            placeholder="Ex.: R$ 30.000"
            hint="Pode ser em dinheiro ou com seu carro na troca."
          />
          <SelectField
            name="prazo"
            label="Prazo desejado"
            required
            options={["12", "24", "36", "48", "60"].map((p) => ({
              value: p,
              label: `${p} meses`,
            }))}
          />
        </div>
        {!available && (
          <TextField
            name="veiculo"
            label="Carro de interesse"
            placeholder="Ex.: Corolla Cross 2023 ou código VA-0141"
          />
        )}
        <TextAreaField name="mensagem" label="Observações" />
      </LeadForm>
    </FormPage>
  );
}
