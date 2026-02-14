import { vehiclesData, Vehicle } from "./mockData";
import { workOrders, WorkOrder } from "./maintenanceData";
import { fuelLogs, FuelLog } from "./fuelData";

// Timeline event types
export type TimelineEventType = "maintenance" | "fuel" | "tire" | "fine" | "incident" | "document";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  description: string;
  cost?: number;
  severity?: "low" | "medium" | "high" | "critical";
  status?: string;
  metadata?: Record<string, string>;
}

// Health score breakdown
export interface HealthBreakdown {
  overall: number;
  maintenance: { score: number; label: string; details: string };
  fuel: { score: number; label: string; details: string };
  tires: { score: number; label: string; details: string };
  documents: { score: number; label: string; details: string };
  incidents: { score: number; label: string; details: string };
}

function generateHealthBreakdown(vehicle: Vehicle): HealthBreakdown {
  const overall = vehicle.healthScore;
  const base = overall / 100;

  const maintenance = {
    score: Math.min(100, Math.round(base * 100 + (Math.random() - 0.5) * 20)),
    label: base > 0.7 ? "Preventivas em dia" : base > 0.4 ? "Atrasos moderados" : "Preventivas vencidas",
    details: base > 0.7 ? "Última revisão dentro do prazo. Próxima em 2.500 km." : base > 0.4 ? "1 preventiva atrasada em 15 dias." : "2 preventivas vencidas. 12.000 km excedidos na troca de óleo."
  };
  const fuel = {
    score: Math.min(100, Math.round(base * 100 + (Math.random() - 0.5) * 15)),
    label: vehicle.fuelAvg >= 9 ? "Consumo normal" : vehicle.fuelAvg >= 7 ? "Consumo elevado" : "Consumo anômalo",
    details: `Média: ${vehicle.fuelAvg} km/l. ${vehicle.fuelAvg >= 9 ? "Dentro do esperado para o modelo." : vehicle.fuelAvg >= 7 ? "5-15% acima da média da frota." : "Mais de 30% acima. Verificar possível vazamento."}`
  };
  const tires = {
    score: Math.min(100, Math.round(base * 100 + (Math.random() - 0.5) * 25)),
    label: base > 0.6 ? "Pneus em bom estado" : "Rodízio atrasado",
    details: base > 0.6 ? "Último rodízio há 8.000 km. Desgaste uniforme." : "Rodízio atrasado em 3.000 km. Pneu dianteiro esquerdo com desgaste irregular."
  };
  const documents = {
    score: Math.min(100, Math.round(base * 100 + (Math.random() - 0.5) * 20)),
    label: base > 0.5 ? "Documentos em dia" : "CRLV próximo do vencimento",
    details: base > 0.5 ? "CRLV válido até 12/2026. Seguro ativo." : "CRLV vence em 15 dias. Seguro OK."
  };
  const incidents = {
    score: Math.min(100, Math.round(base * 100 + (Math.random() - 0.3) * 30)),
    label: base > 0.7 ? "Sem ocorrências recentes" : "1 ocorrência nos últimos 90 dias",
    details: base > 0.7 ? "Nenhum sinistro registrado nos últimos 6 meses." : "Colisão leve em 15/01/2026. Reparo concluído."
  };

  return { overall, maintenance, fuel, tires, documents, incidents };
}

