import { vehiclesData } from "./mockData";

export type IncidentType = "accident" | "breakdown" | "tow" | "theft" | "vandalism" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Incident {
  id: string;
  plate: string;
  vehicleLabel: string;
  unit: string;
  driverName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  date: string;
  time: string;
  location: string;
  description: string;
  damageEstimate: number;
  hasInjury: boolean;
  policeReport?: string;
  insuranceClaim?: string;
  resolvedAt?: string;
  notes?: string;
}

export const incidentTypeLabels: Record<IncidentType, string> = {
  accident: "Acidente",
  breakdown: "Pane Mecânica",
  tow: "Reboque",
  theft: "Furto/Roubo",
  vandalism: "Vandalismo",
  other: "Outro",
};

const driverNames = [
  "Carlos Silva", "José Santos", "Maria Oliveira", "Ana Costa", "Pedro Lima",
  "Lucas Souza", "Paulo Ferreira", "João Pereira", "Marcos Almeida", "Rafael Ribeiro",
  "Fernando Gomes", "Ricardo Martins", "André Rocha", "Bruno Carvalho", "Diego Araújo",
  "Guilherme Barbosa", "Thiago Nascimento", "Leandro Correia", "Vinícius Moraes", "Eduardo Melo",
];

const locations = [
  "Rod. Anhanguera km 42, SP", "Av. Brasil 1200, RJ", "BR-116 km 310, MG",
  "Rod. Presidente Dutra km 180, SP", "Av. Paulista 900, SP", "BR-101 km 55, BA",
  "Rod. Castelo Branco km 28, SP", "Av. das Américas 3500, RJ", "BR-153 km 120, GO",
  "Rod. Fernão Dias km 70, MG", "Av. Independência 450, PR", "BR-040 km 200, MG",
  "Rod. Raposo Tavares km 15, SP", "Av. ACM 800, BA", "BR-376 km 90, PR",
];

const descriptions: Record<IncidentType, string[]> = {
  accident: [
    "Colisão traseira em semáforo", "Colisão lateral em cruzamento", "Capotamento em curva",
    "Colisão frontal parcial", "Engavetamento em rodovia", "Colisão com poste",
    "Atropelamento de animal", "Saída de pista em chuva",
  ],
  breakdown: [
    "Motor superaqueceu na rodovia", "Falha no sistema elétrico", "Pneu estourado em via expressa",
    "Falha na transmissão", "Problema no sistema de freios", "Vazamento de óleo severo",
    "Bateria descarregou", "Falha na bomba de combustível", "Correia dentada rompeu",
  ],
  tow: [
    "Reboque por pane seca", "Reboque após acidente", "Reboque por falha mecânica",
    "Reboque preventivo — ruído anormal", "Reboque por pneu furado sem estepe",
  ],
  theft: [
    "Furto de veículo em estacionamento", "Tentativa de roubo com danos", "Furto de itens internos",
    "Roubo em via pública",
  ],
  vandalism: [
    "Vidro quebrado em estacionamento", "Riscado por terceiros", "Espelho retrovisor danificado",
    "Pneus furados intencionalmente",
  ],
  other: [
    "Alagamento — veículo submerso parcialmente", "Queda de árvore sobre o veículo",
    "Dano por granizo", "Incêndio no motor",
  ],
};

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split("T")[0];
}

function generateIncidents(count: number): Incident[] {
  const incidents: Incident[] = [];
  const types: IncidentType[] = ["accident", "breakdown", "tow", "theft", "vandalism", "other"];
  const weights = [0.3, 0.3, 0.15, 0.08, 0.07, 0.1];

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let cumulative = 0;
    let type: IncidentType = "other";
    for (let j = 0; j < types.length; j++) {
      cumulative += weights[j];
      if (roll < cumulative) { type = types[j]; break; }
    }

    const v = vehiclesData[Math.floor(Math.random() * vehiclesData.length)];
    const sevRoll = Math.random();
    const severity: IncidentSeverity = sevRoll < 0.3 ? "low" : sevRoll < 0.6 ? "medium" : sevRoll < 0.85 ? "high" : "critical";
    const statusRoll = Math.random();
    const status: IncidentStatus = statusRoll < 0.2 ? "open" : statusRoll < 0.4 ? "in_progress" : statusRoll < 0.8 ? "resolved" : "closed";
    const date = randomDate("2025-06-01", "2026-02-14");
    const descs = descriptions[type];
    const damage = type === "accident" ? 2000 + Math.floor(Math.random() * 15000)
      : type === "theft" ? 5000 + Math.floor(Math.random() * 40000)
      : type === "breakdown" ? 500 + Math.floor(Math.random() * 5000)
      : 300 + Math.floor(Math.random() * 3000);

    incidents.push({
      id: `OC-${String(i + 1).padStart(4, "0")}`,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model} ${v.year}`,
      unit: v.unit,
      driverName: driverNames[Math.floor(Math.random() * driverNames.length)],
      type,
      severity,
      status,
      date,
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      description: descs[Math.floor(Math.random() * descs.length)],
      damageEstimate: damage,
      hasInjury: type === "accident" && Math.random() < 0.2,
      policeReport: ["accident", "theft"].includes(type) && Math.random() > 0.3 ? `BO-${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
      insuranceClaim: Math.random() > 0.5 ? `SIN-${Math.floor(Math.random() * 90000 + 10000)}` : undefined,
      resolvedAt: ["resolved", "closed"].includes(status) ? randomDate(date, "2026-02-14") : undefined,
      notes: Math.random() > 0.6 ? "Acompanhar situação com seguradora" : undefined,
    });
  }
  return incidents.sort((a, b) => b.date.localeCompare(a.date));
}

export const incidents = generateIncidents(90);

export const incidentStats = {
  total: incidents.length,
  open: incidents.filter(i => i.status === "open").length,
  inProgress: incidents.filter(i => i.status === "in_progress").length,
  resolved: incidents.filter(i => i.status === "resolved" || i.status === "closed").length,
  accidents: incidents.filter(i => i.type === "accident").length,
  breakdowns: incidents.filter(i => i.type === "breakdown").length,
  totalDamage: incidents.reduce((s, i) => s + i.damageEstimate, 0),
  withInjury: incidents.filter(i => i.hasInjury).length,
};
