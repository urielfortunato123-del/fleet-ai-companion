import { vehiclesData } from "./mockData";

export interface FuelLog {
  id: string;
  vehicle_id: string;
  plate: string;
  vehicleLabel: string;
  unit: string;
  driver: string;
  date: string;
  liters: number;
  value: number;
  pricePerLiter: number;
  km: number;
  previousKm: number;
  kmDriven: number;
  consumption: number; // km/l
  station: string;
  fuelType: string;
}

const stations = [
  "Posto Shell Centro", "BR Distribuidora", "Ipiranga Rodovia", "Posto Ale Express",
  "Shell Select Mall", "BR Mania", "Ipiranga Centro", "Posto Raízen",
  "Total Energies", "Posto Petrobras", "YPF Combustíveis", "Posto Mix",
];

const fuelTypes = ["Gasolina", "Etanol", "Diesel S10", "Diesel S500"];
const driverNames = [
  "Carlos Silva", "Ana Santos", "João Oliveira", "Maria Costa", "Pedro Souza",
  "Fernanda Lima", "Ricardo Alves", "Camila Pereira", "Lucas Ferreira", "Juliana Rodrigues",
  "Marcos Ribeiro", "Patricia Gomes", "Roberto Martins", "Sandra Barbosa", "Antonio Cardoso",
];

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split("T")[0];
}