function generateTimeline(vehicle: Vehicle): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Maintenance events from work orders
  const vehicleWOs = workOrders.filter(w => w.plate === vehicle.plate).slice(0, 8);
  for (const wo of vehicleWOs) {
    events.push({
      id: `wo-${wo.id}`,
      type: "maintenance",
      date: wo.opened_at,
      title: wo.description,
      description: `${wo.type === "preventive" ? "Preventiva" : "Corretiva"} — ${wo.supplier}`,
      cost: wo.cost_total,
      status: wo.status,
      metadata: { os: wo.id, km: wo.km_at_service.toLocaleString("pt-BR") },
    });
  }

  // Fuel events
  const vehicleFuel = fuelLogs.filter(l => l.plate === vehicle.plate).slice(0, 10);
  for (const fl of vehicleFuel) {
    events.push({
      id: `fuel-${fl.id}`,
      type: "fuel",
      date: fl.date,
      title: `Abastecimento — ${fl.liters.toFixed(1)}L`,
      description: `${fl.fuelType} em ${fl.station}. Consumo: ${fl.consumption} km/l`,
      cost: fl.value,
      metadata: { km: fl.km.toLocaleString("pt-BR"), motorista: fl.driver },
    });
  }

  // Generate tire events
  const tireEvents = [
    { date: "2025-11-20", title: "Rodízio de pneus", description: "Rodízio completo — 4 posições", cost: 120 },
    { date: "2025-08-15", title: "Troca pneu dianteiro direito", description: "Pneu Pirelli Cinturato P1 195/55 R15", cost: 480 },
    { date: "2025-05-10", title: "Alinhamento e balanceamento", description: "Alinhamento 3D + balanceamento 4 rodas", cost: 180 },
  ];
  for (const te of tireEvents) {
    events.push({
      id: `tire-${te.date}`,
      type: "tire",
      date: te.date,
      title: te.title,
      description: te.description,
      cost: te.cost,
    });
  }

  // Generate fine events
  if (Math.random() > 0.5) {
    events.push({
      id: "fine-1",
      type: "fine",
      date: "2026-01-18",
      title: "Multa — Excesso de velocidade",
      description: "Radar fixo BR-116 km 432. Velocidade: 98 km/h (limite: 80)",
      cost: 293.47,
      severity: "medium",
      status: "open",
      metadata: { pontos: "5", auto: "AI-2026-003421" },
    });
  }
  if (Math.random() > 0.6) {
    events.push({
      id: "fine-2",
      type: "fine",
      date: "2025-10-05",
      title: "Multa — Estacionamento irregular",
      description: "Estacionamento em local proibido. Av. Paulista, 1000",
      cost: 195.23,
      severity: "low",
      status: "paid",
    });
  }

  // Generate incident events
  if (vehicle.healthScore < 50) {
    events.push({
      id: "incident-1",
      type: "incident",
      date: "2026-01-15",
      title: "Colisão leve — traseira",
      description: "Colisão em baixa velocidade no estacionamento. Danos no para-choque traseiro.",
      cost: 2800,
      severity: "medium",
      status: "resolved",
    });
  }

  // Document events
  events.push({
    id: "doc-crlv",
    type: "document",
    date: "2025-12-01",
    title: "CRLV renovado",
    description: "CRLV 2026 emitido. Válido até 12/2026.",
  });
  events.push({
    id: "doc-seguro",
    type: "document",
    date: "2025-09-15",
    title: "Seguro renovado",
    description: "Apólice Porto Seguro #PS-2025-887432. Vigência: 09/2025 a 09/2026.",
    cost: 3200,
  });

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

// Cache vehicle detail data
const detailCache = new Map<string, { health: HealthBreakdown; timeline: TimelineEvent[] }>();

export function getVehicleDetail(vehicleId: string) {
  const vehicle = vehiclesData.find(v => v.id === vehicleId);
  if (!vehicle) return null;

  if (!detailCache.has(vehicleId)) {
    detailCache.set(vehicleId, {
      health: generateHealthBreakdown(vehicle),
      timeline: generateTimeline(vehicle),
    });
  }

  const cached = detailCache.get(vehicleId)!;
  return { vehicle, ...cached };
}

// Cost summary
export function getVehicleCostSummary(vehicleId: string) {
  const vehicle = vehiclesData.find(v => v.id === vehicleId);
  if (!vehicle) return null;

  const vFuel = fuelLogs.filter(l => l.plate === vehicle.plate);
  const vWOs = workOrders.filter(w => w.plate === vehicle.plate);

  return {
    fuelTotal: Math.round(vFuel.reduce((s, l) => s + l.value, 0)),
    fuelCount: vFuel.length,
    maintenanceTotal: Math.round(vWOs.reduce((s, w) => s + w.cost_total, 0)),
    maintenanceCount: vWOs.length,
    preventiveCount: vWOs.filter(w => w.type === "preventive").length,
    correctiveCount: vWOs.filter(w => w.type === "corrective").length,
  };
}
