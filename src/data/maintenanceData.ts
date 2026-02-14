import { vehiclesData } from "./mockData";

// Work Order types and statuses
export type WOStatus = "open" | "in_progress" | "done" | "canceled";
export type WOType = "preventive" | "corrective";

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  plate: string;
  vehicleLabel: string;
  type: WOType;
  status: WOStatus;
  opened_at: string;
  closed_at?: string;
  supplier: string;
  cost_total: number;
  km_at_service: number;
  description: string;
  parts: { name: string; qty: number; cost: number }[];
  unit: string;
  priority: "low" | "medium" | "high";
}

const suppliers = [
  "AutoCenter Express", "MecPro Serviços", "FleetFix Ltda", "Rede Mais Peças",
  "TruckService BR", "Oficina Central", "PitStop Veicular", "Master Diesel",
  "RápidoLub", "AutoElétrica JB", "Funilaria Estrela", "PneuShop",
];

const descriptions: Record<WOType, string[]> = {
  preventive: [
    "Troca de óleo e filtro", "Revisão programada 20.000km", "Revisão programada 40.000km",
    "Alinhamento e balanceamento", "Troca de correia dentada", "Revisão de freios",
    "Troca de filtro de ar e cabine", "Revisão de suspensão", "Troca de fluido de arrefecimento",
    "Inspeção geral de 60.000km", "Troca de velas de ignição", "Revisão do sistema elétrico",
  ],
  corrective: [
    "Reparo no motor de partida", "Troca de embreagem", "Reparo no ar-condicionado",
    "Troca de bomba d'água", "Reparo de vazamento de óleo", "Troca do alternador",
    "Reparo no sistema de injeção", "Troca de radiador", "Reparo de câmbio",
    "Troca de amortecedores", "Reparo de direção hidráulica", "Troca de bateria",
    "Reparo no turbo", "Solda no escapamento", "Troca de semi-eixo",
  ],
};

const partsList = [
  { name: "Filtro de óleo", cost: 35 }, { name: "Óleo motor 5W30 (5L)", cost: 180 },
  { name: "Filtro de ar", cost: 55 }, { name: "Pastilha de freio (jogo)", cost: 220 },
  { name: "Correia dentada", cost: 150 }, { name: "Amortecedor dianteiro", cost: 380 },
  { name: "Bateria 60Ah", cost: 450 }, { name: "Embreagem (kit)", cost: 850 },
  { name: "Bomba d'água", cost: 320 }, { name: "Alternador recondicionado", cost: 550 },
  { name: "Radiador", cost: 620 }, { name: "Vela de ignição (jogo)", cost: 120 },
  { name: "Fluido de freio (500ml)", cost: 40 }, { name: "Disco de freio (par)", cost: 340 },
  { name: "Tensor da correia", cost: 180 },
];

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split("T")[0];
}

