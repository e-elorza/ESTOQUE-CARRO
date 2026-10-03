"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/admin/buttons";
import {
  CheckboxField,
  CheckboxGroupField,
  FormMessage,
  FormStateContext,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { equipmentCatalog } from "@/lib/equipment";
import { idle } from "@/lib/form-state";
import { bodyTypeLabel, fuelLabel, transmissionLabel } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { saveVehicle } from "../../_actions/vehicles";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const catalogItems = new Set<string>(Object.values(equipmentCatalog).flat());

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-ui border border-line bg-surface p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const money = (n: number | null | undefined) =>
  n ? `R$ ${n.toLocaleString("pt-BR")}` : "";

export function VehicleForm({
  vehicle,
  locations,
}: {
  vehicle?: Vehicle;
  locations: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(saveVehicle, idle);
  const year = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => String(year + 1 - i)).map(
    (y) => ({ value: y, label: y }),
  );
  const extraEquipment =
    vehicle?.equipment.filter((e) => !catalogItems.has(e)) ?? [];

  return (
    <FormStateContext.Provider value={state}>
      <form action={action} noValidate className="flex flex-col gap-6">
        {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
        <FormMessage />

        <Section title="Identificação">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              name="brand"
              label="Marca"
              required
              defaultValue={vehicle?.brand}
              placeholder="Ex.: Volkswagen"
            />
            <TextField
              name="model"
              label="Modelo"
              required
              defaultValue={vehicle?.model}
              placeholder="Ex.: T-Cross"
            />
            <TextField
              name="version"
              label="Versão"
              hideOptional
              defaultValue={vehicle?.version}
              placeholder="Ex.: Highline 250 TSI"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              name="yearManufacture"
              label="Ano de fabricação"
              required
              options={years}
              defaultValue={
                vehicle ? String(vehicle.yearManufacture) : undefined
              }
            />
            <SelectField
              name="yearModel"
              label="Ano do modelo"
              required
              options={years}
              defaultValue={vehicle ? String(vehicle.yearModel) : undefined}
            />
            <TextField
              name="mileageKm"
              label="Quilometragem"
              required
              inputMode="numeric"
              mask="number"
              defaultValue={
                vehicle ? vehicle.mileageKm.toLocaleString("pt-BR") : undefined
              }
              placeholder="Ex.: 42.000"
            />
          </div>
        </Section>

        <Section title="Preço e situação">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField
              name="price"
              label="Preço"
              required
              inputMode="numeric"
              mask="money"
              defaultValue={money(vehicle?.price)}
              placeholder="Ex.: R$ 129.900"
            />
            <TextField
              name="promoPrice"
              label="Preço promocional"
              hideOptional
              inputMode="numeric"
              mask="money"
              defaultValue={money(vehicle?.promoPrice)}
              hint="Deixe em branco se não houver oferta."
            />
            <SelectField
              name="status"
              label="Situação"
              required
              placeholder={null}
              defaultValue={vehicle?.status ?? "disponivel"}
              options={[
                { value: "disponivel", label: "Disponível (aparece no site)" },
                { value: "reservado", label: "Reservado (aparece com aviso)" },
                { value: "vendido", label: "Vendido (sai do estoque)" },
                { value: "rascunho", label: "Rascunho (não aparece)" },
              ]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              name="locationId"
              label="Unidade onde está"
              hideOptional
              placeholder="Sem unidade definida"
              options={locations.map((l) => ({ value: l.id, label: l.name }))}
              defaultValue={vehicle?.locationId ?? undefined}
            />
          </div>
          <div className="flex flex-col gap-3">
            <CheckboxField
              name="featured"
              label="Destaque na página inicial"
              defaultChecked={vehicle?.featured}
            />
            <CheckboxGroupField
              name="badges"
              label="Selos"
              columns={2}
              defaultValues={vehicle?.badges ?? []}
              options={[
                { value: "unico_dono", label: "Único dono" },
                { value: "baixa_km", label: "Baixa quilometragem" },
              ]}
            />
            <p className="text-sm text-muted">
              &quot;Oferta&quot; aparece sozinho quando há preço promocional, e
              &quot;Novidade&quot; nos primeiros 7 dias.
            </p>
          </div>
        </Section>

        <Section title="Ficha técnica">
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              name="transmission"
              label="Câmbio"
              required
              options={toOptions(transmissionLabel)}
              defaultValue={vehicle?.transmission}
            />
            <SelectField
              name="fuel"
              label="Combustível"
              required
              options={toOptions(fuelLabel)}
              defaultValue={vehicle?.fuel}
            />
            <SelectField
              name="bodyType"
              label="Carroceria"
              required
              options={toOptions(bodyTypeLabel)}
              defaultValue={vehicle?.bodyType}
            />
            <TextField
              name="color"
              label="Cor"
              required
              defaultValue={vehicle?.color}
              placeholder="Ex.: Cinza Platinum"
            />
            <TextField
              name="engine"
              label="Motor"
              hideOptional
              defaultValue={vehicle?.engine ?? undefined}
              placeholder="Ex.: 1.4 TSI"
            />
            <TextField
              name="powerCv"
              label="Potência (cv)"
              hideOptional
              inputMode="numeric"
              defaultValue={
                vehicle?.powerCv ? String(vehicle.powerCv) : undefined
              }
            />
            <SelectField
              name="doors"
              label="Portas"
              required
              placeholder={null}
              defaultValue={String(vehicle?.doors ?? 4)}
              options={["2", "3", "4", "5"].map((d) => ({
                value: d,
                label: d,
              }))}
            />
            <TextField
              name="plateFinal"
              label="Final da placa"
              hideOptional
              inputMode="numeric"
              defaultValue={
                vehicle?.plateFinal !== null &&
                vehicle?.plateFinal !== undefined
                  ? String(vehicle.plateFinal)
                  : undefined
              }
              hint="Só o último dígito."
            />
          </div>
        </Section>

        <Section title="Equipamentos">
          {Object.entries(equipmentCatalog).map(([category, items]) => (
            <CheckboxGroupField
              key={category}
              name="equipment"
              label={category}
              columns={3}
              defaultValues={vehicle?.equipment ?? []}
              options={items.map((i) => ({ value: i, label: i }))}
            />
          ))}
          <TextAreaField
            name="equipmentExtra"
            label="Outros itens"
            hideOptional
            rows={2}
            defaultValue={extraEquipment.join(", ")}
            hint="Separe por vírgula. Ex.: Banco traseiro bipartido, Volante com aletas"
          />
        </Section>

        <Section title="Descrição">
          <TextAreaField
            name="description"
            label="Texto do anúncio"
            hideOptional
            rows={6}
            defaultValue={vehicle?.description}
            hint="Conte o histórico do carro: revisões, dono, garantia, diferenciais."
          />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-ui md:border md:px-5">
          <SubmitButton size="lg">
            {vehicle ? "Salvar alterações" : "Cadastrar veículo"}
          </SubmitButton>
          {!vehicle && (
            <p className="text-sm text-muted">
              Depois de cadastrar, você adiciona as fotos.
            </p>
          )}
        </div>
      </form>
    </FormStateContext.Provider>
  );
}
