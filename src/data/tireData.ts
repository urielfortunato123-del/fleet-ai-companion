import { vehiclesData } from "./mockData";

// Tire positions
export type TirePosition = "DE" | "DD" | "TE" | "TD" | "EDE" | "EDD";
const positionLabels: Record<TirePosition, string> = {
  DE: "Dianteiro Esquerdo",
  DD: "Dianteiro Direito",
  TE: "Traseiro Esquerdo",
  TD: "Traseiro Direito",
  EDE: "Estepe Diant. Esq.",
  EDD: "Estepe Diant. Dir.",
};
export { positionLabels };

export type TireStatus = "good" | "attention" | "critical" | "replaced";

export interface Tire {
  id: string;
  plate: string;
  vehicleId: string;
  unit: string;
  position: TirePosition;
  brand: string;
  model: string;
  size: string;
  installedAt: string;
  installedKm: number;
  currentKm: number;
  lifeExpectedKm: number;
  depthMm: number; // tread depth
  status: TireStatus;
  costUnit: number;
}

export interface RotationRecord {
  id: string;
  plate: string;
  unit: string;
  date: string;
  km: number;
  from: Record<TirePosition, TirePosition>;
  cost: number;
  notes: string;
}

export interface ReplacementForecast {
  id: string;
  plate: string;
  unit: string;
  position: TirePosition;
  currentLifePct: number;
  estimatedReplaceDate: string;
  estimatedKm: number;
  costEstimate: number;
}

const tireBrands = ["Pirelli", "Michelin", "Continental", "Bridgestone", "Goodyear", "Firestone"];
const tireModels: Record<string, string[]> = {
  Pirelli: ["Cinturato P1", "Scorpion ATR", "P7"],
  Michelin: ["Energy XM2", "Primacy 4", "LTX Force"],
  Continental: ["PowerContact 2", "CrossContact AT", "ExtremeContact"],
  Bridgestone: ["Turanza ER300", "Dueler AT", "Ecopia EP150"],
  Goodyear: ["EfficientGrip", "Wrangler AT", "Eagle F1"],
  Firestone: ["F-600", "Destination AT", "Multihawk 2"],
};
const sizes = ["195/55 R15", "205/55 R16", "215/65 R16", "225/65 R17", "265/70 R16", "175/70 R14"];

function generateTires(): Tire[] {
  const tires: Tire[] = [];
  const positions: TirePosition[] = ["DE", "DD", "TE", "TD"];
  const subset = vehiclesData.slice(0, 120);

  for (const v of subset) {
    for (const pos of positions) {
      const brand = tireBrands[Math.floor(Math.random() * tireBrands.length)];
      const model = tireModels[brand][Math.floor(Math.random() * tireModels[brand].length)];
      const lifeExpected = 40000 + Math.floor(Math.random() * 30000);
      const usedKm = Math.floor(Math.random() * lifeExpected * 1.1);
      const lifePct = Math.min(1, usedKm / lifeExpected);
      const depth = Math.max(1, Math.round((1 - lifePct) * 8 * 10) / 10);
      const status: TireStatus = depth >= 4 ? "good" : depth >= 2 ? "attention" : "critical";

      tires.push({
        id: `tire-${v.id}-${pos}`,
        plate: v.plate,
        vehicleId: v.id,
        unit: v.unit,
        position: pos,
        brand,
        model,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        installedAt: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
        installedKm: v.currentKm - usedKm,
        currentKm: v.currentKm,
        lifeExpectedKm: lifeExpected,
        depthMm: depth,
        status,
        costUnit: 280 + Math.floor(Math.random() * 500),
      });
    }
  }
  return tires;
}

function generateRotations(): RotationRecord[] {
  const records: RotationRecord[] = [];
  const subset = vehiclesData.slice(0, 60);
  for (let i = 0; i < subset.length; i++) {
    const v = subset[i];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const month = Math.floor(Math.random() * 12) + 1;
      records.push({
        id: `rot-${v.id}-${j}`,
        plate: v.plate,
        unit: v.unit,
        date: `2025-${String(month).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
        km: v.currentKm - Math.floor(Math.random() * 30000),
        from: { DE: "TE", DD: "TD", TE: "DE", TD: "DD", EDE: "EDE", EDD: "EDD" },
        cost: 80 + Math.floor(Math.random() * 120),
        notes: ["Rodízio padrão", "Rodízio cruzado", "Rodízio com alinhamento", "Rodízio + balanceamento"][Math.floor(Math.random() * 4)],
      });
    }
  }
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

function generateForecasts(tires: Tire[]): ReplacementForecast[] {
  return tires
    .filter(t => t.status !== "replaced")
    .map(t => {
      const usedKm = t.currentKm - t.installedKm;
      const lifePct = Math.min(100, Math.round((usedKm / t.lifeExpectedKm) * 100));
      const remainKm = Math.max(0, t.lifeExpectedKm - usedKm);
      const daysLeft = Math.max(0, Math.round(remainKm / 80)); // ~80km/day
      const replaceDate = new Date();
      replaceDate.setDate(replaceDate.getDate() + daysLeft);

      return {
        id: `fc-${t.id}`,
        plate: t.plate,
        unit: t.unit,
        position: t.position,
        currentLifePct: lifePct,
        estimatedReplaceDate: replaceDate.toISOString().split("T")[0],
        estimatedKm: t.currentKm + remainKm,
        costEstimate: t.costUnit,
      };
    })
    .sort((a, b) => a.estimatedReplaceDate.localeCompare(b.estimatedReplaceDate));
}

export const tires = generateTires();
export const rotationHistory = generateRotations();
export const replacementForecasts = generateForecasts(tires);

// Aggregated stats
export function getTireStats() {
  const total = tires.length;
  const good = tires.filter(t => t.status === "good").length;
  const attention = tires.filter(t => t.status === "attention").length;
  const critical = tires.filter(t => t.status === "critical").length;

  const totalCost = tires.reduce((s, t) => s + t.costUnit, 0);
  const totalKm = tires.reduce((s, t) => s + (t.currentKm - t.installedKm), 0);
  const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0;

  const next30 = replacementForecasts.filter(f => {
    const d = new Date(f.estimatedReplaceDate);
    const now = new Date();
    return d.getTime() - now.getTime() < 30 * 86400000 && d.getTime() >= now.getTime();
  }).length;

  return { total, good, attention, critical, avgCostPerKm, next30, totalCost, rotationCount: rotationHistory.length };
}