function generateWorkOrders(count: number): WorkOrder[] {
  const orders: WorkOrder[] = [];
  for (let i = 0; i < count; i++) {
    const v = vehiclesData[Math.floor(Math.random() * vehiclesData.length)];
    const type: WOType = Math.random() < 0.55 ? "preventive" : "corrective";
    const statusRoll = Math.random();
    const status: WOStatus = statusRoll < 0.25 ? "open" : statusRoll < 0.5 ? "in_progress" : statusRoll < 0.9 ? "done" : "canceled";
    const opened = randomDate("2025-09-01", "2026-02-14");
    const descList = descriptions[type];
    const numParts = 1 + Math.floor(Math.random() * 4);
    const parts = Array.from({ length: numParts }, () => {
      const p = partsList[Math.floor(Math.random() * partsList.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      return { name: p.name, qty, cost: p.cost * qty };
    });
    const laborCost = 150 + Math.floor(Math.random() * 600);
    const partsCost = parts.reduce((s, p) => s + p.cost, 0);

    orders.push({
      id: `OS-${String(i + 1).padStart(4, "0")}`,
      vehicle_id: v.id,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model} ${v.year}`,
      type,
      status,
      opened_at: opened,
      closed_at: status === "done" || status === "canceled" ? randomDate(opened, "2026-02-14") : undefined,
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      cost_total: laborCost + partsCost,
      km_at_service: v.currentKm - Math.floor(Math.random() * 10000),
      description: descList[Math.floor(Math.random() * descList.length)],
      parts,
      unit: v.unit,
      priority: type === "corrective" ? (Math.random() < 0.3 ? "high" : "medium") : (Math.random() < 0.2 ? "medium" : "low"),
    });
  }
  return orders.sort((a, b) => b.opened_at.localeCompare(a.opened_at));
}

export const workOrders = generateWorkOrders(180);

// Maintenance Plans
export interface MaintenancePlan {
  id: string;
  modelPattern: string;
  brand: string;
  oilChangeKm: number;
  oilChangeMonths: number;
  revisionKm: number;
  revisionMonths: number;
  beltChangeKm: number;
  brakeCheckKm: number;
  tireRotateKm: number;
  vehicleCount: number;
}

export const maintenancePlans: MaintenancePlan[] = [
  { id: "1", modelPattern: "Strada / Argo / Mobi", brand: "Fiat", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 60000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "2", modelPattern: "Onix / Tracker / Montana", brand: "Chevrolet", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 60000, brakeCheckKm: 25000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "3", modelPattern: "Gol / Polo / Saveiro", brand: "Volkswagen", oilChangeKm: 15000, oilChangeMonths: 12, revisionKm: 30000, revisionMonths: 24, beltChangeKm: 60000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "4", modelPattern: "Hilux / Corolla / SW4", brand: "Toyota", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 100000, brakeCheckKm: 40000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "5", modelPattern: "HB20 / Creta / Tucson", brand: "Hyundai", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 60000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "6", modelPattern: "Kwid / Duster / Oroch", brand: "Renault", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 90000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "7", modelPattern: "Ranger / Territory", brand: "Ford", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 60000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "8", modelPattern: "HR-V / City / Civic", brand: "Honda", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 100000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "9", modelPattern: "Renegade / Compass", brand: "Jeep", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 60000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
  { id: "10", modelPattern: "Kicks / Frontier", brand: "Nissan", oilChangeKm: 10000, oilChangeMonths: 12, revisionKm: 20000, revisionMonths: 12, beltChangeKm: 100000, brakeCheckKm: 30000, tireRotateKm: 10000, vehicleCount: 85 },
];

// Scheduled services (agenda)
export interface ScheduledService {
  id: string;
  plate: string;
  vehicleLabel: string;
  unit: string;
  serviceType: string;
  dueDate: string;
  dueKm: number;
  currentKm: number;
  kmRemaining: number;
  daysRemaining: number;
  status: "on_time" | "approaching" | "overdue";
  supplier?: string;
}

function generateSchedule(): ScheduledService[] {
  const services: ScheduledService[] = [];
  const serviceTypes = [
    "Troca de óleo", "Revisão programada", "Alinhamento/Balanceamento",
    "Revisão de freios", "Troca de correia", "Rodízio de pneus",
  ];
  const today = new Date("2026-02-14");

  for (let i = 0; i < 60; i++) {
    const v = vehiclesData[Math.floor(Math.random() * Math.min(200, vehiclesData.length))];
    const svcType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const daysOffset = Math.floor(Math.random() * 60) - 15; // -15 to +45 days
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + daysOffset);
    const kmRemaining = Math.floor(Math.random() * 5000) - 1000;
    const status: ScheduledService["status"] = daysOffset < 0 || kmRemaining < 0 ? "overdue" : daysOffset < 7 || kmRemaining < 500 ? "approaching" : "on_time";

    services.push({
      id: `AG-${String(i + 1).padStart(3, "0")}`,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model}`,
      unit: v.unit,
      serviceType: svcType,
      dueDate: dueDate.toISOString().split("T")[0],
      dueKm: v.currentKm + kmRemaining,
      currentKm: v.currentKm,
      kmRemaining: Math.max(0, kmRemaining),
      daysRemaining: daysOffset,
      status,
      supplier: Math.random() > 0.4 ? suppliers[Math.floor(Math.random() * suppliers.length)] : undefined,
    });
  }
  return services.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export const scheduledServices = generateSchedule();

// Stats
export const maintenanceStats = {
  openWOs: workOrders.filter(w => w.status === "open").length,
  inProgressWOs: workOrders.filter(w => w.status === "in_progress").length,
  doneWOs: workOrders.filter(w => w.status === "done").length,
  canceledWOs: workOrders.filter(w => w.status === "canceled").length,
  totalCostMonth: workOrders.filter(w => w.opened_at >= "2026-02-01").reduce((s, w) => s + w.cost_total, 0),
  preventiveCount: workOrders.filter(w => w.type === "preventive").length,
  correctiveCount: workOrders.filter(w => w.type === "corrective").length,
  overdueServices: scheduledServices.filter(s => s.status === "overdue").length,
  approachingServices: scheduledServices.filter(s => s.status === "approaching").length,
  avgCostPreventive: Math.round(workOrders.filter(w => w.type === "preventive" && w.status === "done").reduce((s, w) => s + w.cost_total, 0) / Math.max(1, workOrders.filter(w => w.type === "preventive" && w.status === "done").length)),
  avgCostCorrective: Math.round(workOrders.filter(w => w.type === "corrective" && w.status === "done").reduce((s, w) => s + w.cost_total, 0) / Math.max(1, workOrders.filter(w => w.type === "corrective" && w.status === "done").length)),
};
