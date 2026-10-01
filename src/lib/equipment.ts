/** Equipment catalog grouped for display on the vehicle page and in the admin. */
export const equipmentCatalog = {
  Segurança: [
    "ABS",
    "Airbags frontais",
    "Airbags laterais e de cortina",
    "Controle de estabilidade",
    "Frenagem autônoma de emergência",
    "Alerta de ponto cego",
    "Assistente de permanência em faixa",
    "Câmera de ré",
    "Câmera 360°",
    "Sensor de estacionamento",
    "Isofix",
  ],
  Conforto: [
    "Ar-condicionado",
    "Ar-condicionado digital",
    "Bancos em couro",
    "Bancos com ajuste elétrico",
    "Bancos aquecidos",
    "Direção elétrica",
    "Piloto automático",
    "ACC (piloto automático adaptativo)",
    "Chave presencial",
    "Partida por botão",
    "Vidros elétricos",
    "Travas elétricas",
    "Teto solar",
    "Teto solar panorâmico",
    "Porta-malas elétrico",
  ],
  Tecnologia: [
    "Multimídia",
    "Apple CarPlay",
    "Android Auto",
    "Painel digital",
    "Carregador por indução",
    "Som premium",
    "Head-up display",
  ],
  Exterior: [
    "Faróis de LED",
    "Rodas de liga leve",
    "Retrovisores rebatíveis eletricamente",
    "Tração 4x4",
    "Capota marítima",
    "Engate",
  ],
} as const;

export type EquipmentCategory = keyof typeof equipmentCatalog;

const categoryByItem = new Map<string, EquipmentCategory>(
  (
    Object.entries(equipmentCatalog) as [EquipmentCategory, readonly string[]][]
  ).flatMap(([category, items]) =>
    items.map((item) => [item, category] as const),
  ),
);

export function groupEquipment(
  items: string[],
): { category: string; items: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const category = categoryByItem.get(item) ?? "Outros";
    groups.set(category, [...(groups.get(category) ?? []), item]);
  }
  const order = [...Object.keys(equipmentCatalog), "Outros"];
  return order
    .filter((c) => groups.has(c))
    .map((category) => ({ category, items: groups.get(category)! }));
}

/** Options offered in the "Opcionais" filter. */
export const filterableEquipment = [
  "Teto solar",
  "Teto solar panorâmico",
  "Bancos em couro",
  "Apple CarPlay",
  "Android Auto",
  "ACC (piloto automático adaptativo)",
  "Câmera 360°",
  "Chave presencial",
  "Tração 4x4",
] as const;
