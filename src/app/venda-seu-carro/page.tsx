import type { Metadata } from "next";
import { FormPage } from "@/components/forms/form-page";
import {
  ContactFields,
  LeadForm,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/lead-form";
import { getSettings, getVehicleByCode } from "@/lib/data";
import { whatsappUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Venda seu carro",
  description:
    "Venda seu carro ou use na troca por um seminovo. Envie os dados do veículo e receba uma avaliação.",
  alternates: { canonical: "/venda-seu-carro" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TradeInPage({ searchParams }: Props) {
  const code = (await searchParams).veiculo;
  const [settings, vehicle] = await Promise.all([
    getSettings(),
    getVehicleByCode(typeof code === "string" ? code : undefined),
  ]);
  const available = vehicle && vehicle.status !== "vendido" ? vehicle : null;
  const year = new Date().getFullYear();

  return (
    <FormPage
      title={available ? "Use seu carro na troca" : "Venda seu carro"}
      intro="Conte qual é o seu carro e como ele está. Avaliamos e, se preferir, o valor entra como parte do pagamento do seu próximo carro."
      steps={[
        "Você envia os dados do seu carro.",
        "Pedimos fotos pelo WhatsApp e fazemos uma pré-avaliação.",
        "Você traz o carro a uma unidade para a avaliação final e recebe a proposta.",
      ]}
      dataNote="Usamos seus dados de contato e as informações do veículo apenas para fazer a avaliação. Não pedimos placa nem documentos nesta etapa."
      vehicle={available}
      vehicleLabel="Carro que você quer comprar"
    >
      <LeadForm
        type="troca"
        hidden={available ? { veiculo: available.code } : {}}
        submitLabel="Enviar para avaliação"
        success={{
          title: "Recebemos os dados do seu carro",
          text: "Para agilizar a avaliação, envie fotos da frente, traseira, laterais, interior e painel com a quilometragem pelo WhatsApp.",
          whatsapp: {
            href: whatsappUrl(
              settings.whatsapp,
              "Olá! Enviei os dados do meu carro pelo site para avaliação. Seguem as fotos:",
            ),
            label: "Enviar fotos pelo WhatsApp",
          },
        }}
      >
        <ContactFields />
        <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <TextField
            name="marca"
            label="Marca"
            required
            placeholder="Ex.: Volkswagen"
          />
          <TextField
            name="modelo"
            label="Modelo"
            required
            placeholder="Ex.: Polo"
          />
          <TextField
            name="versao"
            label="Versão"
            placeholder="Ex.: Highline 200 TSI"
          />
          <SelectField
            name="ano"
            label="Ano do modelo"
            required
            options={Array.from({ length: 25 }, (_, i) =>
              String(year + 1 - i),
            ).map((y) => ({ value: y, label: y }))}
          />
          <TextField
            name="km"
            label="Quilometragem"
            required
            inputMode="numeric"
            mask="number"
            placeholder="Ex.: 45.000"
          />
        </div>
        <RadioGroupField
          name="cambio"
          label="Câmbio"
          required
          options={[
            { value: "manual", label: "Manual" },
            { value: "automatico", label: "Automático" },
          ]}
        />
        <RadioGroupField
          name="estado"
          label="Estado geral"
          required
          options={[
            { value: "excelente", label: "Excelente" },
            { value: "bom", label: "Bom" },
            { value: "regular", label: "Regular" },
            { value: "reparos", label: "Precisa de reparos" },
          ]}
        />
        <TextAreaField
          name="mensagem"
          label="Observações"
          placeholder="Ex.: único dono, revisões na concessionária, pequeno risco no para-choque"
        />
      </LeadForm>
    </FormPage>
  );
}