function generateFuelLogs(count: number): FuelLog[] {
  const logs: FuelLog[] = [];
  for (let i = 0; i < count; i++) {
    const v = vehiclesData[Math.floor(Math.random() * Math.min(300, vehiclesData.length))];
    const liters = 20 + Math.round(Math.random() * 40 * 10) / 10;
    const pricePerLiter = 5.2 + Math.round(Math.random() * 1.5 * 100) / 100;
    const kmDriven = 150 + Math.floor(Math.random() * 600);
    const consumption = Math.round((kmDriven / liters) * 10) / 10;
    const previousKm = v.currentKm - kmDriven - Math.floor(Math.random() * 5000);
    const fuelType = v.brand === "Ford" || v.brand === "Toyota" ? (Math.random() < 0.5 ? "Diesel S10" : "Gasolina") : (Math.random() < 0.8 ? "Gasolina" : "Etanol");

    logs.push({
      id: `FUEL-${String(i + 1).padStart(5, "0")}`,
      vehicle_id: v.id,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model}`,
      unit: v.unit,
      driver: v.driver || driverNames[Math.floor(Math.random() * driverNames.length)],
      date: randomDate("2025-09-01", "2026-02-14"),
      liters,
      value: Math.round(liters * pricePerLiter * 100) / 100,
      pricePerLiter,
      km: previousKm + kmDriven,
      previousKm,
      kmDriven,
      consumption,
      station: stations[Math.floor(Math.random() * stations.length)],
      fuelType,
    });
  }
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

export const fuelLogs = generateFuelLogs(600);

// Consumption by vehicle (aggregated)
export interface VehicleConsumption {
  plate: string;
  vehicleLabel: string;
  unit: string;
  totalLiters: number;
  totalValue: number;
  totalKm: number;
  avgConsumption: number;
  refuelCount: number;
  fleetAvg: number;
  deviation: number; // percentage deviation from fleet average
}

function aggregateConsumption(): VehicleConsumption[] {
  const map = new Map<string, { plate: string; label: string; unit: string; liters: number; value: number; km: number; count: number; consumptions: number[] }>();

  for (const log of fuelLogs) {
    const existing = map.get(log.plate);
    if (existing) {
      existing.liters += log.liters;
      existing.value += log.value;
      existing.km += log.kmDriven;
      existing.count++;
      existing.consumptions.push(log.consumption);
    } else {
      map.set(log.plate, {
        plate: log.plate,
        label: log.vehicleLabel,
        unit: log.unit,
        liters: log.liters,
        value: log.value,
        km: log.kmDriven,
        count: 1,
        consumptions: [log.consumption],
      });
    }
  }

  const allAvgs: number[] = [];
  const results: VehicleConsumption[] = [];

  for (const [, data] of map) {
    const avg = Math.round((data.km / data.liters) * 10) / 10;
    allAvgs.push(avg);
    results.push({
      plate: data.plate,
      vehicleLabel: data.label,
      unit: data.unit,
      totalLiters: Math.round(data.liters * 10) / 10,
      totalValue: Math.round(data.value * 100) / 100,
      totalKm: data.km,
      avgConsumption: avg,
      refuelCount: data.count,
      fleetAvg: 0,
      deviation: 0,
    });
  }

  const fleetAvg = Math.round((allAvgs.reduce((s, v) => s + v, 0) / allAvgs.length) * 10) / 10;

  for (const r of results) {
    r.fleetAvg = fleetAvg;
    r.deviation = Math.round(((r.avgConsumption - fleetAvg) / fleetAvg) * 100 * 10) / 10;
  }

  return results.sort((a, b) => a.avgConsumption - b.avgConsumption);
}

export const vehicleConsumptions = aggregateConsumption();
export const fleetAvgConsumption = vehicleConsumptions[0]?.fleetAvg || 9.2;

// Monthly fuel cost trend
export const monthlyFuelTrend = [
  { month: "Set", liters: 82000, value: 479700, avgConsumption: 9.0 },
  { month: "Out", liters: 78500, value: 462075, avgConsumption: 9.1 },
  { month: "Nov", liters: 85200, value: 506940, avgConsumption: 8.9 },
  { month: "Dez", liters: 80100, value: 480600, avgConsumption: 9.3 },
  { month: "Jan", liters: 83400, value: 500400, avgConsumption: 9.1 },
  { month: "Fev", liters: 76200, value: 457200, avgConsumption: 9.2 },
];

// Deviation histogram
export const deviationBuckets = [
  { range: "< -30%", count: vehicleConsumptions.filter(v => v.deviation < -30).length, color: "hsl(0, 72%, 51%)" },
  { range: "-30 a -15%", count: vehicleConsumptions.filter(v => v.deviation >= -30 && v.deviation < -15).length, color: "hsl(0, 72%, 65%)" },
  { range: "-15 a -5%", count: vehicleConsumptions.filter(v => v.deviation >= -15 && v.deviation < -5).length, color: "hsl(38, 92%, 50%)" },
  { range: "-5 a +5%", count: vehicleConsumptions.filter(v => v.deviation >= -5 && v.deviation <= 5).length, color: "hsl(142, 71%, 45%)" },
  { range: "+5 a +15%", count: vehicleConsumptions.filter(v => v.deviation > 5 && v.deviation <= 15).length, color: "hsl(142, 71%, 55%)" },
  { range: "> +15%", count: vehicleConsumptions.filter(v => v.deviation > 15).length, color: "hsl(217, 91%, 60%)" },
];

// Fuel stats
export const fuelStats = {
  totalLitersMonth: fuelLogs.filter(l => l.date >= "2026-02-01").reduce((s, l) => s + l.liters, 0),
  totalValueMonth: fuelLogs.filter(l => l.date >= "2026-02-01").reduce((s, l) => s + l.value, 0),
  avgPrice: Math.round((fuelLogs.reduce((s, l) => s + l.pricePerLiter, 0) / fuelLogs.length) * 100) / 100,
  fleetAvg: fleetAvgConsumption,
  belowAvgCount: vehicleConsumptions.filter(v => v.deviation < -15).length,
  totalRefuels: fuelLogs.length,
};

// CSV import mock preview
export interface CSVPreviewRow {
  plate: string;
  date: string;
  liters: string;
  value: string;
  km: string;
  station: string;
  valid: boolean;
  error?: string;
}

export const csvPreviewSample: CSVPreviewRow[] = [
  { plate: "AAB3C12", date: "2026-02-10", liters: "42.5", value: "267.75", km: "45230", station: "Shell Centro", valid: true },
  { plate: "BBD5E67", date: "2026-02-10", liters: "38.0", value: "239.40", km: "62100", station: "BR Distribuidora", valid: true },
  { plate: "CCF7G89", date: "2026-02-11", liters: "55.2", value: "347.76", km: "38900", station: "Ipiranga Rodovia", valid: true },
  { plate: "INVALID", date: "2026-02-11", liters: "30.0", value: "189.00", km: "12000", station: "Posto Ale", valid: false, error: "Placa não encontrada" },
  { plate: "DDH9I01", date: "2026-02-12", liters: "-5.0", value: "31.50", km: "71000", station: "Shell Select", valid: false, error: "Litragem inválida" },
  { plate: "EEJ1K23", date: "2026-02-12", liters: "45.8", value: "288.54", km: "55400", station: "BR Mania", valid: true },
  { plate: "AAB3C12", date: "2026-02-13", liters: "40.1", value: "252.63", km: "45680", station: "Ipiranga Centro", valid: true },
  { plate: "FFB2L34", date: "2026-13-01", liters: "35.0", value: "220.50", km: "28300", station: "Posto Raízen", valid: false, error: "Data inválida" },
];
